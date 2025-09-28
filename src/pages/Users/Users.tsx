import React, { useState, useEffect } from 'react';
import './styles.css';
import { Button } from '../../components/Button';
import { Icon, Icons } from '../../components/Icon';
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Dayjs } from 'dayjs';
import { Dialog, DialogTitle, DialogContent, DialogActions, Skeleton, Pagination, MenuItem, Box, Typography, Chip, Divider, CircularProgress, Stepper, Step, StepLabel, Button as MuiButton, Checkbox, IconButton, Alert } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { UserPreview } from '../../models/UserPreview';
import userService  from '../../services/UserService';
import { DashboardModuleTopBar } from '../../components/DashboardModuleTopBar/DashboardModuleTopBar';
import type { UserPreviewsQuery } from '../../models/UserPreviewQuery';
import type { PaginationRequest } from '../../models/PaginationRequest';
import { useDebounce } from '../../hooks/useDebounce';
import { SortableColumnHeader } from '../../components/SortableColumnHeader/SortableColumnHeader';
import type { SortRequest } from '../../models/SortRequest';
import type { PaginationResponse } from '../../models/PaginationResponse';
import type { OptionResponse } from '../../models/OptionResponse';
import type { UserOptionsResponse } from '../../models/UserOptionsResponse';
import authenticationHelper from '../../util/AuthenticationHelper';
import type { AuthenticationResponse } from '../../models/AuthenticationResponse';
import type { CreateUserRequest } from '../../models/CreateUserRequest';
import type { CreateUserResponse } from '../../models/CreateUserResponse';
import { CopyToClipboard } from '../../components/CopyToClipboard/CopyToClipboard';
import * as blobHelpers from '../../util/BlobHelpers';

const loanOptions = Array.from({ length: 20 }, (_, i) => i + 1);

// Zod schema para validación del formulario de crear usuario
const createUserSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  phone: z.string().min(1, 'El teléfono es requerido').regex(/^\d{10}$/, 'El teléfono debe tener exactamente 10 dígitos'),
  gender: z.string().min(1, 'El género es requerido'),
  state: z.string().min(1, 'El estado es requerido'),
  city: z.string().min(1, 'La ciudad es requerida'),
  address: z.string().min(1, 'La dirección es requerida'),
  district: z.string().min(1, 'La colonia es requerida'),
  zipCode: z.string().min(1, 'El código postal es requerido').regex(/^\d{5}$/, 'El código postal debe tener exactamente 5 dígitos'),
  email: z.string().min(1, 'El email es requerido').email('El email no es válido'),
  role: z.string().min(1, 'El rol es requerido'),
  password: z.string().min(1, 'La contraseña es requerida').min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(1, 'La confirmación de contraseña es requerida')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

const dropdownLabelStyles = {
  transform: 'translate(14px, 9px) scale(1)',
  '&.MuiInputLabel-shrink': {
    transform: 'translate(14px, -6px) scale(0.75)',
  },
  fontSize: '1rem',
};

const datePickerslotProps: any = {
  textField: {
    fullWidth: true,
    size: 'small',
    sx: {
      '& .MuiInputBase-root': {
        paddingTop: '8px',
        paddingBottom: '8px',
        fontSize: '0.75rem',
      },
      '& .MuiInputLabel-root': {
        fontSize: '1rem',
        transform: 'translate(14px, 8px) scale(1)',
        '&.MuiInputLabel-shrink': {
          transform: 'translate(12px, -8px) scale(0.75)',
        },
      },
    },
  },
}

type UserFilters = {
  search: string;
  role: string;
  registrationDateMin: Dayjs | null;
  registrationDateMax: Dayjs | null;
  minLoans: string;
  maxLoans: string;
};

type SortableColumn = 'name' | 'contact' | 'role' | 'registrationDate' | 'activeLoans';

type PaginationState = {
  sort?: SortableColumn;
  order?: 'asc' | 'desc';
};

type PaginationControls = {
  page: number;
  size: number;
};

type UsersState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; response: PaginationResponse<UserPreview> };

type FiltersState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; roles: OptionResponse[] };

