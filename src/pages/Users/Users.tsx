import React, { useState, useEffect } from 'react';
import './styles.css';
import { Button } from '../../components/Button';
import { Icon, Icons } from '../../components/Icon';
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Dayjs } from 'dayjs';
import { Dialog, DialogTitle, DialogContent, DialogActions, Skeleton } from '@mui/material';
import type { UserPreview } from '../../models/UserPreview';
import { userService } from '../../services/UserService';
import { DashboardModuleTopBar } from '../../components/DashboardModuleTopBar/DashboardModuleTopBar';
import type { UserPreviewQuery } from '../../models/UserPreviewQuery';
import type { PaginationRequest } from '../../models/PaginationRequest';
import { useDebounce } from '../../hooks/useDebounce';
import { SortableColumnHeader } from '../../components/SortableColumnHeader/SortableColumnHeader';
import type { SortRequest } from '../../models/SortRequest';

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

type Filters = {
  search: string;
  role: string;
  membershipMinDate: Dayjs | null;
  membershipMaxDate: Dayjs | null;
  minLoans: string;
  maxLoans: string;
};

type SortableColumn = 'name' | 'contact' | 'role' | 'memberSince' | 'activeLoans';

type PaginationState = {
  sort?: SortableColumn;
  order?: 'asc' | 'desc';
};

type UsersState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; users: UserPreview[] };

const Users: React.FC = () => {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    role: '',
    membershipMinDate: null,
    membershipMaxDate: null,
    minLoans: '',
    maxLoans: ''
  });

  const [paginationState, setPaginationState] = useState<PaginationState>({
    sort: undefined,
    order: undefined
  });

  const [usersState, setUsersState] = useState<UsersState>({ status: 'idle' });

  const [errorOpen, setErrorOpen] = useState(false);

  const debouncedSearch = useDebounce(filters.search, 500);

  useEffect(() => {
    const fetchUsers = async () => {
      setUsersState({ status: 'loading' });
      try {
        const users = await userService.getUsersPreviews(toQuery(filters), pagination(paginationState));
        setUsersState({ status: 'success', users });
      } catch (error: any) {
        setUsersState({ status: 'error', error: error.message || 'Unknown error' });
        setErrorOpen(true);
      }
    };

    fetchUsers();
  }, [debouncedSearch, filters.role, filters.membershipMinDate, filters.membershipMaxDate, filters.minLoans, filters.maxLoans, paginationState]);

  const toQuery = (filters: Filters): UserPreviewQuery => {
    return {
      search: filters.search,
      memberSinceMin: filters.membershipMinDate?.toDate(),
      memberSinceMax: filters.membershipMaxDate?.toDate(),
      role: filters.role ? [filters.role] : undefined,
      activeBookLoansMin: filters.minLoans ? parseInt(filters.minLoans, 10) : undefined,
      activeBookLoansMax: filters.maxLoans ? parseInt(filters.maxLoans, 10) : undefined,
    };
  }

  const pagination = (paginationState: PaginationState): PaginationRequest => {
    const sorts = mapSort(paginationState);
    return {
      sorts: sorts,
      page: 0,
      size: 20
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

    if (paginationState.sort === 'memberSince') {
      return [{ sort: 'createdAt', order: paginationState.order }];
    }

    if (paginationState.sort === 'activeLoans') {
      return [{ sort: 'activeLoans', order: paginationState.order }];
    }

    return [];
  }

  const handleFilterChange = (field: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const closeError = (_: any) => setErrorOpen(false);

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
              <MenuItem value="admin">Administrador</MenuItem>
              <MenuItem value="user">Usuario</MenuItem>
              <MenuItem value="staff">Personal</MenuItem>
            </Select>
          </FormControl>
        </div>

        {/* Fechas membresía */}
        <div className='filter-item'>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Fecha membresía (mín)"
              value={filters.membershipMinDate}
              onChange={(v) => handleFilterChange('membershipMinDate', v)}
              slotProps={datePickerslotProps}

            />
          </LocalizationProvider>
        </div>
        <div className='filter-item'>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Fecha membresía (max)"
              value={filters.membershipMaxDate}
              onChange={(v) => handleFilterChange('membershipMaxDate', v)}
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
              Préstamos vigentes (min)
            </InputLabel>
            <Select
              labelId="min-loans-label"
              value={filters.minLoans}
              onChange={(e) => handleFilterChange('minLoans', e.target.value)}
              label="Préstamos vigentes (mín)"
              size='small'

            >
              <MenuItem value="">Cualquiera</MenuItem>
              {loanOptions.map((num) => (
                <MenuItem key={num} value={num}>{num}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div className='filter-item'>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="max-loans-label" sx={dropdownLabelStyles}>Préstamos vigentes (max)</InputLabel>
            <Select
              labelId="max-loans-label"
              value={filters.maxLoans}
              onChange={(e) => handleFilterChange('maxLoans', e.target.value)}
              label="Préstamos vigentes (max)"
              size='small'

            >
              <MenuItem value="">Cualquiera</MenuItem>
              {loanOptions.map((num) => (
                <MenuItem key={num} value={num}>{num}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>

      {/* Table / Spinner */}
      <div className='table-container' style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>

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
                  active={paginationState.sort === 'memberSince'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("memberSince")) }}
                  style={{ width: '22%' }}
                />
                <SortableColumnHeader
                  title='Préstamos vigentes'
                  active={paginationState.sort === 'activeLoans'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("activeLoans")) }}
                  style={{ width: '10%' }}
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
              {usersState.status === 'success' && usersState.users.map(user => (
                <tr key={user.id}>
                  <td className='user-info-cell'>
                    <div className='user-avatar-container'>
                      <Icon name={Icons.user_avatar} />
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
                  <td>{user.memberSince}</td>
                  <td>{user.activeLoans}</td>
                  <td>
                    <div className='actions'>
                      <button className='action-button edit-button'>
                        <EditIcon className='edit-icon' />
                      </button>
                      <button className='action-button delete-button'>
                        <DeleteIcon className='delete-icon' />
                      </button>
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
    </div>
  );
};

export default Users;