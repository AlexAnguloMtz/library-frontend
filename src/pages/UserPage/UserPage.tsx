import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, Tab, Box, Typography, IconButton, TextField, FormControl, InputLabel, Select, MenuItem, Skeleton, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, InputAdornment } from '@mui/material';
import { ArrowBack, CameraAlt, Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import './styles.css';
import userService from '../../services/UserService';
import type { FullUser } from '../../models/FullUser';
import type { UserOptionsResponse } from '../../models/UserOptionsResponse';
import type { UpdateProfilePictureRequest } from '../../models/UpdateProfilePictureRequest';
import type { UpdateProfilePictureResponse } from '../../models/UpdateProfilePictureResponse';
import type { PersonalDataRequest } from '../../models/PersonalDataRequest';
import type { UserAddressRequest } from '../../models/UserAddressRequest';
import type { ChangePasswordRequest } from '../../models/ChangePasswordRequest';
import { Button } from '../../components/Button';
import { CopyToClipboard } from '../../components/CopyToClipboard/CopyToClipboard';
import authenticationHelper from '../../util/AuthenticationHelper';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import * as dateHelper from '../../util/DateHelper';

const EMPTY_FIELD_TEXT = '---';

// Schema de validación para datos personales
const personalDataSchema = z.object({
    firstName: z.string()
        .min(1, 'El nombre es requerido')
        .max(100, 'El nombre no puede exceder 100 caracteres'),
    lastName: z.string()
        .min(1, 'El apellido es requerido')
        .max(100, 'El apellido no puede exceder 100 caracteres'),
    phone: z.string()
        .min(1, 'El teléfono es requerido')
        .regex(/^\d{10}$/, 'El teléfono debe tener exactamente 10 dígitos numéricos'),
    genderId: z.string().min(1, 'El género es requerido'),
    dateOfBirth: z.date("La fecha de nacimiento es requerida")
        .min(new Date('1900-01-01'), 'La fecha de nacimiento debe ser mayor a 1900')
        .max(new Date(), 'La fecha de nacimiento no puede ser mayor a la fecha actual')
});

type PersonalDataFormData = z.infer<typeof personalDataSchema>;

// Schema de validación para datos de domicilio
const addressSchema = z.object({
    address: z.string()
        .min(1, 'La calle y número es requerida')
        .max(100, 'La calle y número no puede exceder 100 caracteres'),
    zipCode: z.string()
        .min(1, 'El código postal es requerido')
        .regex(/^\d{5}$/, 'El código postal debe tener exactamente 5 dígitos numéricos'),
    district: z.string()
        .min(1, 'La colonia es requerida')
        .max(100, 'La colonia no puede exceder 100 caracteres'),
    city: z.string()
        .min(1, 'La ciudad es requerida')
        .max(100, 'La ciudad no puede exceder 100 caracteres'),
    stateId: z.string().min(1, 'El estado es requerido')
});

type AddressFormData = z.infer<typeof addressSchema>;

// Schema de validación para cuenta
const accountSchema = z.object({
    email: z.string()
        .min(1, 'El email es requerido')
        .email('Debe ser un email válido')
        .max(100, 'El email no puede exceder 100 caracteres'),
    roleId: z.string().min(1, 'El rol es requerido')
});

type AccountFormData = z.infer<typeof accountSchema>;

// Schema de validación para contraseña
const passwordSchema = z.object({
    password: z.string()
        .min(1, 'La contraseña es requerida')
        .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmedPassword: z.string()
        .min(1, 'La confirmación de contraseña es requerida')
}).refine((data) => data.password === data.confirmedPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmedPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

enum UserPageStatus {
    IDLE = 'idle',
    LOADING = 'loading',
    ERROR = 'error',
    SUCCESS = 'success'
}

type UserPageState = 
    | { status: UserPageStatus.IDLE }
    | { status: UserPageStatus.LOADING }
    | { status: UserPageStatus.ERROR; error: string }
    | { status: UserPageStatus.SUCCESS; user: FullUser };

const UserPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [state, setState] = useState<UserPageState>({ status: UserPageStatus.IDLE });
    
    // Estado separado para userOptions
    const [userOptions, setUserOptions] = useState<UserOptionsResponse | null>(null);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    
    const [ageState, setAgeState] = useState<number>(0);

    // Calcular userId una vez para usar en todas las funciones
    const getUserId = (): string | null => {
        if (id) return id;
        
        const auth = authenticationHelper.getAuthentication();
        if (auth && auth.userId) {
            return auth.userId;
        }
        
        return null;
    };

    // Función para cargar userOptions de manera lazy
    const loadUserOptions = async (): Promise<void> => {
        // Si ya están cargados, no volver a cargar
        if (userOptions) return;
        
        // Si ya está cargando, no volver a cargar
        if (isLoadingOptions) return;
        
        setIsLoadingOptions(true);
        
        try {
            const options = await userService.getUserOptions();
            setUserOptions(options);
        } catch (error) {
            // Fallar silenciosamente - no hacer nada
            console.warn('Error loading user options:', error);
        } finally {
            setIsLoadingOptions(false);
        }
    };

    // Función para verificar si el usuario tiene permisos de edición
    const hasEditPermission = (): boolean => {
        if (state.status !== UserPageStatus.SUCCESS) return false;
        return state.user.permissions.includes('edit');
    };
    const [activeTab, setActiveTab] = useState(0);
    const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [isEditingAccount, setIsEditingAccount] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    
    // Estados para edición de foto de perfil
    const [profilePictureModalOpen, setProfilePictureModalOpen] = useState(false);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
    const [isUpdatingProfilePicture, setIsUpdatingProfilePicture] = useState(false);
    const [profilePictureError, setProfilePictureError] = useState<string | null>(null);
    const [profilePictureSuccess, setProfilePictureSuccess] = useState(false);
    
    // Estados para edición de datos personales
    const [personalDataModalOpen, setPersonalDataModalOpen] = useState(false);
    const [isUpdatingPersonalData, setIsUpdatingPersonalData] = useState(false);
    const [personalDataError, setPersonalDataError] = useState<string | null>(null);
    const [personalDataSuccess, setPersonalDataSuccess] = useState(false);
    
    // Estados para edición de domicilio
    const [addressModalOpen, setAddressModalOpen] = useState(false);
    const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
    const [addressError, setAddressError] = useState<string | null>(null);
    const [addressSuccess, setAddressSuccess] = useState(false);

    // Estados para edición de cuenta
    const [accountModalOpen, setAccountModalOpen] = useState(false);
    const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
    const [accountError, setAccountError] = useState<string | null>(null);
    const [accountSuccess, setAccountSuccess] = useState(false);

    // Estados para edición de contraseña
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    
    // Estados para eliminar usuario
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeletingUser, setIsDeletingUser] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deleteSuccess, setDeleteSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Formulario para datos personales
    const personalDataForm = useForm<PersonalDataFormData>({
        resolver: zodResolver(personalDataSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            phone: '',
            genderId: '',
            dateOfBirth: new Date()
        }
    });

    // Formulario para domicilio
    const addressForm = useForm<AddressFormData>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            address: '',
            zipCode: '',
            district: '',
            city: '',
            stateId: ''
        }
    });

    // Formulario para cuenta
    const accountForm = useForm<AccountFormData>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            email: '',
            roleId: ''
        }
    });

    // Formulario para contraseña
    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            password: '',
            confirmedPassword: ''
        }
    });

    useEffect(() => {
        if (state.status === UserPageStatus.SUCCESS) {
            const localDate = dateHelper.parseLocalDate(state.user.dateOfBirth);
            personalDataForm.reset({
                firstName: state.user.firstName,
                lastName: state.user.lastName,
                phone: state.user.phone,
                genderId: state.user.gender.id,
                dateOfBirth: localDate
            });
            
            addressForm.reset({
                address: state.user.address?.address || '',
                zipCode: state.user.address?.zipCode || '',
                district: state.user.address?.district || '',
                city: state.user.address?.city || '',
                stateId: state.user.address?.state.id || ''
            });

            accountForm.reset({
                email: state.user.email,
                roleId: state.user.role.id
            });

        }
    }, [state.status, personalDataForm, addressForm, accountForm]);

    const loadUserData = async () => {
        const userId = getUserId();
        
        if (!userId) {
            navigate('/dashboard/users');
            return;
        }

        setState({ status: UserPageStatus.LOADING });
        
        try {
            const user = await userService.getFullUserById(userId);
            setState({ 
                status: UserPageStatus.SUCCESS, 
                user
            });
            setAgeState(user.age);
        } catch (error) {
            setState({ 
                status: UserPageStatus.ERROR, 
                error: error instanceof Error ? error.message : 'Error desconocido' 
            });
        }
    };

    const handleRetry = () => {
        loadUserData();
    };

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };


    const handleGoBack = () => {
        navigate(-1);
    };

    // Funciones para eliminar usuario
    const handleDeleteUserClick = () => {
        setDeleteModalOpen(true);
        setDeleteError(null);
        setDeleteSuccess(false);
    };

    const handleDeleteUserCancel = () => {
        if (!isDeletingUser) {
            setDeleteModalOpen(false);
            setDeleteError(null);
            setDeleteSuccess(false);
        }
    };

    const handleDeleteUserConfirm = async () => {
        const userId = getUserId();
        if (!userId) return;
        
        setIsDeletingUser(true);
        setDeleteError(null);
        setDeleteSuccess(false);
        
        try {
            await userService.deleteUserById(userId);
            setDeleteSuccess(true);
        } catch (error: any) {
            console.error('Error deleting user:', error);
            setDeleteError(error.message || 'Error al eliminar el usuario. Inténtalo de nuevo.');
        } finally {
            setIsDeletingUser(false);
        }
    };

    const handleReturnToUsers = () => {
        navigate('/dashboard/users');
    };

    // Funciones para edición de foto de perfil
    const handleEditProfilePicture = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
                setSelectedImageFile(file);
                const reader = new FileReader();
                reader.onload = (e) => {
                    setSelectedImagePreview(e.target?.result as string);
                    setProfilePictureModalOpen(true);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    const handleCloseProfilePictureModal = () => {
        setProfilePictureModalOpen(false);
        setSelectedImageFile(null);
        setSelectedImagePreview(null);
        setProfilePictureError(null);
        setProfilePictureSuccess(false);
    };

    // Funciones para datos personales
    const handleSavePersonalData = () => {
        setPersonalDataModalOpen(true);
        setPersonalDataError(null);
        setPersonalDataSuccess(false);
    };

    const handleClosePersonalDataModal = () => {
        if (!isUpdatingPersonalData) {
            setPersonalDataModalOpen(false);
            setPersonalDataError(null);
            setPersonalDataSuccess(false);
        }
    };

    const handleConfirmPersonalDataUpdate = async () => {
        const userId = getUserId();
        if (!userId) return;

        setIsUpdatingPersonalData(true);
        setPersonalDataError(null);
        setPersonalDataSuccess(false);

        try {
            const formData = personalDataForm.getValues();
            const request: PersonalDataRequest = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                genderId: formData.genderId,
                dateOfBirth: formData.dateOfBirth
            };

            const response = await userService.updateUserPersonalData(userId, request);
            setAgeState(response.age);
            // Actualizar el estado del usuario con los nuevos datos
        if (state.status === UserPageStatus.SUCCESS) {
                setState({
                    status: UserPageStatus.SUCCESS,
                    user: {
                        ...state.user,
                        firstName: response.firstName,
                        lastName: response.lastName,
                        phone: response.phone,
                        gender: response.gender,
                        dateOfBirth: response.dateOfBirth
                    }
                });
            }

            setPersonalDataSuccess(true);
            setIsEditingBasicInfo(false);
        } catch (error: any) {
            console.error('Error updating personal data:', error);
            setPersonalDataError(error.message || 'Error al actualizar los datos personales. Inténtalo de nuevo.');
        } finally {
            setIsUpdatingPersonalData(false);
        }
    };

    // Funciones para domicilio
    const handleSaveAddress = () => {
        setAddressModalOpen(true);
        setAddressError(null);
        setAddressSuccess(false);
    };

    const handleCloseAddressModal = () => {
        if (!isUpdatingAddress) {
            setAddressModalOpen(false);
            setAddressError(null);
            setAddressSuccess(false);
        }
    };

    const handleConfirmAddressUpdate = async () => {
        const userId = getUserId();
        if (!userId) return;

        setIsUpdatingAddress(true);
        setAddressError(null);
        setAddressSuccess(false);

        try {
            const formData = addressForm.getValues();
            const request: UserAddressRequest = {
                address: formData.address,
                zipCode: formData.zipCode,
                district: formData.district,
                city: formData.city,
                stateId: formData.stateId
            };

            const response = await userService.updateUserAddress(userId, request);
            
            // Actualizar el estado del usuario con los nuevos datos
            if (state.status === UserPageStatus.SUCCESS) {
                setState({
                    status: UserPageStatus.SUCCESS,
                    user: {
                        ...state.user,
                        address: response
                    }
                });
            }

            setAddressSuccess(true);
            setIsEditingAddress(false);
        } catch (error: any) {
            console.error('Error updating address:', error);
            setAddressError(error.message || 'Error al actualizar el domicilio. Inténtalo de nuevo.');
        } finally {
            setIsUpdatingAddress(false);
        }
    };

    // Funciones para cuenta
    const handleCloseAccountModal = () => {
        if (!isUpdatingAccount) {
            setAccountModalOpen(false);
            setAccountError(null);
            setAccountSuccess(false);
        }
    };

    const handleConfirmAccountUpdate = async () => {
        const userId = getUserId();
        if (!userId) return;

        setIsUpdatingAccount(true);
        setAccountError(null);
        setAccountSuccess(false);

        try {
            const formData = accountForm.getValues();
            const request = {
                email: formData.email,
                roleId: formData.roleId
            };

            const response = await userService.updateUserAccount(userId, request);

            if (state.status === UserPageStatus.SUCCESS) {
                setState({
                    status: UserPageStatus.SUCCESS,
                    user: {
                        ...state.user,
                        email: response.email,
                        role: response.role,
                        permissions: response.permissions
                    }
                });
            }

            setAccountSuccess(true);
            setIsEditingAccount(false);
        } catch (error: any) {
            console.error('Error updating account:', error);
            setAccountError(error.message || 'Error al actualizar la cuenta. Inténtalo de nuevo.');
        } finally {
            setIsUpdatingAccount(false);
        }
    };

    // Funciones para contraseña
    const handleClosePasswordModal = () => {
        if (!isUpdatingPassword) {
            setPasswordModalOpen(false);
            setPasswordError(null);
            setPasswordSuccess(false);
        }
    };

    const handleConfirmPasswordUpdate = async () => {
        const userId = getUserId();
        if (!userId) return;

        setIsUpdatingPassword(true);
        setPasswordError(null);
        setPasswordSuccess(false);

        try {
            const formData = passwordForm.getValues();
            const request: ChangePasswordRequest = {
                password: formData.password,
                confirmedPassword: formData.confirmedPassword
            };

            await userService.changePassword(userId, request);

            setPasswordSuccess(true);
            setIsEditingPassword(false);
            // Limpiar el formulario después del éxito
            passwordForm.reset({
                password: '',
                confirmedPassword: ''
            });
            setShowPassword(false);
            setShowConfirmPassword(false);
        } catch (error: any) {
            console.error('Error updating password:', error);
            setPasswordError(error.message || 'Error al cambiar la contraseña. Inténtalo de nuevo.');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleSaveProfilePicture = async () => {
        if (!selectedImageFile) return;
        
        const userId = getUserId();
        if (!userId) return;
        
        setIsUpdatingProfilePicture(true);
        setProfilePictureError(null);
        
        try {
            const request: UpdateProfilePictureRequest = {
                profilePicture: selectedImageFile
            };
            
            const response: UpdateProfilePictureResponse = await userService.updateProfilePicture(userId, request);
            
            // Actualizar la imagen en el estado
            if (state.status === UserPageStatus.SUCCESS) {
                setState({
                    ...state,
                    user: {
                        ...state.user,
                        profilePictureUrl: response.profilePictureUrl
                    }
                });
            }
            
            setProfilePictureSuccess(true);
        } catch (error: any) {
            setProfilePictureError(error.message || 'Error al actualizar la foto de perfil');
        } finally {
            setIsUpdatingProfilePicture(false);
        }
    };

    useEffect(() => {
        loadUserData();
    }, [location.pathname]); // Se ejecuta cuando cambia la ruta completa

    const dateOfBirth = personalDataForm.watch("dateOfBirth");

    const renderContent = () => {
        switch (state.status) {
            case UserPageStatus.IDLE:
                return <div>Iniciando...</div>;
            
            case UserPageStatus.LOADING:
                return (
                    <Box sx={{ width: '100%' }}>
                        {/* Sección Superior - Skeleton */}
                        <Box sx={{ 
                            display: 'flex', 
                            gap: 3, 
                            mb: 4,
                            p: 3
                        }}>
                            {/* Caja Izquierda - Foto Skeleton */}
                            <Box sx={{ 
                                width: 240, 
                                height: 274,
                                backgroundColor: '#f5f5f5',
                                borderRadius: 1
                            }}>
                                <Skeleton variant="rectangular" width="100%" height="100%" />
                            </Box>

                            {/* Caja Derecha - Información Skeleton */}
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {/* Nombre y ID */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Skeleton variant="text" width="60%" height={32} />
                                    <Skeleton variant="text" width="40%" height={20} />
                                </Box>
                                
                                {/* Información de contacto */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Skeleton variant="text" width="70%" height={20} />
                                    <Skeleton variant="text" width="50%" height={20} />
                                </Box>
                                
                                {/* Rol */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Skeleton variant="text" width="30%" height={20} />
                                    <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 3 }} />
                                </Box>
                                
                                {/* Fecha de registro */}
                                <Skeleton variant="text" width="45%" height={20} />
                            </Box>
                        </Box>

                        {/* Tabs Skeleton */}
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                            <Box sx={{ display: 'flex', gap: 3, px: 3 }}>
                                <Skeleton variant="text" width={80} height={40} />
                                <Skeleton variant="text" width={120} height={40} />
                                <Skeleton variant="text" width={100} height={40} />
                            </Box>
                        </Box>

                        {/* Contenido de tabs skeleton */}
                        <Box sx={{ px: 3 }}>
                            <Skeleton variant="text" width="100%" height={200} />
                        </Box>
                    </Box>
                );
            
            case UserPageStatus.ERROR:
                return (
                    <div>
                        <p>Error: {state.error}</p>
                        <button onClick={handleRetry}>Reintentar</button>
                    </div>
                );
            
            case UserPageStatus.SUCCESS:
                function log(arg0: any): any {
                    alert(arg0);
                    return arg0;
                }

                return (
                    <Box sx={{ width: '100%' }}>
                        {/* Sección Superior */}
                        <Box sx={{ 
                            display: 'flex', 
                            gap: 3, 
                            mb: 4,
                            p: 3
                        }}>
                            {/* Caja Izquierda - Foto */}
                            <Box sx={{ 
                                width: 240, 
                                height: 274,
                                backgroundColor: '#f5f5f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                            }}>
                                {state.user.profilePictureUrl ? (
                                    <img 
                                        src={state.user.profilePictureUrl} 
                                        alt="Foto de perfil"
                                        style={{ 
                                            width: '100%', 
                                            height: '100%', 
                                            objectFit: 'cover' 
                                        }}
                                    />
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Sin foto
                                    </Typography>
                                )}
                            </Box>

                            {/* Caja Derecha - Información */}
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
                                    {state.user.firstName} {state.user.lastName}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        ID: {state.user.id}
                                    </Typography>
                                    <CopyToClipboard 
                                        text={state.user.id}
                                        size="small" 
                                        sx={{ ml: 1 }}
                                    />
                                </Box>
                                
                                {/* Rol del usuario */}
                                <Box sx={{ mt: 1 }}>
                                    <Box
                                        sx={{
                                            display: 'inline-block',
                                            padding: '8px 16px',
                                            borderRadius: '16px',
                                            fontSize: '14px',
                                            fontWeight: 500,
                                            backgroundColor: state.user.role.slug === 'ADMIN' ? '#DC2626' : 
                                                           state.user.role.slug === 'LIBRARIAN' ? '#2563EB' : '#16A34A',
                                            color: '#ffffff'
                                        }}
                                    >
                                        {state.user.role.name}
                                    </Box>
                                </Box>
                                
                                {/* Botón de editar foto */}
                                <Box sx={{ mt: 2 }}>
                                    {hasEditPermission() && (
                                    <Button 
                                        type="secondary" 
                                        onClick={handleEditProfilePicture}
                                        startIcon={<CameraAlt />}
                                        sx={{ 
                                            fontSize: '0.75rem',
                                            padding: '6px 12px',
                                            minWidth: 'auto'
                                        }}
                                    >
                                        Cambiar foto
                                    </Button>
                                    )}
                                </Box>
                            </Box>
                        </Box>

                        {/* Sección Inferior - Pestañas */}
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs value={activeTab} onChange={handleTabChange}>
                                <Tab label="Préstamos" />
                                <Tab label="Datos personales" />
                                <Tab label="Cuenta" />
                            </Tabs>
                        </Box>

                        {/* Contenido de las pestañas */}
                        <Box sx={{ mt: 3, pb: 24, px: 3 }}>
                            {activeTab === 0 && (
                                <Typography>Contenido de Préstamos</Typography>
                            )}
                            {activeTab === 1 && (
                                <Box>
                                    {/* Información Básica */}
                                    <Box sx={{ mb: 4 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                Información Básica
                                            </Typography>
                                            {isEditingBasicInfo ? (
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button type="secondary" onClick={() => {
                                                        // Resetear el formulario a los valores originales
                                                        if (state.status === UserPageStatus.SUCCESS) {
                                                            personalDataForm.reset({
                                                                firstName: state.user.firstName,
                                                                lastName: state.user.lastName,
                                                                phone: state.user.phone,
                                                                genderId: state.user.gender.id,
                                                                dateOfBirth: new Date(state.user.dateOfBirth)
                                                            });
                                                        }
                                                        setIsEditingBasicInfo(false);
                                                    }}>
                                                        Cancelar
                                                    </Button>
                                                    <Button type="primary" onClick={personalDataForm.handleSubmit(handleSavePersonalData)}>
                                                        Guardar
                                                    </Button>
                                                </Box>
                                            ) : (
                                                hasEditPermission() && (
                                                    <Button type="primary" onClick={async () => {
                                                        await loadUserOptions();
                                                        setIsEditingBasicInfo(true);
                                                    }}>
                                                    Editar
                                                </Button>
                                                )
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: isEditingBasicInfo ? 'flex-start' : 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120, pt: isEditingBasicInfo ? 0.5 : 0 }}>
                                                    Nombre:
                                                </Typography>
                                                {isEditingBasicInfo ? (
                                                    <Controller
                                                        name="firstName"
                                                        control={personalDataForm.control}
                                                        render={({ field, fieldState }) => (
                                                    <TextField
                                                                {...field}
                                                        variant="outlined"
                                                        size="small"
                                                                error={!!fieldState.error}
                                                                helperText={fieldState.error?.message}
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                            />
                                                        )}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.firstName}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: isEditingBasicInfo ? 'flex-start' : 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120, pt: isEditingBasicInfo ? 0.5 : 0 }}>
                                                    Apellido:
                                                </Typography>
                                                {isEditingBasicInfo ? (
                                                    <Controller
                                                        name="lastName"
                                                        control={personalDataForm.control}
                                                        render={({ field, fieldState }) => (
                                                    <TextField
                                                                {...field}
                                                        variant="outlined"
                                                        size="small"
                                                                error={!!fieldState.error}
                                                                helperText={fieldState.error?.message}
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                            />
                                                        )}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.lastName}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: isEditingBasicInfo ? 'flex-start' : 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120, pt: isEditingBasicInfo ? 0.5 : 0 }}>
                                                    Teléfono:
                                                </Typography>
                                                {isEditingBasicInfo ? (
                                                    <Controller
                                                        name="phone"
                                                        control={personalDataForm.control}
                                                        render={({ field, fieldState }) => (
                                                    <TextField
                                                                {...field}
                                                        variant="outlined"
                                                        size="small"
                                                                error={!!fieldState.error}
                                                                helperText={fieldState.error?.message}
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                            />
                                                        )}
                                                    />
                                                ) : (
                                                    <Box sx={{ display: 'flex', alignItems: isEditingAddress ? 'flex-start' : 'center', gap: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.phone}
                                                    </Typography>
                                                        <CopyToClipboard 
                                                            text={state.user.phone}
                                                            size="small"
                                                        />
                                                    </Box>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: isEditingBasicInfo ? 'flex-start' : 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120, pt: isEditingBasicInfo ? 0.5 : 0 }}>
                                                    Género:
                                                </Typography>
                                                {isEditingBasicInfo ? (
                                                    <Controller
                                                        name="genderId"
                                                        control={personalDataForm.control}
                                                        render={({ field, fieldState }) => (
                                                            <FormControl size="small" sx={{ width: 300 }} error={!!fieldState.error}>
                                                                <InputLabel>Género</InputLabel>
                                                                <Select
                                                                    {...field}
                                                                    label="Género"
                                                                    sx={{ 
                                                                        '& .MuiOutlinedInput-root': {
                                                                            fontSize: '0.875rem'
                                                                        }
                                                                    }}
                                                                >
                                                                    {userOptions?.genders.map((gender) => (
                                                                        <MenuItem key={gender.value} value={gender.value}>
                                                                            {gender.label}
                                                                        </MenuItem>
                                                                    ))}
                                                                </Select>
                                                                {fieldState.error && (
                                                                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                                                        {fieldState.error.message}
                                                                    </Typography>
                                                                )}
                                                            </FormControl>
                                                        )}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.gender.name}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: isEditingBasicInfo ? 'flex-start' : 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120, pt: isEditingBasicInfo ? 0.5 : 0 }}>
                                                    Fecha nacimiento:
                                                </Typography>
                                            {isEditingBasicInfo ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                                                <DatePicker
                                                slotProps={{ textField: { size: 'small', sx: { width: '300px' } } }} 
                                                  label="Fecha de nacimiento"
                                                  value={
                                                    dateOfBirth ? (dayjs(dateOfBirth)) : null 
                                                  }
                                                  onChange={(date) => {
                                                    personalDataForm.setValue(
                                                      "dateOfBirth",
                                                      date?.toDate() ?? new Date()
                                                    );
                                                  }}
                                                />
                                              </LocalizationProvider>
                                              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                                {personalDataForm.formState.errors.dateOfBirth?.message}
                                               </Typography>
                                               </div>
                                            ) : (
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {(dayjs(personalDataForm.getValues('dateOfBirth')).format('DD/MMM/YYYY'))}
                                                </Typography>
                                            )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: isEditingBasicInfo ? 'flex-start' : 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120, pt: isEditingBasicInfo ? 0.5 : 0 }}>
                                                    Edad:
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {ageState} años
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Domicilio */}
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                Domicilio
                                            </Typography>
                                            {isEditingAddress ? (
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button type="secondary" onClick={() => {
                                                        if (state.status === UserPageStatus.SUCCESS) {
                                                            addressForm.reset({
                                                                address: state.user.address?.address,
                                                                zipCode: state.user.address?.zipCode,
                                                                district: state.user.address?.district,
                                                                city: state.user.address?.city,
                                                                stateId: state.user.address?.state.id
                                                            });
                                                        }
                                                        setIsEditingAddress(false);
                                                    }}>
                                                        Cancelar
                                                    </Button>
                                                    <Button type="primary" onClick={addressForm.handleSubmit(handleSaveAddress)}>
                                                        Guardar
                                                    </Button>
                                                </Box>
                                            ) : (
                                                hasEditPermission() && (
                                                    <Button type="primary" onClick={async () => {
                                                        await loadUserOptions();
                                                        setIsEditingAddress(true);
                                                    }}>
                                                    Editar
                                                </Button>
                                                )
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: isEditingAddress ? 'flex-start' : 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120, pt: isEditingAddress ? 0.5 : 0 }}>
                                                    Estado:
                                                </Typography>
                                                {isEditingAddress ? (
                                                    <Controller
                                                        name="stateId"
                                                        control={addressForm.control}
                                                        render={({ field, fieldState }) => (
                                                            <FormControl size="small" sx={{ width: 300 }} error={!!fieldState.error}>
                                                        <InputLabel>Estado</InputLabel>
                                                        <Select
                                                                    {...field}
                                                            label="Estado"
                                                            sx={{ 
                                                                '& .MuiOutlinedInput-root': {
                                                                    fontSize: '0.875rem'
                                                                }
                                                            }}
                                                        >
                                                            {userOptions?.states.map((stateOption) => (
                                                                        <MenuItem key={stateOption.value} value={stateOption.value}>
                                                                            {stateOption.label}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                                {fieldState.error && (
                                                                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                                                        {fieldState.error.message}
                                                                    </Typography>
                                                                )}
                                                    </FormControl>
                                                        )}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.address?.state.name || EMPTY_FIELD_TEXT}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: isEditingAddress ? 'flex-start' : 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120, pt: isEditingAddress ? 0.5 : 0 }}>
                                                    Ciudad:
                                                </Typography>
                                                {isEditingAddress ? (
                                                    <Controller
                                                        name="city"
                                                        control={addressForm.control}
                                                        render={({ field, fieldState }) => (
                                                    <TextField
                                                                {...field}
                                                        variant="outlined"
                                                        size="small"
                                                                error={!!fieldState.error}
                                                                helperText={fieldState.error?.message}
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                            />
                                                        )}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.address?.city || EMPTY_FIELD_TEXT}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: isEditingAddress ? 'flex-start' : 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120, pt: isEditingAddress ? 0.5 : 0 }}>
                                                    Calle y número:
                                                </Typography>
                                                {isEditingAddress ? (
                                                    <Controller
                                                        name="address"
                                                        control={addressForm.control}
                                                        render={({ field, fieldState }) => (
                                                    <TextField
                                                                {...field}
                                                        variant="outlined"
                                                        size="small"
                                                                error={!!fieldState.error}
                                                                helperText={fieldState.error?.message}
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                            />
                                                        )}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.address?.address || EMPTY_FIELD_TEXT}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: isEditingAddress ? 'flex-start' : 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120, pt: isEditingAddress ? 0.5 : 0 }}>
                                                    Colonia:
                                                </Typography>
                                                {isEditingAddress ? (
                                                    <Controller
                                                        name="district"
                                                        control={addressForm.control}
                                                        render={({ field, fieldState }) => (
                                                    <TextField
                                                                {...field}
                                                        variant="outlined"
                                                        size="small"
                                                                error={!!fieldState.error}
                                                                helperText={fieldState.error?.message}
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                            />
                                                        )}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.address?.district || EMPTY_FIELD_TEXT}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: isEditingAddress ? 'flex-start' : 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120, pt: isEditingAddress ? 0.5 : 0 }}>
                                                    Código Postal:
                                                </Typography>
                                                {isEditingAddress ? (
                                                    <Controller
                                                        name="zipCode"
                                                        control={addressForm.control}
                                                        render={({ field, fieldState }) => (
                                                    <TextField
                                                                {...field}
                                                        variant="outlined"
                                                        size="small"
                                                                error={!!fieldState.error}
                                                                helperText={fieldState.error?.message}
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                            />
                                                        )}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.address?.zipCode || EMPTY_FIELD_TEXT}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            )}
                            {activeTab === 2 && (
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            Información de Cuenta
                                        </Typography>
                                        {isEditingAccount ? (
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button type="secondary" onClick={() => {
                                                    if (state.status === UserPageStatus.SUCCESS) {
                                                        accountForm.reset({
                                                            email: state.user.email,
                                                            roleId: state.user.role.id
                                                        });
                                                    }
                                                    setIsEditingAccount(false);
                                                }}>
                                                    Cancelar
                                                </Button>
                                                <Button type="primary" onClick={accountForm.handleSubmit(() => setAccountModalOpen(true))}>
                                                    Guardar
                                                </Button>
                                            </Box>
                                        ) : (
                                            hasEditPermission() && (
                                                <Button type="primary" onClick={async () => {
                                                    await loadUserOptions();
                                                    setIsEditingAccount(true);
                                                }}>
                                                Editar
                                            </Button>
                                            )
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120, pt: 0.5 }}>
                                                ID:
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {state.user.id}
                                            </Typography>
                                            <CopyToClipboard 
                                                text={state.user.id}
                                                size="small"
                                                sx={{ ml: 1 }}
                                            />
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120, pt: 0.5 }}>
                                                Miembro desde:
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {new Date(state.user.registrationDate).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120, pt: 0.5 }}>
                                                Email:
                                            </Typography>
                                            {isEditingAccount ? (
                                                <Controller
                                                    name="email"
                                                    control={accountForm.control}
                                                    render={({ field, fieldState }) => (
                                                <TextField
                                                            {...field}
                                                    variant="outlined"
                                                    size="small"
                                                            error={!!fieldState.error}
                                                            helperText={fieldState.error?.message}
                                                    sx={{ 
                                                        width: 300,
                                                        '& .MuiOutlinedInput-root': {
                                                            fontSize: '0.875rem'
                                                        }
                                                    }}
                                                        />
                                                    )}
                                                />
                                            ) : (
                                                <Box sx={{ display: 'flex', alignItems: isEditingAddress ? 'flex-start' : 'center', gap: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {state.user.email}
                                                </Typography>
                                                    <CopyToClipboard 
                                                        text={state.user.email}
                                                        size="small"
                                                    />
                                                </Box>
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120, pt: 0.5 }}>
                                                Rol:
                                            </Typography>
                                            {isEditingAccount ? (
                                                <Controller
                                                    name="roleId"
                                                    control={accountForm.control}
                                                    render={({ field, fieldState }) => (
                                                        <FormControl size="small" sx={{ width: 300 }} error={!!fieldState.error}>
                                                    <InputLabel>Rol</InputLabel>
                                                    <Select
                                                                {...field}
                                                        label="Rol"
                                                        sx={{ 
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                    >
                                                        {userOptions?.roles.map((role) => (
                                                                    <MenuItem key={role.value} value={role.value}>
                                                                        {role.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                            {fieldState.error && (
                                                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                                                    {fieldState.error.message}
                                                                </Typography>
                                                            )}
                                                </FormControl>
                                                    )}
                                                />
                                            ) : (
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {state.user.role.name}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>

                                    {/* Sección Contraseña */}
                                    <Box sx={{ mt: 4 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                Contraseña
                                            </Typography>
                                            {isEditingPassword ? (
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button type="secondary" onClick={() => {
                                                        passwordForm.reset({
                                                            password: '',
                                                            confirmedPassword: ''
                                                        });
                                                        setShowPassword(false);
                                                        setShowConfirmPassword(false);
                                                        setIsEditingPassword(false);
                                                    }}>
                                                        Cancelar
                                                    </Button>
                                                    <Button type="primary" onClick={passwordForm.handleSubmit(() => setPasswordModalOpen(true))}>
                                                        Guardar
                                                    </Button>
                                                </Box>
                                            ) : (
                                                hasEditPermission() && (
                                                <Button type="primary" onClick={() => setIsEditingPassword(true)}>
                                                    Editar
                                                </Button>
                                                )
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: isEditingPassword ? 'flex-start' : 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120, pt: isEditingPassword ? 0.5 : 0 }}>
                                                    Contraseña:
                                                </Typography>
                                                {isEditingPassword ? (
                                                    <Controller
                                                        name="password"
                                                        control={passwordForm.control}
                                                        render={({ field, fieldState }) => (
                                                <TextField
                                                                {...field}
                                                                type={showPassword ? 'text' : 'password'}
                                                    variant="outlined"
                                                    size="small"
                                                                error={!!fieldState.error}
                                                                helperText={fieldState.error?.message}
                                                    sx={{ 
                                                        width: 300,
                                                        '& .MuiOutlinedInput-root': {
                                                            fontSize: '0.875rem'
                                                        }
                                                    }}
                                                                InputProps={{
                                                                    endAdornment: (
                                                                        <InputAdornment position="end">
                                                                            <IconButton
                                                                                onClick={() => setShowPassword(!showPassword)}
                                                                                edge="end"
                                                                                size="small"
                                                                            >
                                                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                                                            </IconButton>
                                                                        </InputAdornment>
                                                                    )
                                                                }}
                                                            />
                                                        )}
                                                />
                                            ) : (
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        ••••••••••••
                                                </Typography>
                                            )}
                                        </Box>
                                            {isEditingPassword && (
                                                <Box sx={{ display: 'flex', alignItems: isEditingPassword ? 'flex-start' : 'center', gap: 1 }}>
                                                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120, pt: isEditingPassword ? 0.5 : 0 }}>
                                                        Confirmar:
                                                    </Typography>
                                                    <Controller
                                                        name="confirmedPassword"
                                                        control={passwordForm.control}
                                                        render={({ field, fieldState }) => (
                                                            <TextField
                                                                {...field}
                                                                type={showConfirmPassword ? 'text' : 'password'}
                                                                variant="outlined"
                                                                size="small"
                                                                error={!!fieldState.error}
                                                                helperText={fieldState.error?.message}
                                                                sx={{ 
                                                                    width: 300,
                                                                    '& .MuiOutlinedInput-root': {
                                                                        fontSize: '0.875rem'
                                                                    }
                                                                }}
                                                                InputProps={{
                                                                    endAdornment: (
                                                                        <InputAdornment position="end">
                                                                            <IconButton
                                                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                                edge="end"
                                                                                size="small"
                                                                            >
                                                                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                                            </IconButton>
                                                                        </InputAdornment>
                                                                    )
                                                                }}
                                                            />
                                                        )}
                                                    />
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Box>
                );
            
            default:
                return null;
        }
    };

    return (
        <div className='user-page'>
            {/* Header con botón de regreso y título */}
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mb: 3 
            }}>
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1 
                }}>
                    <IconButton
                        onClick={handleGoBack}
                        size="small"
                        sx={{ 
                            color: 'black',
                            p: 0.5
                        }}
                    >
                        <ArrowBack />
                    </IconButton>
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            color: 'black',
                            fontWeight: 500
                        }}
                    >
                        Usuario
                    </Typography>
                </Box>
                
                {/* Botón Borrar usuario */}
                {state.status === UserPageStatus.SUCCESS && 
                 state.user.permissions.includes('delete') && (
                    <Button 
                        type="error"
                        onClick={handleDeleteUserClick}
                        sx={{ 
                            fontSize: '0.75rem',
                            padding: '6px 12px',
                            minWidth: 'auto'
                        }}
                    >
                        Borrar usuario
                    </Button>
                )}
            </Box>
            
            {renderContent()}
            
            {/* Modal de edición de foto de perfil */}
            <Dialog 
                open={profilePictureModalOpen} 
                onClose={isUpdatingProfilePicture ? undefined : handleCloseProfilePictureModal}
                maxWidth="sm"
                fullWidth
                disableEscapeKeyDown={isUpdatingProfilePicture}
            >
                <DialogTitle>
                    <Typography variant="h6">
                        {profilePictureSuccess ? 'Foto actualizada' : 'Cambiar foto de perfil'}
                    </Typography>
                </DialogTitle>
                
                <DialogContent>
                    {/* Alert de error */}
                    {profilePictureError && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {profilePictureError}
                        </Alert>
                    )}
                    
                    {/* Alert de éxito */}
                    {profilePictureSuccess && (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            ¡Foto de perfil actualizada exitosamente!
                        </Alert>
                    )}
                    
                    {/* Vista previa de la imagen */}
                    {selectedImagePreview && (
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                {profilePictureSuccess ? 'Foto actualizada exitosamente' : '¿Desea cambiar la foto actual por esta?'}
                            </Typography>
                            <Box sx={{ 
                                width: 200, 
                                height: 200, 
                                margin: '0 auto',
                                backgroundColor: '#f5f5f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                borderRadius: 1
                            }}>
                                <img 
                                    src={selectedImagePreview} 
                                    alt="Vista previa"
                                    style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'cover' 
                                    }}
                                />
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                
                <DialogActions sx={{ p: 3 }}>
                    {profilePictureSuccess ? (
                        <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
                            <Button type="primary" onClick={handleCloseProfilePictureModal}>
                                Cerrar
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
                            <Button 
                                type="secondary" 
                                onClick={handleCloseProfilePictureModal}
                                disabled={isUpdatingProfilePicture}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="primary" 
                                onClick={handleSaveProfilePicture}
                                disabled={isUpdatingProfilePicture}
                            >
                                {isUpdatingProfilePicture ? (
                                    <>
                                        <CircularProgress size={16} sx={{ color: 'white', mr: 1 }} />
                                        Guardando...
                                    </>
                                ) : (
                                    'Guardar'
                                )}
                            </Button>
                        </Box>
                    )}
                </DialogActions>
            </Dialog>

            {/* Modal de confirmación para actualizar cuenta */}
            <Dialog 
                open={accountModalOpen} 
                onClose={isUpdatingAccount ? undefined : handleCloseAccountModal}
                maxWidth="sm"
                fullWidth
                disableEscapeKeyDown={isUpdatingAccount}
            >
                <DialogTitle>
                    <Typography variant="h6">
                        {accountSuccess ? 'Cuenta actualizada' : '¿Actualizar cuenta?'}
                    </Typography>
                </DialogTitle>
                
                <DialogContent>
                    {accountError && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {accountError}
                        </Alert>
                    )}
                    
                    {accountSuccess && (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            ¡Cuenta actualizada exitosamente!
                        </Alert>
                    )}
                    
                    {(
                        <Box>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                {accountSuccess 
                                    ? 'Los siguientes datos han sido actualizados exitosamente:' 
                                    : '¿Está seguro de que desea actualizar la cuenta del usuario?'
                                }
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {accountSuccess ? 'Datos actualizados:' : 'Nuevos datos:'}
                            </Typography>
                            <Box sx={{ 
                                backgroundColor: '#f5f5f5', 
                                p: 2, 
                                borderRadius: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                                        Email:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {accountForm.getValues('email')}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                                        Rol:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {state.status === UserPageStatus.SUCCESS 
                                            ? userOptions?.roles.find(r => r.value === accountForm.getValues('roleId'))?.label || 'N/A'
                                            : 'N/A'
                                        }
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                
                <DialogActions sx={{ p: 3 }}>
                    {accountSuccess ? (
                        <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
                            <Button type="primary" onClick={handleCloseAccountModal}>
                                Cerrar
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
                            <Button 
                                type="secondary" 
                                onClick={handleCloseAccountModal}
                                disabled={isUpdatingAccount}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="primary" 
                                onClick={handleConfirmAccountUpdate}
                                disabled={isUpdatingAccount}
                            >
                                {isUpdatingAccount ? (
                                    <>
                                        <CircularProgress size={16} sx={{ color: 'white', mr: 1 }} />
                                        Guardando...
                                    </>
                                ) : (
                                    'Guardar'
                                )}
                            </Button>
                        </Box>
                    )}
                </DialogActions>
            </Dialog>
            {/* Modal de confirmación para actualizar datos personales */}
            <Dialog 
                open={personalDataModalOpen} 
                onClose={isUpdatingPersonalData ? undefined : handleClosePersonalDataModal}
                maxWidth="sm"
                fullWidth
                disableEscapeKeyDown={isUpdatingPersonalData}
            >
                <DialogTitle>
                    <Typography variant="h6">
                        {personalDataSuccess ? 'Datos actualizados' : '¿Actualizar datos personales?'}
                    </Typography>
                </DialogTitle>
                
                <DialogContent>
                    {personalDataError && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {personalDataError}
                        </Alert>
                    )}
                    
                    {personalDataSuccess && (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            ¡Datos personales actualizados exitosamente!
                        </Alert>
                    )}
                    
                    {(
                        <Box>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                {personalDataSuccess 
                                    ? 'Los siguientes datos han sido actualizados exitosamente:' 
                                    : '¿Está seguro de que desea actualizar los datos personales del usuario?'
                                }
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {personalDataSuccess ? 'Datos actualizados:' : 'Nuevos datos:'}
                            </Typography>
                            <Box sx={{ 
                                backgroundColor: '#f5f5f5', 
                                p: 2, 
                                borderRadius: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                                        Nombre:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {personalDataForm.getValues('firstName')}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                                        Apellido:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {personalDataForm.getValues('lastName')}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                                        Teléfono:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {personalDataForm.getValues('phone')}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                                        Género:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {state.status === UserPageStatus.SUCCESS 
                                            ? userOptions?.genders.find(g => g.value === personalDataForm.getValues('genderId'))?.label || 'N/A'
                                            : 'N/A'
                                        }
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                                        F. nacim.:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {dayjs(personalDataForm.getValues('dateOfBirth')).format('DD/MMM/YYYY')}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                
                <DialogActions sx={{ p: 3 }}>
                    {personalDataSuccess ? (
                        <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
                            <Button type="primary" onClick={handleClosePersonalDataModal}>
                                Cerrar
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
                            <Button 
                                type="secondary" 
                                onClick={handleClosePersonalDataModal}
                                disabled={isUpdatingPersonalData}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="primary" 
                                onClick={handleConfirmPersonalDataUpdate}
                                disabled={isUpdatingPersonalData}
                            >
                                {isUpdatingPersonalData ? (
                                    <>
                                        <CircularProgress size={16} sx={{ color: 'white', mr: 1 }} />
                                        Guardando...
                                    </>
                                ) : (
                                    'Guardar'
                                )}
                            </Button>
                        </Box>
                    )}
                </DialogActions>
            </Dialog>

            {/* Modal de confirmación para actualizar domicilio */}
            <Dialog 
                open={addressModalOpen} 
                onClose={isUpdatingAddress ? undefined : handleCloseAddressModal}
                maxWidth="sm"
                fullWidth
                disableEscapeKeyDown={isUpdatingAddress}
            >
                <DialogTitle>
                    <Typography variant="h6">
                        {addressSuccess ? 'Domicilio actualizado' : '¿Actualizar domicilio?'}
                    </Typography>
                </DialogTitle>
                
                <DialogContent>
                    {addressError && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {addressError}
                        </Alert>
                    )}
                    
                    {addressSuccess && (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            ¡Domicilio actualizado exitosamente!
                        </Alert>
                    )}
                    
                    {(
                        <Box>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                {addressSuccess 
                                    ? 'Los siguientes datos han sido actualizados exitosamente:' 
                                    : '¿Está seguro de que desea actualizar el domicilio del usuario?'
                                }
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {addressSuccess ? 'Datos actualizados:' : 'Nuevos datos:'}
                            </Typography>
                            <Box sx={{ 
                                backgroundColor: '#f5f5f5', 
                                p: 2, 
                                borderRadius: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                                        Estado:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {state.status === UserPageStatus.SUCCESS 
                                            ? userOptions?.states.find(s => s.value === addressForm.getValues('stateId'))?.label || 'N/A'
                                            : 'N/A'
                                        }
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                                        Ciudad:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {addressForm.getValues('city')}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                                        Calle y número:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {addressForm.getValues('address')}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                                        Colonia:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {addressForm.getValues('district')}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                                        Código Postal:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {addressForm.getValues('zipCode')}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                
                <DialogActions sx={{ p: 3 }}>
                    {addressSuccess ? (
                        <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
                            <Button type="primary" onClick={handleCloseAddressModal}>
                                Cerrar
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
                            <Button 
                                type="secondary" 
                                onClick={handleCloseAddressModal}
                                disabled={isUpdatingAddress}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="primary" 
                                onClick={handleConfirmAddressUpdate}
                                disabled={isUpdatingAddress}
                            >
                                {isUpdatingAddress ? (
                                    <>
                                        <CircularProgress size={16} sx={{ color: 'white', mr: 1 }} />
                                        Guardando...
                                    </>
                                ) : (
                                    'Guardar'
                                )}
                            </Button>
                        </Box>
                    )}
                </DialogActions>
            </Dialog>

            {/* Modal de confirmación para cambiar contraseña */}
            <Dialog 
                open={passwordModalOpen} 
                onClose={isUpdatingPassword ? undefined : handleClosePasswordModal}
                maxWidth="sm"
                fullWidth
                disableEscapeKeyDown={isUpdatingPassword}
            >
                <DialogTitle>
                    <Typography variant="h6">
                        {passwordSuccess ? 'Contraseña actualizada' : '¿Cambiar contraseña?'}
                    </Typography>
                </DialogTitle>
                
                <DialogContent>
                    {passwordError && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {passwordError}
                        </Alert>
                    )}
                    
                    {passwordSuccess && (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            ¡Contraseña cambiada exitosamente!
                        </Alert>
                    )}
                    
                    {!passwordSuccess && (
                        <Box>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                ¿Está seguro de que desea cambiar la contraseña del usuario?
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Esta acción no se puede deshacer.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                
                <DialogActions sx={{ p: 3 }}>
                    {passwordSuccess ? (
                        <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
                            <Button type="primary" onClick={handleClosePasswordModal}>
                                Cerrar
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
                            <Button 
                                type="secondary" 
                                onClick={handleClosePasswordModal}
                                disabled={isUpdatingPassword}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="primary" 
                                onClick={handleConfirmPasswordUpdate}
                                disabled={isUpdatingPassword}
                            >
                                {isUpdatingPassword ? (
                                    <>
                                        <CircularProgress size={16} sx={{ color: 'white', mr: 1 }} />
                                        Cambiando...
                                    </>
                                ) : (
                                    'Cambiar'
                                )}
                            </Button>
                        </Box>
                    )}
                </DialogActions>
            </Dialog>
            
            {/* Modal de confirmación para eliminar usuario */}
            <Dialog 
                open={deleteModalOpen} 
                onClose={deleteSuccess ? undefined : handleDeleteUserCancel}
                maxWidth="sm"
                fullWidth
                disableEscapeKeyDown={isDeletingUser || deleteSuccess}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                    }
                }}
            >
                <DialogTitle>
                    <Typography variant="h6">
                        {deleteSuccess ? 'Usuario eliminado' : '¿Eliminar usuario?'}
                    </Typography>
                </DialogTitle>
                
                <DialogContent sx={{ pt: 2, pb: 3 }}>
                    {deleteError && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {deleteError}
                        </Alert>
                    )}
                    
                    {deleteSuccess && (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            ¡Usuario eliminado exitosamente!
                        </Alert>
                    )}
                    
                    {!deleteSuccess && state.status === UserPageStatus.SUCCESS && (
                        <Box>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                ¿Está seguro de que desea eliminar este usuario? Esta acción no se puede deshacer.
                            </Typography>
                            
                            <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'row', 
                                alignItems: 'flex-start',
                                gap: 2,
                                p: 2,
                                backgroundColor: '#f8f9fa',
                                borderRadius: 1,
                                border: '1px solid #e9ecef'
                            }}>
                                <Box sx={{ 
                                    width: 60, 
                                    height: 60, 
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    backgroundColor: '#e9ecef',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {state.user.profilePictureUrl ? (
                                        <img 
                                            src={state.user.profilePictureUrl} 
                                            alt={`${state.user.fullName} profile`}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        <Typography variant="h6" sx={{ color: '#6c757d' }}>
                                            {state.user.firstName.charAt(0)}{state.user.lastName.charAt(0)}
                                        </Typography>
                                    )}
                                </Box>
                                
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" sx={{ 
                                        fontWeight: 600, 
                                        color: '#1f2937',
                                        mb: 1
                                    }}>
                                        {state.user.fullName}
                                    </Typography>
                                    
                                    <Typography variant="body2" sx={{ 
                                        color: '#6b7280'
                                    }}>
                                        ID: {state.user.id}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                
                <DialogActions sx={{ 
                    p: 3, 
                    gap: 1, 
                    justifyContent: 'flex-end' 
                }}>
                    {deleteSuccess ? (
                        <Button 
                            type="primary" 
                            onClick={handleReturnToUsers}
                        >
                            Regresar a página de usuarios
                        </Button>
                    ) : (
                        <>
                            <Button 
                                type="secondary" 
                                onClick={handleDeleteUserCancel}
                                disabled={isDeletingUser}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="error" 
                                onClick={handleDeleteUserConfirm}
                                disabled={isDeletingUser}
                            >
                                {isDeletingUser ? (
                                    <>
                                        <CircularProgress size={16} sx={{ color: 'white', mr: 1 }} />
                                        Eliminando...
                                    </>
                                ) : (
                                    'Eliminar'
                                )}
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default UserPage;
