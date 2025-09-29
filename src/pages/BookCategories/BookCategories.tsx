import React, { useState, useEffect } from 'react';
import './styles.css';
import { Button } from '../../components/Button';
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import { Dialog, DialogTitle, DialogContent, DialogActions, Skeleton, Pagination, MenuItem, Box, Typography, CircularProgress, Checkbox, FormControl, InputLabel, Select, TextField, Alert } from '@mui/material';
import { DashboardModuleTopBar } from '../../components/DashboardModuleTopBar/DashboardModuleTopBar';
import type { GetBookCategoriesRequest } from '../../models/GetBookCategoriesRequest';
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
import bookCategoryService from '../../services/BookCategoryService';
import * as blobHelpers from '../../util/BlobHelpers';
import type { BookCategoryResponse } from '../../models/BookCategoryResponse';
import type { BookCategoryRequest } from '../../models/BookCategoryRequest';

type BookCategoryFilters = {
  search: string;
  bookCountMin: string;
  bookCountMax: string;
};

type SortableColumn = 'name' | 'bookCount';

type PaginationState = {
  sort?: SortableColumn;
  order?: 'asc' | 'desc';
};

type PaginationControls = {
  page: number;
  size: number;
};

type BookCategoriesState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; response: PaginationResponse<BookCategoryResponse> };

// Zod schema para validación del formulario de editar categoría
const updateBookCategorySchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
});

type UpdateBookCategoryFormData = z.infer<typeof updateBookCategorySchema>;

// Generate book counts: 0-900 by 10s (cached)
const generateBookCounts = (() => {
  const counts = [];
  
  // Add 0-900 by 10s
  for (let i = 0; i <= 900; i += 10) {
    counts.push(i);
  }
  
  return counts;
})();

