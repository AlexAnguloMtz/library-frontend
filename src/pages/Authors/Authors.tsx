import React, { useState, useEffect } from 'react';
import './styles.css';
import { Button } from '../../components/Button';
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import { Dialog, DialogTitle, DialogContent, DialogActions, Skeleton, Pagination, MenuItem, Box, Typography, CircularProgress, Checkbox, FormControl, InputLabel, Select, Chip, OutlinedInput, TextField, Alert } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { DashboardModuleTopBar } from '../../components/DashboardModuleTopBar/DashboardModuleTopBar';
import type { GetAuthorPreviewsRequest } from '../../models/GetAuthorPreviewsRequest';
import type { PaginationRequest } from '../../models/PaginationRequest';
import { useDebounce } from '../../hooks/useDebounce';
import { SortableColumnHeader } from '../../components/SortableColumnHeader/SortableColumnHeader';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { SortRequest } from '../../models/SortRequest';
import type { PaginationResponse } from '../../models/PaginationResponse';
import authenticationHelper from '../../util/AuthenticationHelper';
import type { AuthenticationResponse } from '../../models/AuthenticationResponse';
import { CopyToClipboard } from '../../components/CopyToClipboard/CopyToClipboard';
import authorService from '../../services/AuthorService';
import * as blobHelpers from '../../util/BlobHelpers';
import type { AuthorPreview } from '../../models/AuthorPreview';
import type { OptionResponse } from '../../models/OptionResponse';
import type { UpdateAuthorRequest } from '../../models/UpdateAuthorRequest';

type AuthorFilters = {
  search: string;
  countryId: string[];
  birthYearMin: string;
  birthYearMax: string;
  booksMin: string;
  booksMax: string;
};

type SortableColumn = 'name' | 'country' | 'dateOfBirth' | 'bookCount';

type PaginationState = {
  sort?: SortableColumn;
  order?: 'asc' | 'desc';
};

type PaginationControls = {
  page: number;
  size: number;
};

type AuthorsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; response: PaginationResponse<AuthorPreview> };

type OptionsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; countries: OptionResponse[] };

// Zod schema para validación del formulario de editar autor
const updateAuthorSchema = z.object({
  firstName: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  lastName: z.string()
    .min(1, 'El apellido es requerido')
    .max(100, 'El apellido no puede exceder 100 caracteres'),
  countryId: z.string().min(1, 'El país es requerido'),
  dateOfBirth: z.any().refine((val) => val && val.isValid && val.isValid(), 'La fecha de nacimiento es requerida')
});

type UpdateAuthorFormData = z.infer<typeof updateAuthorSchema>;


// Generate years: current year, then multiples of 20 (cached)
const generateYears = (() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  
  // Add current year first
  years.push(currentYear.toString());
  
  // Find next multiple of 20 below current year
  const nextMultipleOf20 = Math.floor(currentYear / 20) * 20;
  
  // Add multiples of 20 from nextMultipleOf20 down to 20
  for (let year = nextMultipleOf20; year >= 20; year -= 20) {
    if (year !== currentYear) { // Don't repeat current year if it's a multiple of 20
      years.push(year.toString());
    }
  }
  
  return years;
})();

// Generate book counts: 0-10 individually, then 15-100 by 5s (cached)
const generateBookCounts = (() => {
  const counts = [];
  
  // Add 0-10 individually
  for (let i = 0; i <= 10; i++) {
    counts.push(i);
  }
  
  // Add 15-100 by 5s
  for (let i = 15; i <= 100; i += 5) {
    counts.push(i);
  }
  
  return counts;
})();

