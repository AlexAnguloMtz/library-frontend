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
import { Dialog, DialogTitle, DialogContent, DialogActions, Skeleton, Pagination, MenuItem, Box, Typography, Chip, Divider, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
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
import authenticationHelper from '../../util/AuthenticationHelper';
import type { AuthenticationResponse } from '../../models/AuthenticationResponse';

const loanOptions = Array.from({ length: 20 }, (_, i) => i + 1);

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

  const debouncedSearch = useDebounce(filters.search, 500);

  // Load authentication on component mount
  useEffect(() => {
    const authentication = authenticationHelper.getAuthentication();
    setAuth(authentication);
  }, []);

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
        const response = await userService.getUserFilters();
        setFiltersState({ status: 'success', roles: response.roles });
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
        onExportClick={() => { }}
        onNewClick={() => { }}
      />

      {/* Filters */}
      <div className='filters'>
        {/* Buscar */}
        <div className='filter-item'>
          <TextField
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            label="Buscar usuarios"
            placeholder='Nombre, email, teléfono...'
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
                <tr key={user.id}>
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
                      <span className='user-id'>{user.id}</span>
                    </div>
                  </td>
                  <td className='user-contact-cell'>
                    <div className='user-contact-info'>
                      <span className='user-email'>{user.email}</span>
                      <span className='user-phone'>{user.phone}</span>
                    </div>
                  </td>
                  <td>
                    {user.roles.map(role => (
                      <span className={`user-role-badge ${role.slug}`}>{role.name}</span>
                    ))}
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
                      {auth && authenticationHelper.hasAnyPermission(auth, ['users:delete']) && (
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
                  {userToDelete.roles.map((role, index) => (
                    <Chip
                      key={index}
                      label={role.name}
                      size="small"
                      sx={{
                        backgroundColor: role.slug === 'USER' ? '#DCFCE7' : '#f3bd5f',
                        color: role.slug === 'USER' ? '#166534' : '#000',
                        fontSize: '0.75rem',
                        height: '24px'
                      }}
                    />
                  ))}
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
    </div>
  );
};

export default Users;