const BookCategories: React.FC = () => {
  const [filters, setFilters] = useState<BookCategoryFilters>({
    search: '',
    bookCountMin: '',
    bookCountMax: ''
  });

  const [paginationState, setPaginationState] = useState<PaginationState>({
    sort: undefined,
    order: undefined
  });

  const [paginationControls, setPaginationControls] = useState<PaginationControls>({
    page: 0,
    size: 20
  });

  const [bookCategoriesState, setBookCategoriesState] = useState<BookCategoriesState>({ status: 'idle' });
  const [auth, setAuth] = useState<AuthenticationResponse | null>(null);
  const [displayPagination, setDisplayPagination] = useState<{ totalPages: number; page: number } | null>(null);
  const [displayCount, setDisplayCount] = useState<{ start: number; end: number; total: number } | null>(null);

  const [errorOpen, setErrorOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bookCategoryToDelete, setBookCategoryToDelete] = useState<BookCategoryResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Estados del modal de editar categoría
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [bookCategoryToEdit, setBookCategoryToEdit] = useState<BookCategoryResponse | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Estados del modal de crear categoría
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdBookCategory, setCreatedBookCategory] = useState<BookCategoryResponse | null>(null);

  // Estados para selección múltiple
  const [selectedBookCategories, setSelectedBookCategories] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportErrorOpen, setExportErrorOpen] = useState(false);
  const [exportErrorMessage, setExportErrorMessage] = useState('');

  const debouncedSearch = useDebounce(filters.search, 500);

  // React Hook Form setup para editar categoría
  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors, isValid: isEditValid },
    reset: resetEditForm,
    setValue: setEditValue
  } = useForm<UpdateBookCategoryFormData>({
    resolver: zodResolver(updateBookCategorySchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: ''
    }
  });

  // React Hook Form setup para crear categoría
  const {
    control: createControl,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors, isValid: isCreateValid },
    reset: resetCreateForm
  } = useForm<UpdateBookCategoryFormData>({
    resolver: zodResolver(updateBookCategorySchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: ''
    }
  });

  // Funciones para selección múltiple
  const handleSelectBookCategory = (bookCategoryId: string) => {
    setSelectedBookCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookCategoryId)) {
        newSet.delete(bookCategoryId);
      } else {
        newSet.add(bookCategoryId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (bookCategoriesState.status === 'success' && bookCategoriesState.response) {
      if (isAllSelected || selectedBookCategories.size > 0) {
        // Deseleccionar todos
        setSelectedBookCategories(new Set());
        setIsAllSelected(false);
      } else {
        // Seleccionar todos
        const allBookCategoryIds = new Set(bookCategoriesState.response.items.map(bookCategory => bookCategory.id));
        setSelectedBookCategories(allBookCategoryIds);
        setIsAllSelected(true);
      }
    }
  };

  const handleBulkActions = async () => {
    try {
      setIsExporting(true);
      const selectedIds = Array.from(selectedBookCategories);
      const blob: Blob = await bookCategoryService.exportBookCategories(selectedIds);
      blobHelpers.downloadBlob(blob, "categorias.pdf");
    } catch (error: any) {
      console.error('Error al exportar categorías:', error);
      setExportErrorMessage(error.message || 'Error desconocido al exportar categorías');
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
    if (bookCategoriesState.status === 'success' && bookCategoriesState.response) {
      setSelectedBookCategories(new Set());
      setIsAllSelected(false);
    }
  }, [bookCategoriesState.status, bookCategoriesState.status === 'success' ? bookCategoriesState.response?.items : undefined]);

  // Sincronizar checkbox maestro
  useEffect(() => {
    if (bookCategoriesState.status === 'success' && bookCategoriesState.response) {
      const totalBookCategories = bookCategoriesState.response.items.length;
      const selectedCount = selectedBookCategories.size;
      
      if (selectedCount === 0) {
        setIsAllSelected(false);
      } else if (selectedCount === totalBookCategories) {
        setIsAllSelected(true);
      } else {
        setIsAllSelected(false);
      }
    }
  }, [selectedBookCategories, bookCategoriesState]);

  // Update display pagination and count only when we have successful data
  useEffect(() => {
    if (bookCategoriesState.status === 'success') {
      const response = bookCategoriesState.response;
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
  }, [bookCategoriesState]);

  // Reset pagination when filters change
  useEffect(() => {
    setPaginationControls(prev => ({ ...prev, page: 0 }));
  }, [debouncedSearch, filters.bookCountMin, filters.bookCountMax]);

  useEffect(() => {
    const fetchBookCategories = async () => {
      setBookCategoriesState({ status: 'loading' });
      try {
        const response = await bookCategoryService.getBookCategories(toQuery(filters), pagination(paginationState, paginationControls));
        setBookCategoriesState({ status: 'success', response });
      } catch (error: any) {
        setBookCategoriesState({ status: 'error', error: error.message || 'Unknown error' });
        setErrorOpen(true);
      }
    };

    fetchBookCategories();
  }, [debouncedSearch, filters.bookCountMin, filters.bookCountMax, paginationState, paginationControls]);

  const toQuery = (filters: BookCategoryFilters): GetBookCategoriesRequest => {
    return {
      search: filters.search,
      bookCountMin: filters.bookCountMin || undefined,
      bookCountMax: filters.bookCountMax || undefined
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
      return [{ sort: 'name', order: paginationState.order }];
    }

    if (paginationState.sort === 'bookCount') {
      return [{ sort: 'bookCount', order: paginationState.order }];
    }

    return [];
  }

  const handleFilterChange = (field: keyof typeof filters, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      
      // Validar que bookCountMin no sea mayor que bookCountMax
      if (field === 'bookCountMin' && value && prev.bookCountMax) {
        if (parseInt(value) > parseInt(prev.bookCountMax)) {
          newFilters.bookCountMax = value; // Ajustar bookCountMax al nuevo bookCountMin
        }
      }
      
      // Validar que bookCountMax no sea menor que bookCountMin
      if (field === 'bookCountMax' && value && prev.bookCountMin) {
        if (parseInt(value) < parseInt(prev.bookCountMin)) {
          newFilters.bookCountMin = value; // Ajustar bookCountMin al nuevo bookCountMax
        }
      }
      
      return newFilters;
    });
  };

  const closeError = (_: any) => setErrorOpen(false);

  const clearFilters = () => {
    setFilters({
      search: '',
      bookCountMin: '',
      bookCountMax: ''
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


  const handleEditBookCategory = (bookCategoryId: string) => {
    const bookCategory = bookCategoriesState.status === 'success' 
      ? bookCategoriesState.response.items.find(bc => bc.id === bookCategoryId)
      : null;
    
    if (bookCategory) {
      setBookCategoryToEdit(bookCategory);
      setEditModalOpen(true);
      setUpdateSuccess(false);
      setUpdateError(null);
      
      // Llenar el formulario con los datos de la categoría
      setEditValue('name', bookCategory.name);
    }
  };

  const handleDeleteClick = (bookCategory: BookCategoryResponse) => {
    setBookCategoryToDelete(bookCategory);
    setDeleteModalOpen(true);
    setDeleteSuccess(false);
    setDeleteError(null);
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setBookCategoryToDelete(null);
    setDeleteSuccess(false);
    setDeleteError(null);
  };

  const handleDeleteClose = () => {
    setDeleteModalOpen(false);
    setBookCategoryToDelete(null);
    setDeleteSuccess(false);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!bookCategoryToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      await bookCategoryService.deleteById(bookCategoryToDelete.id);
      
      // Remove book category from table
      if (bookCategoriesState.status === 'success') {
        const updatedItems = bookCategoriesState.response.items.filter(bookCategory => bookCategory.id !== bookCategoryToDelete.id);
        const updatedResponse = {
          ...bookCategoriesState.response,
          items: updatedItems,
          totalItems: bookCategoriesState.response.totalItems - 1
        };
        setBookCategoriesState({ status: 'success', response: updatedResponse });
      }
      
      setDeleteSuccess(true);
    } catch (error: any) {
      console.error('Error deleting book category:', error);
      setDeleteError(error.detail || error.message || 'Error desconocido al eliminar categoría');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNewBookCategory = () => {
    setCreateModalOpen(true);
    setCreateSuccess(false);
    setCreateError(null);
    resetCreateForm();
  };


  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setBookCategoryToEdit(null);
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
    setCreatedBookCategory(null);
    resetCreateForm();
  };

  const handleRetryCreate = () => {
    setCreateError(null);
  };

  const onEditSubmit = async (data: UpdateBookCategoryFormData) => {
    if (!bookCategoryToEdit) return;
    
    setIsUpdating(true);
    setUpdateError(null);
    
    try {
      const updateRequest: BookCategoryRequest = {
        name: data.name
      };

      const updatedBookCategory = await bookCategoryService.updateBookCategory(bookCategoryToEdit.id, updateRequest);
      
      // Actualizar la fila en la tabla
      if (bookCategoriesState.status === 'success') {
        const updatedItems = bookCategoriesState.response.items.map(bookCategory => 
          bookCategory.id === bookCategoryToEdit.id ? updatedBookCategory : bookCategory
        );
        const updatedResponse = {
          ...bookCategoriesState.response,
          items: updatedItems
        };
        setBookCategoriesState({ status: 'success', response: updatedResponse });
      }
      
      setUpdateSuccess(true);
    } catch (error: any) {
      console.error('Error updating book category:', error);
      setUpdateError(error.detail || error.message || 'Error desconocido al actualizar categoría');
    } finally {
      setIsUpdating(false);
    }
  };

  const onCreateSubmit = async (data: UpdateBookCategoryFormData) => {
    setIsCreating(true);
    setCreateError(null);
    
    try {
      const createRequest: BookCategoryRequest = {
        name: data.name
      };

      const newBookCategory = await bookCategoryService.createBookCategory(createRequest);
      
      // Agregar la nueva categoría a la tabla (al inicio)
      if (bookCategoriesState.status === 'success') {
        const updatedItems = [newBookCategory, ...bookCategoriesState.response.items];
        const updatedResponse = {
          ...bookCategoriesState.response,
          items: updatedItems,
          totalItems: bookCategoriesState.response.totalItems + 1
        };
        setBookCategoriesState({ status: 'success', response: updatedResponse });
      }
      
      setCreatedBookCategory(newBookCategory);
      setCreateSuccess(true);
    } catch (error: any) {
      console.error('Error creating book category:', error);
      setCreateError(error.detail || error.message || 'Error desconocido al crear categoría');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className='parent-container'>
      <DashboardModuleTopBar
        title="Categorías"
        onExportClick={handleBulkActions}
        onNewClick={handleNewBookCategory}
        selectedCount={selectedBookCategories.size}
        isExporting={isExporting}
        auth={auth}
        newPermission="book-categories:create"
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

        {/* Libros registrados (mín) */}
        <div className='filter-item'>
          <FormControl fullWidth size="small">
            <InputLabel>Libros registrados (mín)</InputLabel>
            <Select
              value={filters.bookCountMin}
              onChange={(e) => handleFilterChange('bookCountMin', e.target.value)}
              label="Libros registrados (mín)"
            >
              <MenuItem value="">
                <em>Todos</em>
              </MenuItem>
              {generateBookCounts.map(count => {
                const isDisabled = Boolean(filters.bookCountMax && filters.bookCountMax !== '' && parseInt(filters.bookCountMax) < count);
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

        {/* Libros registrados (máx) */}
        <div className='filter-item'>
          <FormControl fullWidth size="small">
            <InputLabel>Libros registrados (máx)</InputLabel>
            <Select
              value={filters.bookCountMax}
              onChange={(e) => handleFilterChange('bookCountMax', e.target.value)}
              label="Libros registrados (máx)"
            >
              <MenuItem value="">
                <em>Todos</em>
              </MenuItem>
              {generateBookCounts.map(count => {
                const isDisabled = Boolean(filters.bookCountMin && filters.bookCountMin !== '' && parseInt(filters.bookCountMin) > count);
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
                    indeterminate={selectedBookCategories.size > 0 && !isAllSelected}
                    onChange={handleSelectAll}
                    size="small"
                    disabled={bookCategoriesState.status === 'loading'}
                  />
                </SortableColumnHeader>
                <SortableColumnHeader
                  title='Categoría'
                  active={paginationState.sort === 'name'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("name")) }}
                  style={{ width: '70%' }}
                />
                <SortableColumnHeader
                  title='Libros registrados'
                  active={paginationState.sort === 'bookCount'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("bookCount")) }}
                  style={{ width: '20%' }}
                />
                <SortableColumnHeader
                  title='Acciones'
                  nonSortable={true}
                  style={{ width: '10%' }}
                />
              </tr>
            </thead>
            <tbody>
              {bookCategoriesState.status === 'loading' && (
                Array.from({ length: 15 }).map((_, i) => (
                  <tr key={i}>
                    <td style={{ width: '50px', textAlign: 'center' }}>
                      <Checkbox disabled size="small" />
                    </td>
                    <td><Skeleton variant="rectangular" height={40} /></td>
                    <td><Skeleton variant="rectangular" height={40} /></td>
                    <td><Skeleton variant="rectangular" height={40} /></td>
                  </tr>
                ))
              )}
              {bookCategoriesState.status === 'success' && bookCategoriesState.response.items.map((bookCategory: BookCategoryResponse) => (
                <tr 
                  key={bookCategory.id}
                  style={{ 
                    backgroundColor: selectedBookCategories.has(bookCategory.id) ? '#f0f9ff' : 'transparent' 
                  }}
                >
                  <td style={{ textAlign: 'center' }}>
                    <Checkbox
                      checked={selectedBookCategories.has(bookCategory.id)}
                      onChange={() => handleSelectBookCategory(bookCategory.id)}
                      size="small"
                    />
                  </td>
                  <td className='author-info-cell'>
                    <div className='author-name-and-id'>
                      <span className='author-name'>{bookCategory.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className='author-id'>ID: {bookCategory.id}</span>
                        <CopyToClipboard 
                          text={bookCategory.id}
                          size="tiny"
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className='author-book-count'>{bookCategory.bookCount}</span>
                  </td>
                  <td>
                    <div className='actions'>
                      {auth && authenticationHelper.hasAnyPermission(auth, ['book-categories:update']) && (
                        <button 
                          className='action-button edit-button'
                          onClick={() => handleEditBookCategory(bookCategory.id)}
                        >
                          <EditIcon className='edit-icon' />
                        </button>
                      )}
                      {auth && authenticationHelper.hasAnyPermission(auth, ['book-categories:delete']) && (
                        <button 
                          className='action-button delete-button'
                          onClick={() => handleDeleteClick(bookCategory)}
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
          {bookCategoriesState.status === 'error' && bookCategoriesState.error}
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
          ¿Eliminar esta categoría?
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2, pb: 3 }}>
          {/* Alerts */}
          {deleteSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ¡Categoría eliminada exitosamente!
            </Alert>
          )}
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}

          {!deleteSuccess && bookCategoryToDelete && (
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
                  {bookCategoryToDelete.id}
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
                  {bookCategoryToDelete.name}
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
                  Libros registrados:
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  color: '#1f2937',
                  textAlign: 'right',
                  flex: 1
                }}>
                  {bookCategoryToDelete.bookCount}
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
          Editar Categoría
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2, pb: 3, paddingTop: '14px' }}>
          {/* Alerts */}
          {updateSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ¡Categoría actualizada exitosamente!
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

          {updateSuccess ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 500, color: '#1f2937' }}>
                Nombre: {bookCategoryToEdit?.name}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Nombre */}
              <Controller
                name="name"
                control={editControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre"
                    variant="outlined"
                    size="small"
                    fullWidth
                    error={!!editErrors.name}
                    helperText={editErrors.name?.message}
                    disabled={isUpdating}
                  />
                )}
              />
            </Box>
          )}
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
          Crear Categoría
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2, pb: 3, paddingTop: '14px' }}>
          {/* Alerts */}
          {createSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ¡Categoría creada exitosamente!
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

          {createSuccess ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 500, color: '#1f2937' }}>
                Nombre: {createdBookCategory?.name}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Nombre */}
              <Controller
                name="name"
                control={createControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre"
                    variant="outlined"
                    size="small"
                    fullWidth
                    error={!!createErrors.name}
                    helperText={createErrors.name?.message}
                    disabled={isCreating}
                  />
                )}
              />
            </Box>
          )}
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

export default BookCategories;