const Authors: React.FC = () => {
  const [filters, setFilters] = useState<AuthorFilters>({
    search: '',
    countryId: [],
    birthYearMin: '',
    birthYearMax: '',
    booksMin: '',
    booksMax: ''
  });

  const [paginationState, setPaginationState] = useState<PaginationState>({
    sort: undefined,
    order: undefined
  });

  const [paginationControls, setPaginationControls] = useState<PaginationControls>({
    page: 0,
    size: 20
  });

  const [authorsState, setAuthorsState] = useState<AuthorsState>({ status: 'idle' });
  const [optionsState, setOptionsState] = useState<OptionsState>({ status: 'idle' });
  const [auth, setAuth] = useState<AuthenticationResponse | null>(null);
  const [displayPagination, setDisplayPagination] = useState<{ totalPages: number; page: number } | null>(null);
  const [displayCount, setDisplayCount] = useState<{ start: number; end: number; total: number } | null>(null);

  const [errorOpen, setErrorOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [authorToDelete, setAuthorToDelete] = useState<AuthorPreview | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Estados del modal de editar autor
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [authorToEdit, setAuthorToEdit] = useState<AuthorPreview | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Estados del modal de crear autor
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Estados para selección múltiple
  const [selectedAuthors, setSelectedAuthors] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportErrorOpen, setExportErrorOpen] = useState(false);
  const [exportErrorMessage, setExportErrorMessage] = useState('');

  const debouncedSearch = useDebounce(filters.search, 500);

  // React Hook Form setup para editar autor
  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors, isValid: isEditValid },
    reset: resetEditForm,
    setValue: setEditValue
  } = useForm<UpdateAuthorFormData>({
    resolver: zodResolver(updateAuthorSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      countryId: '',
      dateOfBirth: null
    }
  });

  // React Hook Form setup para crear autor
  const {
    control: createControl,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors, isValid: isCreateValid },
    reset: resetCreateForm
  } = useForm<UpdateAuthorFormData>({
    resolver: zodResolver(updateAuthorSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      countryId: '',
      dateOfBirth: null
    }
  });

  // Funciones para selección múltiple
  const handleSelectAuthor = (authorId: string) => {
    setSelectedAuthors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(authorId)) {
        newSet.delete(authorId);
      } else {
        newSet.add(authorId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (authorsState.status === 'success' && authorsState.response) {
      if (isAllSelected || selectedAuthors.size > 0) {
        // Deseleccionar todos
        setSelectedAuthors(new Set());
        setIsAllSelected(false);
      } else {
        // Seleccionar todos
        const allAuthorIds = new Set(authorsState.response.items.map(author => author.id));
        setSelectedAuthors(allAuthorIds);
        setIsAllSelected(true);
      }
    }
  };

  const handleBulkActions = async () => {
    try {
      setIsExporting(true);
      const selectedIds = Array.from(selectedAuthors);
      const blob: Blob = await authorService.exportAuthors(selectedIds);
      blobHelpers.downloadBlob(blob, "autores.pdf");
    } catch (error: any) {
      console.error('Error al exportar autores:', error);
      setExportErrorMessage(error.message || 'Error desconocido al exportar autores');
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

  // Load options in background
  useEffect(() => {
    const fetchOptions = async () => {
      setOptionsState({ status: 'loading' });
      try {
        const response = await authorService.getAuthorOptions();
        setOptionsState({ status: 'success', countries: response.countries });
      } catch (error: any) {
        // Fail silently as requested
        setOptionsState({ status: 'error' });
      }
    };

    fetchOptions();
  }, []);

  // Limpiar selección cuando cambien los datos
  useEffect(() => {
    if (authorsState.status === 'success' && authorsState.response) {
      setSelectedAuthors(new Set());
      setIsAllSelected(false);
    }
  }, [authorsState.status, authorsState.status === 'success' ? authorsState.response?.items : undefined]);

  // Sincronizar checkbox maestro
  useEffect(() => {
    if (authorsState.status === 'success' && authorsState.response) {
      const totalAuthors = authorsState.response.items.length;
      const selectedCount = selectedAuthors.size;
      
      if (selectedCount === 0) {
        setIsAllSelected(false);
      } else if (selectedCount === totalAuthors) {
        setIsAllSelected(true);
      } else {
        setIsAllSelected(false);
      }
    }
  }, [selectedAuthors, authorsState]);

  // Update display pagination and count only when we have successful data
  useEffect(() => {
    if (authorsState.status === 'success') {
      const response = authorsState.response;
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
  }, [authorsState]);

  // Reset pagination when filters change
  useEffect(() => {
    setPaginationControls(prev => ({ ...prev, page: 0 }));
  }, [debouncedSearch, filters.countryId, filters.birthYearMin, filters.birthYearMax, filters.booksMin, filters.booksMax]);

  useEffect(() => {
    const fetchAuthors = async () => {
      setAuthorsState({ status: 'loading' });
      try {
        const response = await authorService.getAuthorPreviews(toQuery(filters), pagination(paginationState, paginationControls));
        setAuthorsState({ status: 'success', response });
      } catch (error: any) {
        setAuthorsState({ status: 'error', error: error.message || 'Unknown error' });
        setErrorOpen(true);
      }
    };

    fetchAuthors();
  }, [debouncedSearch, filters.countryId, filters.birthYearMin, filters.birthYearMax, filters.booksMin, filters.booksMax, paginationState, paginationControls]);

  const toQuery = (filters: AuthorFilters): GetAuthorPreviewsRequest => {
    return {
      search: filters.search,
      countryId: filters.countryId.length > 0 ? filters.countryId : undefined,
      dateOfBirthMin: filters.birthYearMin ? `${filters.birthYearMin}-01-01` : undefined,
      dateOfBirthMax: filters.birthYearMax ? `${filters.birthYearMax}-12-31` : undefined,
      booksMin: filters.booksMin || undefined,
      booksMax: filters.booksMax || undefined
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

    if (paginationState.sort === 'country') {
      return [{ sort: 'country', order: paginationState.order }];
    }

    if (paginationState.sort === 'dateOfBirth') {
      return [{ sort: 'dateOfBirth', order: paginationState.order }];
    }

    if (paginationState.sort === 'bookCount') {
      return [{ sort: 'bookCount', order: paginationState.order }];
    }

    return [];
  }

  const handleFilterChange = (field: keyof typeof filters, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      
      // Validar que birthYearMin no sea posterior a birthYearMax
      if (field === 'birthYearMin' && value && prev.birthYearMax) {
        if (parseInt(value) > parseInt(prev.birthYearMax)) {
          newFilters.birthYearMax = value; // Ajustar birthYearMax al nuevo birthYearMin
        }
      }
      
      // Validar que birthYearMax no sea anterior a birthYearMin
      if (field === 'birthYearMax' && value && prev.birthYearMin) {
        if (parseInt(value) < parseInt(prev.birthYearMin)) {
          newFilters.birthYearMin = value; // Ajustar birthYearMin al nuevo birthYearMax
        }
      }
      
      // Validar que booksMin no sea mayor que booksMax
      if (field === 'booksMin' && value && prev.booksMax) {
        if (parseInt(value) > parseInt(prev.booksMax)) {
          newFilters.booksMax = value; // Ajustar booksMax al nuevo booksMin
        }
      }
      
      // Validar que booksMax no sea menor que booksMin
      if (field === 'booksMax' && value && prev.booksMin) {
        if (parseInt(value) < parseInt(prev.booksMin)) {
          newFilters.booksMin = value; // Ajustar booksMin al nuevo booksMax
        }
      }
      
      return newFilters;
    });
  };

  const closeError = (_: any) => setErrorOpen(false);

  const clearFilters = () => {
    setFilters({
      search: '',
      countryId: [],
      birthYearMin: '',
      birthYearMax: '',
      booksMin: '',
      booksMax: ''
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


  const handleEditAuthor = (authorId: string) => {
    const author = authorsState.status === 'success' 
      ? authorsState.response.items.find(a => a.id === authorId)
      : null;
    
    if (author) {
      setAuthorToEdit(author);
      setEditModalOpen(true);
      setUpdateSuccess(false);
      setUpdateError(null);
      
      // Llenar el formulario con los datos del autor
      setEditValue('firstName', author.firstName);
      setEditValue('lastName', author.lastName);
      setEditValue('countryId', author.country.id);
      setEditValue('dateOfBirth', author.dateOfBirth ? dayjs(author.dateOfBirth) : null);
    }
  };

  const handleDeleteClick = (author: AuthorPreview) => {
    setAuthorToDelete(author);
    setDeleteModalOpen(true);
    setDeleteSuccess(false);
    setDeleteError(null);
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setAuthorToDelete(null);
    setDeleteSuccess(false);
    setDeleteError(null);
  };

  const handleDeleteClose = () => {
    setDeleteModalOpen(false);
    setAuthorToDelete(null);
    setDeleteSuccess(false);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!authorToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      await authorService.deleteById(authorToDelete.id);
      
      // Remove author from table
      if (authorsState.status === 'success') {
        const updatedItems = authorsState.response.items.filter(author => author.id !== authorToDelete.id);
        const updatedResponse = {
          ...authorsState.response,
          items: updatedItems,
          totalItems: authorsState.response.totalItems - 1
        };
        setAuthorsState({ status: 'success', response: updatedResponse });
      }
      
      setDeleteSuccess(true);
    } catch (error: any) {
      console.error('Error deleting author:', error);
      setDeleteError(error.detail || error.message || 'Error desconocido al eliminar autor');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNewAuthor = () => {
    setCreateModalOpen(true);
    setCreateSuccess(false);
    setCreateError(null);
    resetCreateForm();
  };


  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setAuthorToEdit(null);
    setUpdateSuccess(false);
    setUpdateError(null);
    resetEditForm();
  };

  const handleRetryUpdate = () => {
    setUpdateError(null);
  };

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
    setCreateSuccess(false);
    setCreateError(null);
    resetCreateForm();
  };

  const handleRetryCreate = () => {
    setCreateError(null);
  };

  const onEditSubmit = async (data: UpdateAuthorFormData) => {
    if (!authorToEdit) return;
    
    setIsUpdating(true);
    setUpdateError(null);
    
    try {
      const updateRequest: UpdateAuthorRequest = {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth.toDate(),
        countryId: data.countryId
      };

      const updatedAuthor = await authorService.updateAuthor(authorToEdit.id, updateRequest);
      
      // Actualizar la fila en la tabla
      if (authorsState.status === 'success') {
        const updatedItems = authorsState.response.items.map(author => 
          author.id === authorToEdit.id ? {
            ...author,
            firstName: updatedAuthor.firstName,
            lastName: updatedAuthor.lastName,
            country: updatedAuthor.country,
            dateOfBirth: updatedAuthor.dateOfBirth
          } : author
        );
        const updatedResponse = {
          ...authorsState.response,
          items: updatedItems
        };
        setAuthorsState({ status: 'success', response: updatedResponse });
      }
      
      setUpdateSuccess(true);
    } catch (error: any) {
      console.error('Error updating author:', error);
      setUpdateError(error.detail || error.message || 'Error desconocido al actualizar autor');
    } finally {
      setIsUpdating(false);
    }
  };

  const onCreateSubmit = async (data: UpdateAuthorFormData) => {
    setIsCreating(true);
    setCreateError(null);
    
    try {
      const createRequest: UpdateAuthorRequest = {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth.toDate(),
        countryId: data.countryId
      };

      const newAuthor = await authorService.createAuthor(createRequest);
      
      // Agregar el nuevo autor a la tabla (al inicio)
      if (authorsState.status === 'success') {
        const updatedItems = [newAuthor, ...authorsState.response.items];
        const updatedResponse = {
          ...authorsState.response,
          items: updatedItems,
          totalItems: authorsState.response.totalItems + 1
        };
        setAuthorsState({ status: 'success', response: updatedResponse });
      }
      
      setCreateSuccess(true);
    } catch (error: any) {
      console.error('Error creating author:', error);
      setCreateError(error.detail || error.message || 'Error desconocido al crear autor');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className='parent-container'>
      <DashboardModuleTopBar
        title="Autores"
        onExportClick={handleBulkActions}
        onNewClick={handleNewAuthor}
        selectedCount={selectedAuthors.size}
        isExporting={isExporting}
        auth={auth}
        newPermission="authors:create"
      />

      {/* Filters */}
      <div className='filters'>
        {/* Buscar */}
        <div className='filter-item'>
          <TextField
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            label="Buscar"
            placeholder='Buscar...'
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

        {/* País */}
        <div className='filter-item'>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="country-label" sx={{
              transform: 'translate(14px, 9px) scale(1)',
              '&.MuiInputLabel-shrink': {
                transform: 'translate(14px, -6px) scale(0.75)',
              },
              fontSize: '1rem',
            }}>País</InputLabel>
            <Select
              labelId="country-label"
              multiple
              value={filters.countryId}
              onChange={(e) => handleFilterChange('countryId', e.target.value)}
              label="País"
              size='small'
              input={<OutlinedInput label="País" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const country = optionsState.status === 'success' 
                      ? optionsState.countries.find(c => c.value === value)
                      : null;
                    return (
                      <Chip 
                        key={value} 
                        label={country?.label || value} 
                        size="small"
                        sx={{ fontSize: '0.75rem', height: '20px' }}
                      />
                    );
                  })}
                </Box>
              )}
            >
              {optionsState.status === 'success' && optionsState.countries.map((country) => (
                <MenuItem key={country.value} value={country.value}>
                  {country.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        {/* Año de nacimiento mín */}
        <div className='filter-item'>
          <FormControl fullWidth size="small">
            <InputLabel>Año nacimiento (mín)</InputLabel>
            <Select
              value={filters.birthYearMin}
              onChange={(e) => handleFilterChange('birthYearMin', e.target.value)}
              label="Año nacimiento (mín)"
            >
              <MenuItem value="">
                <em>Todos</em>
              </MenuItem>
              {generateYears.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        {/* Año de nacimiento máx */}
        <div className='filter-item'>
          <FormControl fullWidth size="small">
            <InputLabel>Año nacimiento (máx)</InputLabel>
            <Select
              value={filters.birthYearMax}
              onChange={(e) => handleFilterChange('birthYearMax', e.target.value)}
              label="Año nacimiento (máx)"
            >
              <MenuItem value="">
                <em>Todos</em>
              </MenuItem>
              {generateYears.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        {/* Libros (mín) */}
        <div className='filter-item'>
          <FormControl fullWidth size="small">
            <InputLabel>Libros (mín)</InputLabel>
            <Select
              value={filters.booksMin}
              onChange={(e) => handleFilterChange('booksMin', e.target.value)}
              label="Libros (mín)"
              size='small'
            >
              <MenuItem value="">
                <em>Todos</em>
              </MenuItem>
              {generateBookCounts.map(count => {
                const isDisabled = Boolean(filters.booksMax && filters.booksMax !== '' && parseInt(filters.booksMax) < count);
                return (
                  <MenuItem 
                    key={count} 
                    value={count.toString()}
                    disabled={isDisabled}
                    sx={isDisabled ? { opacity: 0.5 } : {}}
                  >
                    {count}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </div>

        {/* Libros (máx) */}
        <div className='filter-item'>
          <FormControl fullWidth size="small">
            <InputLabel>Libros (máx)</InputLabel>
            <Select
              value={filters.booksMax}
              onChange={(e) => handleFilterChange('booksMax', e.target.value)}
              label="Libros (máx)"
              size='small'
            >
              <MenuItem value="">
                <em>Todos</em>
              </MenuItem>
              {generateBookCounts.map(count => {
                const isDisabled = Boolean(filters.booksMin && filters.booksMin !== '' && parseInt(filters.booksMin) > count);
                return (
                  <MenuItem 
                    key={count} 
                    value={count.toString()}
                    disabled={isDisabled}
                    sx={isDisabled ? { opacity: 0.5 } : {}}
                  >
                    {count}
                  </MenuItem>
                );
              })}
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
                    indeterminate={selectedAuthors.size > 0 && !isAllSelected}
                    onChange={handleSelectAll}
                    size="small"
                    disabled={authorsState.status === 'loading'}
                  />
                </SortableColumnHeader>
                <SortableColumnHeader
                  title='Nombre'
                  active={paginationState.sort === 'name'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("name")) }}
                  style={{ width: '50%' }}
                />
                <SortableColumnHeader
                  title='País'
                  active={paginationState.sort === 'country'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("country")) }}
                  style={{ width: '20%' }}
                />
                <SortableColumnHeader
                  title='Fecha de Nacimiento'
                  active={paginationState.sort === 'dateOfBirth'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("dateOfBirth")) }}
                  style={{ width: '20%' }}
                />
                <SortableColumnHeader
                  title='Libros registrados'
                  active={paginationState.sort === 'bookCount'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("bookCount")) }}
                  style={{ width: '15%' }}
                />
                <SortableColumnHeader
                  title='Acciones'
                  nonSortable={true}
                  style={{ width: '10%' }}
                />
              </tr>
            </thead>
            <tbody>
              {authorsState.status === 'loading' && (
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
                  </tr>
                ))
              )}
              {authorsState.status === 'success' && authorsState.response.items.map((author: AuthorPreview) => (
                <tr 
                  key={author.id}
                  style={{ 
                    backgroundColor: selectedAuthors.has(author.id) ? '#f0f9ff' : 'transparent' 
                  }}
                >
                  <td style={{ textAlign: 'center' }}>
                    <Checkbox
                      checked={selectedAuthors.has(author.id)}
                      onChange={() => handleSelectAuthor(author.id)}
                      size="small"
                    />
                  </td>
                  <td className='author-info-cell'>
                    <div className='author-name-and-id'>
                      <span className='author-name'>{author.lastName}, {author.firstName}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className='author-id'>ID: {author.id}</span>
                        <CopyToClipboard 
                          text={author.id}
                          size="tiny"
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className='author-country'>{author.country.name}</span>
                  </td>
                  <td>
                    <span className='author-date-of-birth'>{author.dateOfBirth}</span>
                  </td>
                  <td>
                    <span className='author-book-count'>{author.bookCount}</span>
                  </td>
                  <td>
                    <div className='actions'>
                      {auth && authenticationHelper.hasAnyPermission(auth, ['authors:edit']) && (
                        <button 
                          className='action-button edit-button'
                          onClick={() => handleEditAuthor(author.id)}
                        >
                          <EditIcon className='edit-icon' />
                        </button>
                      )}
                      {auth && authenticationHelper.hasAnyPermission(auth, ['authors:delete']) && (
                        <button 
                          className='action-button delete-button'
                          onClick={() => handleDeleteClick(author)}
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
          {authorsState.status === 'error' && authorsState.error}
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
          ¿Eliminar este autor?
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2, pb: 3 }}>
          {/* Alerts */}
          {deleteSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ¡Autor eliminado exitosamente!
            </Alert>
          )}
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}

          {!deleteSuccess && authorToDelete && (
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
                  ID:
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  color: '#1f2937',
                  textAlign: 'right',
                  flex: 1
                }}>
                  {authorToDelete.id}
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
                  Nombre:
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  color: '#1f2937',
                  textAlign: 'right',
                  flex: 1
                }}>
                  {authorToDelete.firstName}
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
                  Apellido:
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  color: '#1f2937',
                  textAlign: 'right',
                  flex: 1
                }}>
                  {authorToDelete.lastName}
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
                  País:
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  color: '#1f2937',
                  textAlign: 'right',
                  flex: 1
                }}>
                  {authorToDelete.country.name}
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
                  Fecha de Nacimiento:
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  color: '#1f2937',
                  textAlign: 'right',
                  flex: 1
                }}>
                  {authorToDelete.dateOfBirth}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          pt: 1,
          gap: 0.5,
          justifyContent: 'flex-end'
        }}>
          {deleteSuccess ? (
            <Button 
              type='primary' 
              onClick={handleDeleteClose}
              className='small-button'
            >
              Cerrar
            </Button>
          ) : (
            <>
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
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Modal de editar autor */}
      <Dialog 
        open={editModalOpen} 
        onClose={isUpdating ? undefined : handleCloseEditModal}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={isUpdating}
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
          Editar Autor
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2, pb: 3, paddingTop: '14px' }}>
          {/* Alerts */}
          {updateSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ¡Autor actualizado exitosamente!
            </Alert>
          )}
          {updateError && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              action={
                <Button type="secondary" onClick={handleRetryUpdate} className="small-button">
                  Reintentar
                </Button>
              }
            >
              {updateError}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Nombre y Apellido */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller
                name="firstName"
                control={editControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre"
                    variant="outlined"
                    size="small"
                    fullWidth
                    error={!!editErrors.firstName}
                    helperText={editErrors.firstName?.message}
                    disabled={isUpdating}
                  />
                )}
              />
              <Controller
                name="lastName"
                control={editControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Apellido"
                    variant="outlined"
                    size="small"
                    fullWidth
                    error={!!editErrors.lastName}
                    helperText={editErrors.lastName?.message}
                    disabled={isUpdating}
                  />
                )}
              />
            </Box>

            {/* País */}
            <Controller
              name="countryId"
              control={editControl}
              render={({ field }) => (
                <FormControl fullWidth size="small" error={!!editErrors.countryId}>
                  <InputLabel>País</InputLabel>
                  <Select
                    {...field}
                    label="País"
                    disabled={isUpdating}
                  >
                    {optionsState.status === 'success' && optionsState.countries.map((country) => (
                      <MenuItem key={country.value} value={country.value}>
                        {country.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {editErrors.countryId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {editErrors.countryId.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />

            {/* Fecha de Nacimiento */}
            <Controller
              name="dateOfBirth"
              control={editControl}
              render={({ field }) => (
                <Box>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                  <DatePicker
                    label="Fecha de Nacimiento"
                    value={field.value}
                    onChange={field.onChange}
                    minDate={dayjs('0001-01-01')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        error: !!editErrors.dateOfBirth,
                        disabled: isUpdating
                      }
                    }}
                  />
                </LocalizationProvider>
                  {editErrors.dateOfBirth && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {editErrors.dateOfBirth.message as string}
                    </Typography>
                  )}
                </Box>
              )}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          pt: 1,
          gap: 0.5,
          justifyContent: 'flex-end'
        }}>
          {updateSuccess ? (
            <Button 
              type='secondary' 
              onClick={handleCloseEditModal}
              className='small-button'
            >
              Cerrar
            </Button>
          ) : (
            <>
              <Button 
                type='secondary' 
                onClick={handleCloseEditModal}
                className='small-button'
                disabled={isUpdating}
              >
                Cancelar
              </Button>
              <Button 
                type='primary' 
                onClick={handleEditSubmit(onEditSubmit)}
                className='small-button'
                disabled={!isEditValid || isUpdating}
              >
                {isUpdating ? (
                  <>
                    <CircularProgress size={16} sx={{ color: 'white', mr: 1 }} />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Modal de crear autor */}
      <Dialog 
        open={createModalOpen} 
        onClose={isCreating ? undefined : handleCloseCreateModal}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={isCreating}
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
          Crear Autor
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2, pb: 3, paddingTop: '14px' }}>
          {/* Alerts */}
          {createSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ¡Autor creado exitosamente!
            </Alert>
          )}
          {createError && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              action={
                <Button type="secondary" onClick={handleRetryCreate} className="small-button">
                  Reintentar
                </Button>
              }
            >
              {createError}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Nombre y Apellido */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller
                name="firstName"
                control={createControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre"
                    variant="outlined"
                    size="small"
                    fullWidth
                    error={!!createErrors.firstName}
                    helperText={createErrors.firstName?.message}
                    disabled={isCreating}
                  />
                )}
              />
              <Controller
                name="lastName"
                control={createControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Apellido"
                    variant="outlined"
                    size="small"
                    fullWidth
                    error={!!createErrors.lastName}
                    helperText={createErrors.lastName?.message}
                    disabled={isCreating}
                  />
                )}
              />
            </Box>

            {/* País */}
            <Controller
              name="countryId"
              control={createControl}
              render={({ field }) => (
                <FormControl fullWidth size="small" error={!!createErrors.countryId}>
                  <InputLabel>País</InputLabel>
                  <Select
                    {...field}
                    label="País"
                    disabled={isCreating}
                  >
                    {optionsState.status === 'success' && optionsState.countries.map((country) => (
                      <MenuItem key={country.value} value={country.value}>
                        {country.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {createErrors.countryId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {createErrors.countryId.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />

            {/* Fecha de Nacimiento */}
            <Controller
              name="dateOfBirth"
              control={createControl}
              render={({ field }) => (
                <Box>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                  <DatePicker
                    label="Fecha de Nacimiento"
                    value={field.value}
                    onChange={field.onChange}
                    minDate={dayjs('0001-01-01')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        error: !!createErrors.dateOfBirth,
                        disabled: isCreating
                      }
                    }}
                  />
                </LocalizationProvider>
                  {createErrors.dateOfBirth && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {createErrors.dateOfBirth.message as string}
                    </Typography>
                  )}
                </Box>
              )}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          pt: 1,
          gap: 0.5,
          justifyContent: 'flex-end'
        }}>
          {createSuccess ? (
            <Button 
              type='secondary' 
              onClick={handleCloseCreateModal}
              className='small-button'
            >
              Cerrar
            </Button>
          ) : (
            <>
              <Button 
                type='secondary' 
                onClick={handleCloseCreateModal}
                className='small-button'
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button 
                type='primary' 
                onClick={handleCreateSubmit(onCreateSubmit)}
                className='small-button'
                disabled={!isCreateValid || isCreating}
              >
                {isCreating ? (
                  <>
                    <CircularProgress size={16} sx={{ color: 'white', mr: 1 }} />
                    Creando...
                  </>
                ) : (
                  'Crear'
                )}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Authors;
