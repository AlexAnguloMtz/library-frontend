import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Tab, Box, Typography, IconButton, TextField, FormControl, InputLabel, Select, MenuItem, Skeleton, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress } from '@mui/material';
import { ArrowBack, CameraAlt } from '@mui/icons-material';
import './styles.css';
import userService from '../../services/UserService';
import type { FullUser } from '../../models/FullUser';
import type { UserOptionsResponse } from '../../models/UserOptionsResponse';
import type { UpdateProfilePictureRequest } from '../../models/UpdateProfilePictureRequest';
import type { UpdateProfilePictureResponse } from '../../models/UpdateProfilePictureResponse';
import { Button } from '../../components/Button';
import { CopyToClipboard } from '../../components/CopyToClipboard/CopyToClipboard';

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
    | { status: UserPageStatus.SUCCESS; user: FullUser; userOptions: UserOptionsResponse };

const UserPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [state, setState] = useState<UserPageState>({ status: UserPageStatus.IDLE });
    const [activeTab, setActiveTab] = useState(0);
    const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [isEditingAccount, setIsEditingAccount] = useState(false);
    
    // Estados para edición de foto de perfil
    const [profilePictureModalOpen, setProfilePictureModalOpen] = useState(false);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
    const [isUpdatingProfilePicture, setIsUpdatingProfilePicture] = useState(false);
    const [profilePictureError, setProfilePictureError] = useState<string | null>(null);
    const [profilePictureSuccess, setProfilePictureSuccess] = useState(false);

    const loadUserData = async () => {
        if (!id) {
            navigate('/dashboard/users');
            return;
        }

        setState({ status: UserPageStatus.LOADING });
        
        try {
            // Cargar ambos datos en paralelo
            const [user, userOptions] = await Promise.all([
                userService.getFullUserById(id),
                userService.getUserOptions()
            ]);
            
            setState({ 
                status: UserPageStatus.SUCCESS, 
                user, 
                userOptions 
            });
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

    const handleSaveProfilePicture = async () => {
        if (!selectedImageFile) return;
        
        setIsUpdatingProfilePicture(true);
        setProfilePictureError(null);
        
        try {
            const request: UpdateProfilePictureRequest = {
                profilePicture: selectedImageFile
            };
            
            const response: UpdateProfilePictureResponse = await userService.updateProfilePicture(id!, request);
            
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
    }, []);

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
                                <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
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
                                
                                {/* Botón de editar foto */}
                                <Box sx={{ mt: 2 }}>
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
                                                    <Button type="secondary" onClick={() => setIsEditingBasicInfo(false)}>
                                                        Cancelar
                                                    </Button>
                                                    <Button type="primary" onClick={() => {}}>
                                                        Guardar
                                                    </Button>
                                                </Box>
                                            ) : (
                                                <Button type="primary" onClick={() => setIsEditingBasicInfo(true)}>
                                                    Editar
                                                </Button>
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                    Nombre:
                                                </Typography>
                                                {isEditingBasicInfo ? (
                                                    <TextField
                                                        value={state.user.firstName}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.firstName}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                    Apellido:
                                                </Typography>
                                                {isEditingBasicInfo ? (
                                                    <TextField
                                                        value={state.user.lastName}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.lastName}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                    Teléfono:
                                                </Typography>
                                                {isEditingBasicInfo ? (
                                                    <TextField
                                                        value={state.user.phone}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                    Género:
                                                </Typography>
                                                {isEditingBasicInfo ? (
                                                    <FormControl size="small" sx={{ width: 300 }}>
                                                        <InputLabel>Género</InputLabel>
                                                        <Select
                                                            value={state.userOptions.genders.find(g => g.value === state.user.gender.id)?.value || ''}
                                                            label="Género"
                                                            sx={{ 
                                                                '& .MuiOutlinedInput-root': {
                                                                    fontSize: '0.875rem'
                                                                }
                                                            }}
                                                        >
                                                            {state.userOptions.genders.map((gender) => (
                                                                <MenuItem key={gender.value} value={gender.value}>
                                                                    {gender.label}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.gender.name}
                                                    </Typography>
                                                )}
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
                                                    <Button type="secondary" onClick={() => setIsEditingAddress(false)}>
                                                        Cancelar
                                                    </Button>
                                                    <Button type="primary" onClick={() => {}}>
                                                        Guardar
                                                    </Button>
                                                </Box>
                                            ) : (
                                                <Button type="primary" onClick={() => setIsEditingAddress(true)}>
                                                    Editar
                                                </Button>
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                    Estado:
                                                </Typography>
                                                {isEditingAddress ? (
                                                    <FormControl size="small" sx={{ width: 300 }}>
                                                        <InputLabel>Estado</InputLabel>
                                                        <Select
                                                            value={state.user.address.state.id}
                                                            label="Estado"
                                                            sx={{ 
                                                                '& .MuiOutlinedInput-root': {
                                                                    fontSize: '0.875rem'
                                                                }
                                                            }}
                                                        >
                                                            {state.userOptions.states.map((state) => (
                                                                <MenuItem key={state.value} value={state.value}>
                                                                    {state.label}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.address.state.name}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                    Ciudad:
                                                </Typography>
                                                {isEditingAddress ? (
                                                    <TextField
                                                        value={state.user.address.city}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.address.city}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                    Calle y número:
                                                </Typography>
                                                {isEditingAddress ? (
                                                    <TextField
                                                        value={state.user.address.address}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.address.address}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                    Colonia:
                                                </Typography>
                                                {isEditingAddress ? (
                                                    <TextField
                                                        value={state.user.address.district}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.address.district}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                    Código Postal:
                                                </Typography>
                                                {isEditingAddress ? (
                                                    <TextField
                                                        value={state.user.address.zipCode}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.address.zipCode}
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
                                                <Button type="secondary" onClick={() => setIsEditingAccount(false)}>
                                                    Cancelar
                                                </Button>
                                                <Button type="primary" onClick={() => {}}>
                                                    Guardar
                                                </Button>
                                            </Box>
                                        ) : (
                                            <Button type="primary" onClick={() => setIsEditingAccount(true)}>
                                                Editar
                                            </Button>
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
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
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                Email:
                                            </Typography>
                                            {isEditingAccount ? (
                                                <TextField
                                                    value={state.user.email}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ 
                                                        width: 300,
                                                        '& .MuiOutlinedInput-root': {
                                                            fontSize: '0.875rem'
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                Rol:
                                            </Typography>
                                            {isEditingAccount ? (
                                                <FormControl size="small" sx={{ width: 300 }}>
                                                    <InputLabel>Rol</InputLabel>
                                                    <Select
                                                        value={state.user.role.id}
                                                        label="Rol"
                                                        sx={{ 
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                    >
                                                        {state.userOptions.roles.map((role) => (
                                                            <MenuItem key={role.value} value={role.value}>
                                                                {role.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            ) : (
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {state.user.role.name}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                Miembro desde:
                                            </Typography>
                                            {isEditingAccount ? (
                                                <TextField
                                                    value={new Date(state.user.registrationDate).toLocaleDateString()}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ 
                                                        width: 300,
                                                        '& .MuiOutlinedInput-root': {
                                                            fontSize: '0.875rem'
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {new Date(state.user.registrationDate).toLocaleDateString()}
                                                </Typography>
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
                gap: 1, 
                mb: 3 
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
        </div>
    );
};

export default UserPage;