const Users: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    registrationDateMin: null,
    registrationDateMax: null,
    minLoans: '',
    maxLoans: ''
  });

  const [paginationState, setPaginationState] = useState<PaginationState>({
    sort: undefined,
    order: undefined
  });

  const [paginationControls, setPaginationControls] = useState<PaginationControls>({
    page: 0,
    size: 20
  });

  const [usersState, setUsersState] = useState<UsersState>({ status: 'idle' });
  const [filtersState, setFiltersState] = useState<FiltersState>({ status: 'idle' });
  const [auth, setAuth] = useState<AuthenticationResponse | null>(null);
  const [displayPagination, setDisplayPagination] = useState<{ totalPages: number; page: number } | null>(null);
  const [displayCount, setDisplayCount] = useState<{ start: number; end: number; total: number } | null>(null);

  const [errorOpen, setErrorOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserPreview | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para selección múltiple
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportErrorOpen, setExportErrorOpen] = useState(false);
  const [exportErrorMessage, setExportErrorMessage] = useState('');
  const [userOptions, setUserOptions] = useState<UserOptionsResponse | null>(null);

  // Estados del modal de creación de usuario
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [createdUser, setCreatedUser] = useState<CreateUserResponse | null>(null);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      gender: '',
      state: '',
      city: '',
      address: '',
      district: '',
      zipCode: '',
      email: '',
      role: '',
      password: '',
      confirmPassword: ''
    }
  });

  const debouncedSearch = useDebounce(filters.search, 500);

  // Funciones del modal de creación de usuario
  const handleCreateUserClick = () => {
    setCreateUserModalOpen(true);
    setActiveStep(0);
    setProfileImagePreview(null);
    setProfileImageFile(null);
    setCreatedUser(null);
    setCreateUserError(null);
    reset();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImagePreview(null);
    setProfileImageFile(null);
  };

  const handleTogglePasswordVisibility = () => setShowPassword(prev => !prev);
  const handleToggleConfirmPasswordVisibility = () => setShowConfirmPassword(prev => !prev);

  const handleNext = () => {
    setActiveStep(1);
  };

  const handleBack = () => {
    setActiveStep(0);
    setCreateUserError(null); // Limpiar el error al volver atrás
  };

  const handleCloseModal = () => {
    setCreateUserModalOpen(false);
    setActiveStep(0);
    setProfileImagePreview(null);
    setProfileImageFile(null);
    setCreatedUser(null);
    setCreateUserError(null);
    reset();
  };

  const handleViewCreatedUser = () => {
    if (createdUser) {
      navigate(`/dashboard/users/${createdUser.id}`);
    }
  };

  const onSubmit = async (data: CreateUserFormData) => {
    setIsCreating(true);
    setCreateUserError(null);
    
    try {
      // Mapear los datos del formulario a CreateUserRequest
      const createUserRequest: CreateUserRequest = {
        personalData: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          genderId: data.gender
        },
        address: {
          address: data.address,
          stateId: data.state,
          city: data.city,
          district: data.district,
          zipCode: data.zipCode
        },
        account: {
          email: data.email,
          roleId: data.role,
          password: data.password,
          profilePicture: profileImageFile!
        }
      };

      const response = await userService.createUser(createUserRequest);
      setCreatedUser(response);
      setActiveStep(1); // Ir al step de confirmación/éxito
    } catch (error: any) {
      console.error('Error creating user:', error);
      setCreateUserError(error.message || 'Error al crear el usuario');
    } finally {
      setIsCreating(false);
    }
  };

  // Funciones para selección múltiple
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (usersState.status === 'success' && usersState.response) {
      if (isAllSelected || selectedUsers.size > 0) {
        // Deseleccionar todos
        setSelectedUsers(new Set());
        setIsAllSelected(false);
      } else {
        // Seleccionar todos
        const allUserIds = new Set(usersState.response.items.map(user => user.id));
        setSelectedUsers(allUserIds);
        setIsAllSelected(true);
      }
    }
  };

  const handleBulkActions = async () => {
    try {
      setIsExporting(true);
      const selectedIds = Array.from(selectedUsers);
      const blob: Blob = await userService.exportUsers(selectedIds);
      blobHelpers.downloadBlob(blob, "usuarios.pdf");
    } catch (error: any) {
      console.error('Error al exportar usuarios:', error);
      setExportErrorMessage(error.message || 'Error desconocido al exportar usuarios');
      setExportErrorOpen(true);
    } finally {
      setIsExporting(false);
    }
  };

  // Load authentication on component mount
  useEffect(() => {
    const authentication = authenticationHelper.getAuthentication();
    setAuth(authentication);
  }, []);

  // Limpiar selección cuando cambien los datos
  useEffect(() => {
    if (usersState.status === 'success' && usersState.response) {
      setSelectedUsers(new Set());
      setIsAllSelected(false);
    }
  }, [usersState.status, usersState.status === 'success' ? usersState.response?.items : undefined]);

  // Sincronizar checkbox maestro
  useEffect(() => {
    if (usersState.status === 'success' && usersState.response) {
      const totalUsers = usersState.response.items.length;
      const selectedCount = selectedUsers.size;
      
      if (selectedCount === 0) {
        setIsAllSelected(false);
      } else if (selectedCount === totalUsers) {
        setIsAllSelected(true);
      } else {
        setIsAllSelected(false);
      }
    }
  }, [selectedUsers, usersState]);

  // Update display pagination and count only when we have successful data
  useEffect(() => {
    if (usersState.status === 'success') {
      const response = usersState.response;
      setDisplayPagination({
        totalPages: response.totalPages,
        page: response.page
      });
      setDisplayCount({
        start: response.page * response.size + 1,
        end: Math.min((response.page + 1) * response.size, response.totalItems),
        total: response.totalItems
      });
    }
  }, [usersState]);

  // Load filters on component mount
  useEffect(() => {
    const fetchFilters = async () => {
      setFiltersState({ status: 'loading' });
      try {
        const response = await userService.getUserOptions();
        setFiltersState({ status: 'success', roles: response.roles });
        setUserOptions(response); // Guardar el UserOptionsResponse completo
      } catch (error: any) {
        // Fail silently as requested
        setFiltersState({ status: 'error' });
      }
    };

    fetchFilters();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setPaginationControls(prev => ({ ...prev, page: 0 }));
  }, [debouncedSearch, filters.role, filters.registrationDateMin, filters.registrationDateMax, filters.minLoans, filters.maxLoans]);

  useEffect(() => {
    const fetchUsers = async () => {
      setUsersState({ status: 'loading' });
      try {
        const response = await userService.getUsersPreviews(toQuery(filters), pagination(paginationState, paginationControls));
        setUsersState({ status: 'success', response });
      } catch (error: any) {
        setUsersState({ status: 'error', error: error.message || 'Unknown error' });
        setErrorOpen(true);
      }
    };

    fetchUsers();
  }, [debouncedSearch, filters.role, filters.registrationDateMin, filters.registrationDateMax, filters.minLoans, filters.maxLoans, paginationState, paginationControls]);

  const toQuery = (filters: UserFilters): UserPreviewsQuery => {
    return {
      search: filters.search,
      registrationDateMin: filters.registrationDateMin?.toDate(),
      registrationDateMax: filters.registrationDateMax?.toDate(),
      role: filters.role ? [filters.role] : undefined,
      activeBookLoansMin: filters.minLoans ? parseInt(filters.minLoans, 10) : undefined,
      activeBookLoansMax: filters.maxLoans ? parseInt(filters.maxLoans, 10) : undefined,
    };
  }

  const pagination = (paginationState: PaginationState, paginationControls: PaginationControls): PaginationRequest => {
    const sorts = mapSort(paginationState);
    return {
      sorts: sorts,
      page: paginationControls.page,
      size: paginationControls.size
    };
  }

  const mapSort = (paginationState: PaginationState): SortRequest[] => {
    if (paginationState.sort === 'name') {
      return [
        { sort: 'lastName', order: paginationState.order },
        { sort: 'firstName', order: paginationState.order }
      ];
    }

    if (paginationState.sort === 'contact') {
      return [
        { sort: 'email', order: paginationState.order },
        { sort: 'phoneNumber', order: paginationState.order }
      ];
    }

    if (paginationState.sort === 'role') {
      return [{ sort: 'role', order: paginationState.order }];
    }

    if (paginationState.sort === 'registrationDate') {
      return [{ sort: 'registrationDate', order: paginationState.order }];
    }

    if (paginationState.sort === 'activeLoans') {
      return [{ sort: 'activeLoans', order: paginationState.order }];
    }

    return [];
  }

  const getMinLoanOptions = () => {
    const maxValue = filters.maxLoans ? parseInt(filters.maxLoans, 10) : 20;
    return loanOptions.filter(num => num <= maxValue);
  };

  const getMaxLoanOptions = () => {
    const minValue = filters.minLoans ? parseInt(filters.minLoans, 10) : 1;
    return loanOptions.filter(num => num >= minValue);
  };

  const handleFilterChange = (field: keyof typeof filters, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      
      // Validar que minLoans no sea mayor que maxLoans
      if (field === 'minLoans' && value && prev.maxLoans) {
        const minValue = parseInt(value, 10);
        const maxValue = parseInt(prev.maxLoans, 10);
        if (minValue > maxValue) {
          newFilters.maxLoans = value; // Ajustar maxLoans al nuevo minLoans
        }
      }
      
      // Validar que maxLoans no sea menor que minLoans
      if (field === 'maxLoans' && value && prev.minLoans) {
        const maxValue = parseInt(value, 10);
        const minValue = parseInt(prev.minLoans, 10);
        if (maxValue < minValue) {
          newFilters.minLoans = value; // Ajustar minLoans al nuevo maxLoans
        }
      }
      
      // Validar que registrationDateMin no sea posterior a registrationDateMax
      if (field === 'registrationDateMin' && value && prev.registrationDateMax) {
        if (value.isAfter(prev.registrationDateMax)) {
          newFilters.registrationDateMax = value; // Ajustar maxDate al nuevo minDate
        }
      }
      
      // Validar que registrationDateMax no sea anterior a registrationDateMin
      if (field === 'registrationDateMax' && value && prev.registrationDateMin) {
        if (value.isBefore(prev.registrationDateMin)) {
          newFilters.registrationDateMin = value; // Ajustar minDate al nuevo maxDate
        }
      }
      
      return newFilters;
    });
  };

  const closeError = (_: any) => setErrorOpen(false);

  const clearFilters = () => {
    setFilters({
      search: '',
      role: '',
      registrationDateMin: null,
      registrationDateMax: null,
      minLoans: '',
      maxLoans: ''
    });
    setPaginationControls(prev => ({ ...prev, page: 0 }));
  };

  const nextPagination = (column: SortableColumn): PaginationState => {
    const { sort, order } = paginationState;

    if (sort !== column) {
      return { sort: column, order: 'asc' };
    }

    if (order === 'asc') {
      return { sort: column, order: 'desc' };
    }

    if (order === 'desc') {
      return { sort: undefined, order: undefined };
    }

    return { sort: column, order: 'asc' };
  };

  const handleViewUser = (userId: string) => {
    navigate(`/dashboard/users/${userId}`);
  };

  const handleDeleteClick = (user: UserPreview) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      await userService.deleteUserById(userToDelete.id);
      // Si llegamos aquí, la eliminación fue exitosa
      setDeleteModalOpen(false);
      setUserToDelete(null);
      
      // Eliminar el usuario del estado local sin recargar
      if (usersState.status === 'success') {
        const updatedItems = usersState.response.items.filter(user => user.id !== userToDelete.id);
        const updatedResponse = {
          ...usersState.response,
          items: updatedItems,
          totalItems: usersState.response.totalItems - 1
        };
        setUsersState({ status: 'success', response: updatedResponse });
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setUsersState({ status: 'error', error: error.message || 'Error al eliminar usuario' });
      setErrorOpen(true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className='parent-container'>
      <DashboardModuleTopBar
        title="Usuarios"
        onExportClick={handleBulkActions}
        onNewClick={handleCreateUserClick}
        selectedCount={selectedUsers.size}
        isExporting={isExporting}
        auth={auth}
        newPermission="users:create"
      />

      {/* Filters */}
      <div className='filters'>
        {/* Buscar */}
        <div className='filter-item'>
          <TextField
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            label="Buscar usuarios"
            placeholder='ID, nombre, email, teléfono...'
            variant="outlined"
            fullWidth
            size='small'
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </div>

        {/* Rol */}
        <div className='filter-item'>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="role-label" sx={dropdownLabelStyles}>Rol</InputLabel>
            <Select
              labelId="role-label"
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              label="Rol"
              size='small'

            >
              <MenuItem value="">Cualquiera</MenuItem>
              {filtersState.status === 'success' && filtersState.roles.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        {/* Fechas membresía */}
        <div className='filter-item'>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Fecha membresía (mín)"
              value={filters.registrationDateMin}
              onChange={(v) => handleFilterChange('registrationDateMin', v)}
              maxDate={filters.registrationDateMax || undefined}
              slotProps={datePickerslotProps}

            />
          </LocalizationProvider>
        </div>
        <div className='filter-item'>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Fecha membresía (max)"
              value={filters.registrationDateMax}
              onChange={(v) => handleFilterChange('registrationDateMax', v)}
              minDate={filters.registrationDateMin || undefined}
              slotProps={datePickerslotProps}
            />
          </LocalizationProvider>
        </div>

        {/* Préstamos min-max */}
        <div className='filter-item'>
          <FormControl fullWidth variant="outlined">
            <InputLabel
              id="min-loans-label"
              sx={dropdownLabelStyles}
            >
              Préstamos activos (min)
            </InputLabel>
            <Select
              labelId="min-loans-label"
              value={filters.minLoans}
              onChange={(e) => handleFilterChange('minLoans', e.target.value)}
              label="Préstamos activos (mín)"
              size='small'

            >
              <MenuItem value="">Cualquiera</MenuItem>
              {getMinLoanOptions().map((num) => (
                <MenuItem key={num} value={num}>{num}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div className='filter-item'>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="max-loans-label" sx={dropdownLabelStyles}>Préstamos activos (max)</InputLabel>
            <Select
              labelId="max-loans-label"
              value={filters.maxLoans}
              onChange={(e) => handleFilterChange('maxLoans', e.target.value)}
              label="Préstamos activos (max)"
              size='small'

            >
              <MenuItem value="">Cualquiera</MenuItem>
              {getMaxLoanOptions().map((num) => (
                <MenuItem key={num} value={num}>{num}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 20px', marginBottom: '1rem' }}>
        <Button type='secondary' onClick={clearFilters} className='small-button'>
          Limpiar filtros
        </Button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Element Count */}
          {displayCount && (
            <span style={{ 
              fontSize: '12px', 
              color: '#6B7280',
              marginRight: '0.5rem'
            }}>
              {displayCount.start} - {displayCount.end} de {displayCount.total}
            </span>
          )}
          
          {/* Page Size Selector */}
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel sx={{ fontSize: '12px' }}>Items</InputLabel>
            <Select
              value={paginationControls.size}
              onChange={(e) => setPaginationControls(prev => ({ ...prev, size: e.target.value as number, page: 0 }))}
              label="Elementos por página"
              sx={{ fontSize: '12px', height: '32px' }}
            >
              <MenuItem value={10} sx={{ fontSize: '12px' }}>10</MenuItem>
              <MenuItem value={20} sx={{ fontSize: '12px' }}>20</MenuItem>
              <MenuItem value={50} sx={{ fontSize: '12px' }}>50</MenuItem>
              <MenuItem value={100} sx={{ fontSize: '12px' }}>100</MenuItem>
            </Select>
          </FormControl>

          {/* Pagination */}
          {displayPagination && displayPagination.totalPages > 1 ? (
            <Pagination
              count={displayPagination.totalPages}
              page={displayPagination.page + 1} // Material-UI uses 1-based indexing
              onChange={(_, page) => setPaginationControls(prev => ({ ...prev, page: page - 1 }))} // Convert back to 0-based
              color="primary"
              size="small"
              sx={{
                '& .MuiPaginationItem-root': {
                  color: '#4F46E5',
                  fontSize: '12px',
                  minWidth: '28px',
                  height: '28px',
                  '&.Mui-selected': {
                    backgroundColor: '#4F46E5',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#433BCF',
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                  }
                }
              }}
            />
          ) : (
            <Pagination
              count={1}
              page={1}
              disabled={true}
              color="primary"
              size="small"
              sx={{
                '& .MuiPaginationItem-root': {
                  color: '#4F46E5',
                  fontSize: '12px',
                  minWidth: '28px',
                  height: '28px',
                  '&.Mui-selected': {
                    backgroundColor: '#4F46E5',
                    color: 'white',
                  }
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Table / Spinner */}
      <div className='table-container' style={{ display: 'flex', justifyContent: 'center' }}>

        {(
          <table className='table'>
            <thead>
              <tr>
                <SortableColumnHeader
                  title=""
                  nonSortable={true}
                  style={{ width: '50px', textAlign: 'center' }}
                >
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={selectedUsers.size > 0 && !isAllSelected}
                    onChange={handleSelectAll}
                    size="small"
                    disabled={usersState.status === 'loading'}
                  />
                </SortableColumnHeader>
                <SortableColumnHeader
                  title='Usuario'
                  active={paginationState.sort === 'name'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("name")) }}
                  style={{ width: '20%' }}
                />
                <SortableColumnHeader
                  title='Contacto'
                  active={paginationState.sort === 'contact'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("contact")) }}
                  style={{ width: '23%' }}
                />
                <SortableColumnHeader
                  title='Rol'
                  active={paginationState.sort === 'role'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("role")) }}
                  style={{ width: '15%' }}
                />
                <SortableColumnHeader
                  title='Miembro desde'
                  active={paginationState.sort === 'registrationDate'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("registrationDate")) }}
                  style={{ width: '18%' }}
                />
                <SortableColumnHeader
                  title='Préstamos activos'
                  active={paginationState.sort === 'activeLoans'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("activeLoans")) }}
                  style={{ width: '14%' }}
                />
                <SortableColumnHeader
                  title='Acciones'
                  nonSortable={true}
                  style={{ width: '10%' }}
                />
              </tr>
            </thead>
            <tbody>
              {usersState.status === 'loading' && (
                Array.from({ length: 15 }).map((_, i) => (
                  <tr key={i}>
                    <td style={{ width: '50px', textAlign: 'center' }}>
                      <Checkbox disabled size="small" />
                    </td>
                    <td><Skeleton variant="rectangular" height={40} /></td>
                    <td><Skeleton variant="rectangular" height={40} /></td>
                    <td><Skeleton variant="rectangular" height={40} /></td>
                    <td><Skeleton variant="rectangular" height={40} /></td>
                    <td><Skeleton variant="rectangular" height={40} /></td>
                    <td><Skeleton variant="rectangular" height={40} /></td>
                  </tr>
                ))
              )}
              {usersState.status === 'success' && usersState.response.items.map((user: UserPreview) => (
                <tr 
                  key={user.id}
                  style={{ 
                    backgroundColor: selectedUsers.has(user.id) ? '#f0f9ff' : 'transparent' 
                  }}
                >
                  <td style={{ textAlign: 'center' }}>
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      size="small"
                    />
                  </td>
                  <td className='user-info-cell'>
                    <div className='user-avatar-container'>
                      {user.profilePictureUrl ? (
                        <img 
                          src={user.profilePictureUrl} 
                          alt={`${user.name} profile`}
                          className='user-avatar-image'
                        />
                      ) : (
                        <Icon name={Icons.user_avatar} />
                      )}
                    </div>
                    <div className='user-name-and-id'>
                      <span className='user-name'>{user.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className='user-id'>ID: {user.id}</span>
                        <CopyToClipboard 
                          text={user.id}
                          size="tiny"
                        />
                      </div>
                    </div>
                  </td>
                  <td className='user-contact-cell'>
                    <div className='user-contact-info'>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className='user-email'>{user.email}</span>
                        <CopyToClipboard 
                          text={user.email}
                          size="tiny"
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className='user-phone'>{user.phone}</span>
                        <CopyToClipboard 
                          text={user.phone}
                          size="tiny"
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`user-role-badge ${user.role.slug}`}>{user.role.name}</span>
                  </td>
                  <td>{user.registrationDate}</td>
                  <td>{user.activeLoans}</td>
                  <td>
                    <div className='actions'>
                      {auth && authenticationHelper.hasAnyPermission(auth, ['users:read']) && (
                        <button 
                          className='action-button edit-button'
                          onClick={() => handleViewUser(user.id)}
                        >
                          <Icon name={Icons.eye} className='edit-icon' />
                        </button>
                      )}
                      {auth && authenticationHelper.hasAnyPermission(auth, ['users:delete']) && user.permissions.includes('delete') && (
                        <button 
                          className='action-button delete-button'
                          onClick={() => handleDeleteClick(user)}
                        >
                          <DeleteIcon className='delete-icon' />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Error Modal */}
      <Dialog open={errorOpen} onClose={closeError}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          {usersState.status === 'error' && usersState.error}
        </DialogContent>
        <DialogActions>
          <Button type='primary' onClick={(e: any) => closeError(e)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Export Error Modal */}
      <Dialog open={exportErrorOpen} onClose={() => setExportErrorOpen(false)}>
        <DialogTitle>Error al Exportar</DialogTitle>
        <DialogContent>
          {exportErrorMessage}
        </DialogContent>
        <DialogActions>
          <Button type='primary' onClick={() => setExportErrorOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog 
        open={deleteModalOpen} 
        onClose={isDeleting ? undefined : handleDeleteCancel}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={isDeleting}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'left', 
          pb: 1,
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#1f2937'
        }}>
          ¿Eliminar este usuario?
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2, pb: 3 }}>
          {userToDelete && (
            <>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'row', 
              alignItems: 'flex-start',
              gap: 3,
              p: 2
            }}>
              {/* User Avatar - Left side */}
              <Box sx={{ 
                width: 256, 
                height: 230,
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: '#E0E7FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {userToDelete.profilePictureUrl ? (
                  <img 
                    src={userToDelete.profilePictureUrl} 
                    alt={`${userToDelete.name} profile`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <Icon name={Icons.user_avatar} className="large-icon" />
                )}
              </Box>

              {/* User Info - Right side */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                flex: 1,
                minHeight: 230
              }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: '#1f2937',
                  mb: 1
                }}>
                  {userToDelete.name}
                </Typography>
                
                <Typography variant="body2" sx={{ 
                  color: '#6b7280'
                }}>
                  ID: {userToDelete.id}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* User Details */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1.5,
              width: '100%'
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-start', 
                alignItems: 'center',
                py: 0.5,
                gap: 2
              }}>
                <Typography variant="body2" sx={{ 
                  fontWeight: 400, 
                  color: '#9ca3af',
                  minWidth: '120px',
                  textAlign: 'left'
                }}>
                  Email:
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  color: '#1f2937',
                  textAlign: 'right',
                  flex: 1
                }}>
                  {userToDelete.email}
                </Typography>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-start', 
                alignItems: 'center',
                py: 0.5,
                gap: 2
              }}>
                <Typography variant="body2" sx={{ 
                  fontWeight: 400, 
                  color: '#9ca3af',
                  minWidth: '120px',
                  textAlign: 'left'
                }}>
                  Teléfono:
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  color: '#1f2937',
                  textAlign: 'right',
                  flex: 1
                }}>
                  {userToDelete.phone}
                </Typography>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-start', 
                alignItems: 'flex-start',
                py: 0.5,
                gap: 2
              }}>
                <Typography variant="body2" sx={{ 
                  fontWeight: 400, 
                  color: '#9ca3af',
                  minWidth: '120px',
                  textAlign: 'left',
                  mt: 0.5
                }}>
                  Rol(es):
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                  flex: 1
                }}>
                  <Chip
                    label={userToDelete.role.name}
                    size="small"
                    sx={{
                      backgroundColor: userToDelete.role.slug === 'USER' ? '#16A34A' : '#2563EB',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      height: '24px'
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-start', 
                alignItems: 'center',
                py: 0.5,
                gap: 2
              }}>
                <Typography variant="body2" sx={{ 
                  fontWeight: 400, 
                  color: '#9ca3af',
                  minWidth: '120px',
                  textAlign: 'left'
                }}>
                  Miembro desde:
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  color: '#1f2937',
                  textAlign: 'right',
                  flex: 1
                }}>
                  {userToDelete.registrationDate}
                </Typography>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-start', 
                alignItems: 'center',
                py: 0.5,
                gap: 2
              }}>
                <Typography variant="body2" sx={{ 
                  fontWeight: 400, 
                  color: '#9ca3af',
                  minWidth: '120px',
                  textAlign: 'left'
                }}>
                  Préstamos activos:
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  color: '#1f2937',
                  textAlign: 'right',
                  flex: 1
                }}>
                  {userToDelete.activeLoans}
                </Typography>
              </Box>
            </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          pt: 1,
          gap: 0.5,
          justifyContent: 'flex-end'
        }}>
          <Button 
            type='secondary' 
            onClick={handleDeleteCancel}
            className='small-button'
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button 
            type='error' 
            onClick={handleDeleteConfirm}
            className='small-button'
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <CircularProgress size={16} sx={{ color: 'white', mr: 1 }} />
                Eliminando...
              </>
            ) : (
              'Eliminar'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de creación de usuario */}
      <Dialog 
        open={createUserModalOpen} 
        onClose={isCreating ? undefined : handleCloseModal}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown={isCreating}
        PaperProps={{
          sx: { maxHeight: '90vh', overflow: 'auto' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {activeStep === 0 ? 'Crear Usuario' : 
               createdUser ? 'Usuario creado' : 
               'Confirmar creación de usuario'}
            </Typography>
            <MuiButton onClick={handleCloseModal} disabled={isCreating} sx={{ minWidth: 'auto', p: 1 }}>
              ✕
            </MuiButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            <Step>
              <StepLabel>Formulario</StepLabel>
            </Step>
            <Step>
              <StepLabel>Confirmación</StepLabel>
            </Step>
          </Stepper>

          {activeStep === 0 && (
            <Box sx={{ display: 'flex', gap: 3, minHeight: '400px' }}>
              {/* Sección izquierda - Imagen */}
              <Box sx={{ width: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {!profileImagePreview ? (
                   <Box
                     sx={{
                       width: '100%',
                       height: '300px',
                       border: '2px dashed #d1d5db',
                       borderRadius: '8px',
                       display: 'flex',
                       flexDirection: 'column',
                       alignItems: 'center',
                       justifyContent: 'center',
                       cursor: 'pointer',
                       '&:hover': {
                         borderColor: '#4F46E5',
                         backgroundColor: '#f8fafc'
                       }
                     }}
                     onClick={() => document.getElementById('image-upload')?.click()}
                   >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Subir imagen
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Click para seleccionar
                    </Typography>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ width: '100%', textAlign: 'center' }}>
                     <Box
                       component="img"
                       src={profileImagePreview}
                       alt="Preview"
                       sx={{
                         width: '100%',
                         height: '300px',
                         objectFit: 'cover',
                         borderRadius: '8px',
                         mb: 2
                       }}
                     />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Button type="secondary" onClick={handleRemoveImage}>
                        Borrar
                      </Button>
                      <Button type="primary" onClick={() => document.getElementById('image-upload')?.click()}>
                        Cambiar
                      </Button>
                    </Box>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </Box>
                )}
              </Box>

              {/* Sección derecha - Formulario */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                 {/* Información Básica */}
                 <Box>
                   <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                     Información Básica
                   </Typography>
                   <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                     <Box sx={{ display: 'flex', gap: 2 }}>
                       <Controller
                         name="firstName"
                         control={control}
                         render={({ field }) => (
                           <TextField
                             {...field}
                             label="Nombre"
                             variant="outlined"
                             size="small"
                             fullWidth
                             error={!!errors.firstName}
                             helperText={errors.firstName?.message}
                             disabled={isCreating}
                           />
                         )}
                       />
                       <Controller
                         name="lastName"
                         control={control}
                         render={({ field }) => (
                           <TextField
                             {...field}
                             label="Apellido"
                             variant="outlined"
                             size="small"
                             fullWidth
                             error={!!errors.lastName}
                             helperText={errors.lastName?.message}
                             disabled={isCreating}
                           />
                         )}
                       />
                     </Box>
                     <Box sx={{ display: 'flex', gap: 2 }}>
                       <Controller
                         name="phone"
                         control={control}
                         render={({ field }) => (
                           <TextField
                             {...field}
                             label="Teléfono"
                             variant="outlined"
                             size="small"
                             fullWidth
                             error={!!errors.phone}
                             helperText={errors.phone?.message}
                             disabled={isCreating}
                             inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 10 }}
                             onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                           />
                         )}
                       />
                       <Controller
                         name="gender"
                         control={control}
                         render={({ field }) => (
                           <FormControl fullWidth size="small" error={!!errors.gender}>
                             <InputLabel>Género</InputLabel>
                             <Select
                               {...field}
                               label="Género"
                               disabled={isCreating}
                             >
                               {userOptions?.genders.map((gender) => (
                                 <MenuItem key={gender.value} value={gender.value}>
                                   {gender.label}
                                 </MenuItem>
                               ))}
                             </Select>
                             {errors.gender && (
                               <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                                 {errors.gender.message}
                               </Typography>
                             )}
                           </FormControl>
                         )}
                       />
                     </Box>
                   </Box>
                 </Box>

                 {/* Domicilio */}
                 <Box>
                   <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                     Domicilio
                   </Typography>
                   <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                     <Box sx={{ display: 'flex', gap: 2 }}>
                       <Controller
                         name="state"
                         control={control}
                         render={({ field }) => (
                           <FormControl fullWidth size="small" error={!!errors.state}>
                             <InputLabel>Estado</InputLabel>
                             <Select
                               {...field}
                               label="Estado"
                               disabled={isCreating}
                             >
                               {userOptions?.states.map((state) => (
                                 <MenuItem key={state.value} value={state.value}>
                                   {state.label}
                                 </MenuItem>
                               ))}
                             </Select>
                             {errors.state && (
                               <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                                 {errors.state.message}
                               </Typography>
                             )}
                           </FormControl>
                         )}
                       />
                       <Controller
                         name="city"
                         control={control}
                         render={({ field }) => (
                           <TextField
                             {...field}
                             label="Ciudad"
                             variant="outlined"
                             size="small"
                             fullWidth
                             error={!!errors.city}
                             helperText={errors.city?.message}
                             disabled={isCreating}
                           />
                         )}
                       />
                     </Box>
                     <Controller
                       name="address"
                       control={control}
                       render={({ field }) => (
                         <TextField
                           {...field}
                           label="Calle y número"
                           variant="outlined"
                           size="small"
                           fullWidth
                           error={!!errors.address}
                           helperText={errors.address?.message}
                           disabled={isCreating}
                         />
                       )}
                     />
                     <Box sx={{ display: 'flex', gap: 2 }}>
                       <Controller
                         name="district"
                         control={control}
                         render={({ field }) => (
                           <TextField
                             {...field}
                             label="Colonia"
                             variant="outlined"
                             size="small"
                             fullWidth
                             error={!!errors.district}
                             helperText={errors.district?.message}
                             disabled={isCreating}
                           />
                         )}
                       />
                       <Controller
                         name="zipCode"
                         control={control}
                         render={({ field }) => (
                           <TextField
                             {...field}
                             label="Código Postal"
                             variant="outlined"
                             size="small"
                             fullWidth
                             error={!!errors.zipCode}
                             helperText={errors.zipCode?.message}
                             disabled={isCreating}
                             inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 5 }}
                             onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                           />
                         )}
                       />
                     </Box>
                   </Box>
                 </Box>

                 {/* Cuenta */}
                 <Box>
                   <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                     Cuenta
                   </Typography>
                   <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                     <Box sx={{ display: 'flex', gap: 2 }}>
                       <Controller
                         name="email"
                         control={control}
                         render={({ field }) => (
                           <TextField
                             {...field}
                             label="Email"
                             type="email"
                             variant="outlined"
                             size="small"
                             fullWidth
                             error={!!errors.email}
                             helperText={errors.email?.message}
                             disabled={isCreating}
                           />
                         )}
                       />
                       <Controller
                         name="role"
                         control={control}
                         render={({ field }) => (
                           <FormControl fullWidth size="small" error={!!errors.role}>
                             <InputLabel>Rol</InputLabel>
                             <Select
                               {...field}
                               label="Rol"
                               disabled={isCreating}
                             >
                               {userOptions?.roles.map((role) => (
                                 <MenuItem key={role.value} value={role.value}>
                                   {role.label}
                                 </MenuItem>
                               ))}
                             </Select>
                             {errors.role && (
                               <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                                 {errors.role.message}
                               </Typography>
                             )}
                           </FormControl>
                         )}
                       />
                     </Box>
                     <Box sx={{ display: 'flex', gap: 2 }}>
                       <Controller
                         name="password"
                         control={control}
                         render={({ field }) => (
                           <TextField
                             {...field}
                             label="Contraseña"
                             type={showPassword ? 'text' : 'password'}
                             variant="outlined"
                             size="small"
                             fullWidth
                             error={!!errors.password}
                             helperText={errors.password?.message}
                             disabled={isCreating}
                             InputProps={{
                               endAdornment: (
                                 <InputAdornment position="end">
                                   <IconButton
                                     onClick={handleTogglePasswordVisibility}
                                     edge="end"
                                     disabled={isCreating}
                                   >
                                     {showPassword ? <VisibilityOff /> : <Visibility />}
                                   </IconButton>
                                 </InputAdornment>
                               )
                             }}
                           />
                         )}
                       />
                       <Controller
                         name="confirmPassword"
                         control={control}
                         render={({ field }) => (
                           <TextField
                             {...field}
                             label="Confirmar Contraseña"
                             type={showConfirmPassword ? 'text' : 'password'}
                             variant="outlined"
                             size="small"
                             fullWidth
                             error={!!errors.confirmPassword}
                             helperText={errors.confirmPassword?.message}
                             disabled={isCreating}
                             InputProps={{
                               endAdornment: (
                                 <InputAdornment position="end">
                                   <IconButton
                                     onClick={handleToggleConfirmPasswordVisibility}
                                     edge="end"
                                     disabled={isCreating}
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
                   </Box>
                 </Box>
              </Box>
            </Box>
          )}

          {activeStep === 1 && (
            <Box sx={{ display: 'flex', gap: 3, minHeight: '400px' }}>
              {/* Sección izquierda - Imagen preview */}
              <Box sx={{ width: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {profileImagePreview ? (
                  <Box
                    component="img"
                    src={profileImagePreview}
                    alt="Preview"
                    sx={{
                      width: '100%',
                      height: '300px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      mb: 2
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: '300px',
                      border: '2px dashed #d1d5db',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: '#f8fafc'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Sin imagen
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Sección derecha - Resumen de datos */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
                  Confirmar creación de usuario
                </Typography>
                
                {/* Información Básica */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Información Básica
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                        Nombre:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {watch('firstName') || 'No especificado'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                        Apellido:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {watch('lastName') || 'No especificado'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                        Teléfono:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {watch('phone') || 'No especificado'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                        Género:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {userOptions?.genders.find(g => g.value === watch('gender'))?.label || 'No especificado'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Domicilio */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Domicilio
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                        Estado:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {userOptions?.states.find(s => s.value === watch('state'))?.label || 'No especificado'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                        Ciudad:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {watch('city') || 'No especificado'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                        Dirección:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {watch('address') || 'No especificado'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                        Colonia:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {watch('district') || 'No especificado'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                        Código Postal:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {watch('zipCode') || 'No especificado'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Cuenta */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Cuenta
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                        Email:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {watch('email') || 'No especificado'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                        Rol:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {userOptions?.roles.find(r => r.value === watch('role'))?.label || 'No especificado'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                        Contraseña:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {watch('password') ? '••••••••' : 'No especificado'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                        Confirmar Contraseña:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {watch('confirmPassword') ? '••••••••' : 'No especificado'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

        </DialogContent>

        {/* Alerts arriba de las actions */}
        {(createUserError || createdUser) && (
          <Box sx={{ px: 3, pb: 1 }}>
            {createUserError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createUserError}
              </Alert>
            )}
            {createdUser && (
              <Alert severity="success" sx={{ mb: 2 }}>
                ¡Usuario creado exitosamente! ID: {createdUser.id}
              </Alert>
            )}
          </Box>
        )}

         <DialogActions sx={{ p: 3 }}>
           {activeStep === 0 ? (
             <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
               <Button type="secondary" onClick={handleCloseModal} disabled={isCreating}>
                 Cancelar
               </Button>
               <Button 
                 type="primary" 
                 onClick={handleNext}
                 disabled={!isValid || isCreating || !profileImageFile}
               >
                 Siguiente
               </Button>
             </Box>
           ) : (
             <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'space-between' }}>
               {!createdUser ? (
                 <>
                   <Button type="secondary" onClick={handleBack} disabled={isCreating}>
                     Atrás
                   </Button>
                   <Box sx={{ display: 'flex', gap: 1 }}>
                     <Button type="secondary" onClick={handleCloseModal} disabled={isCreating}>
                       Cancelar
                     </Button>
                     <Button 
                       type="primary" 
                       onClick={handleSubmit(onSubmit)}
                       disabled={isCreating}
                     >
                       {isCreating ? (
                         <>
                           <CircularProgress size={16} sx={{ color: 'white', mr: 1 }} />
                           Creando...
                         </>
                       ) : (
                         'Crear Usuario'
                       )}
                     </Button>
                   </Box>
                 </>
               ) : (
                 <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
                   <Button type="secondary" onClick={handleCloseModal}>
                     Cerrar
                   </Button>
                   <Button type="primary" onClick={handleViewCreatedUser}>
                     Ver Usuario
                   </Button>
                 </Box>
               )}
             </Box>
           )}
         </DialogActions>
      </Dialog>
    </div>
  );
};

export default Users;