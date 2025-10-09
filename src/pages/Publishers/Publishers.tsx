import React, { useState, useEffect } from 'react';
import './styles.css';
import { Button } from '../../components/Button';
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import FolderCopy from "@mui/icons-material/FolderCopy";
import { Dialog, DialogTitle, DialogContent, DialogActions, Skeleton, Pagination, MenuItem, Box, Typography, CircularProgress, Checkbox, FormControl, InputLabel, Select, TextField, Alert } from '@mui/material';
import { DashboardModuleTopBar } from '../../components/DashboardModuleTopBar/DashboardModuleTopBar';
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
import publisherService from '../../services/PublisherService';
import * as blobHelpers from '../../util/BlobHelpers';
import type { PublisherResponse } from '../../models/PublisherResponse';
import type { MergeState } from '../../components/MergePublishersModal/MergePublishersModal';
import type { GetPublishersRequest } from '../../models/GetPublishersRequest';
import type { PublisherRequest } from '../../models/PublisherRequest';
import type { MergePublishersRequest } from '../../models/MergePublishersRequest';
import MergePublishersModal from '../../components/MergePublishersModal/MergePublishersModal';

type Filters = {
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

type ItemsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; response: PaginationResponse<PublisherResponse> };

// Zod schema para validación del formulario de editar
const updatePublisherSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
});

type UpdatePublisherFormData = z.infer<typeof updatePublisherSchema>;

// Generate book counts: 0-900 by 10s (cached)
const generateBookCounts = (() => {
  const counts = [];

  // Add 0-900 by 10s
  for (let i = 0; i <= 900; i += 10) {
    counts.push(i);
  }

  return counts;
})();

const Publishers: React.FC = () => {
  const [filters, setFilters] = useState<Filters>({
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

  const [itemsState, setItemsState] = useState<ItemsState>({ status: 'idle' });
  const [auth, setAuth] = useState<AuthenticationResponse | null>(null);
  const [displayPagination, setDisplayPagination] = useState<{ totalPages: number; page: number } | null>(null);
  const [displayCount, setDisplayCount] = useState<{ start: number; end: number; total: number } | null>(null);

  const [errorOpen, setErrorOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PublisherResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<PublisherResponse | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [savedItem, setSavedItem] = useState<PublisherResponse | null>(null);

  // Estados para selección múltiple
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportErrorOpen, setExportErrorOpen] = useState(false);
  const [exportErrorMessage, setExportErrorMessage] = useState('');

  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeState, setMergeState] = useState<MergeState>({ type: 'idle' });

  const debouncedSearch = useDebounce(filters.search, 500);

  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors, isValid: isEditValid },
    reset: resetEditForm,
    setValue: setEditValue
  } = useForm<UpdatePublisherFormData>({
    resolver: zodResolver(updatePublisherSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: ''
    }
  });

  const {
    control: createControl,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors, isValid: isCreateValid },
    reset: resetCreateForm
  } = useForm<UpdatePublisherFormData>({
    resolver: zodResolver(updatePublisherSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: ''
    }
  });

  // Funciones para selección múltiple
  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (itemsState.status === 'success' && itemsState.response) {
      if (isAllSelected || selectedItems.size > 0) {
        // Deseleccionar todos
        setSelectedItems(new Set());
        setIsAllSelected(false);
      } else {
        // Seleccionar todos
        const allIds = new Set(itemsState.response.items.map(item => item.id));
        setSelectedItems(allIds);
        setIsAllSelected(true);
      }
    }
  };

  const handleBulkActions = async () => {
    try {
      setIsExporting(true);
      const selectedIds = Array.from(selectedItems);
      const blob: Blob = await publisherService.exportPublishers(selectedIds);
      blobHelpers.downloadBlob(blob, "editoriales.pdf");
    } catch (error: any) {
      setExportErrorMessage(error.message || 'Error desconocido al exportar');
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
    if (itemsState.status === 'success' && itemsState.response) {
      setSelectedItems(new Set());
      setIsAllSelected(false);
    }
  }, [itemsState.status, itemsState.status === 'success' ? itemsState.response?.items : undefined]);

  // Sincronizar checkbox maestro
  useEffect(() => {
    if (itemsState.status === 'success' && itemsState.response) {
      const totalItems = itemsState.response.items.length;
      const selectedCount = selectedItems.size;

      if (selectedCount === 0) {
        setIsAllSelected(false);
      } else if (selectedCount === totalItems) {
        setIsAllSelected(true);
      } else {
        setIsAllSelected(false);
      }
    }
  }, [selectedItems, itemsState]);

  // Update display pagination and count only when we have successful data
  useEffect(() => {
    if (itemsState.status === 'success') {
      const response = itemsState.response;
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
  }, [itemsState]);

  // Reset pagination when filters change
  useEffect(() => {
    setPaginationControls(prev => ({ ...prev, page: 0 }));
  }, [debouncedSearch, filters.bookCountMin, filters.bookCountMax]);

  useEffect(() => {
    fetchItems();
  }, [debouncedSearch, filters.bookCountMin, filters.bookCountMax, paginationState, paginationControls]);


  const fetchItems = async () => {
    setItemsState({ status: 'loading' });
    try {
      const response = await publisherService.getPublishers(toQuery(filters), pagination(paginationState, paginationControls));
      setItemsState({ status: 'success', response });
    } catch (error: any) {
      setItemsState({ status: 'error', error: error.message || 'Unknown error' });
      setErrorOpen(true);
    }
  };

  const toQuery = (filters: Filters): GetPublishersRequest => {
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


  const handleEditItem = (id: string) => {
    const item = itemsState.status === 'success'
      ? itemsState.response.items.find(bc => bc.id === id)
      : null;

    if (item) {
      setItemToEdit(item);
      setEditModalOpen(true);
      setUpdateSuccess(false);
      setUpdateError(null);

      setEditValue('name', item.name);
    }
  };

  const handleDeleteClick = (item: PublisherResponse) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
    setDeleteSuccess(false);
    setDeleteError(null);
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
    setDeleteSuccess(false);
    setDeleteError(null);
  };

  const handleDeleteClose = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
    setDeleteSuccess(false);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await publisherService.deleteById(itemToDelete.id);

      if (itemsState.status === 'success') {
        const updatedItems = itemsState.response.items.filter(item => item.id !== itemToDelete.id);
        const updatedResponse = {
          ...itemsState.response,
          items: updatedItems,
          totalItems: itemsState.response.totalItems - 1
        };
        setItemsState({ status: 'success', response: updatedResponse });
      }

      setDeleteSuccess(true);
    } catch (error: any) {
      setDeleteError(error.detail || error.message || 'Error desconocido al eliminar');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNewItem = () => {
    setCreateModalOpen(true);
    setCreateSuccess(false);
    setCreateError(null);
    resetCreateForm();
  };


  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setItemToEdit(null);
    setUpdateSuccess(false);
    setUpdateError(null);
    setSavedItem(null);
    resetEditForm();
  };

  const handleRetryUpdate = () => {
    setUpdateError(null);
  };

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
    setCreateSuccess(false);
    setCreateError(null);
    setSavedItem(null);
    resetCreateForm();
  };

  const handleRetryCreate = () => {
    setCreateError(null);
  };

  const onEditSubmit = async (data: UpdatePublisherFormData) => {
    if (!itemToEdit) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const updateRequest: PublisherRequest = {
        name: data.name
      };

      const updatedItem = await publisherService.updatePublisher(itemToEdit.id, updateRequest);

      // Actualizar la fila en la tabla
      if (itemsState.status === 'success') {
        const updatedItems = itemsState.response.items.map(item =>
          item.id === itemToEdit.id ? updatedItem : item
        );
        const updatedResponse = {
          ...itemsState.response,
          items: updatedItems
        };
        setItemsState({ status: 'success', response: updatedResponse });
      }

      setSavedItem(updatedItem);
      setUpdateSuccess(true);
    } catch (error: any) {
      setUpdateError(error.detail || error.message || 'Error desconocido al actualizar');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMergeClick = () => {
    setMergeModalOpen(true);
  }

  const onCreateSubmit = async (data: UpdatePublisherFormData) => {
    setIsCreating(true);
    setCreateError(null);

    try {
      const createRequest: PublisherRequest = {
        name: data.name
      };

      const newItem = await publisherService.createPublisher(createRequest);

      // Agregar item a la tabla (al inicio)
      if (itemsState.status === 'success') {
        const updatedItems = [newItem, ...itemsState.response.items];
        const updatedResponse = {
          ...itemsState.response,
          items: updatedItems,
          totalItems: itemsState.response.totalItems + 1
        };
        setItemsState({ status: 'success', response: updatedResponse });
      }

      setSavedItem(newItem);
      setCreateSuccess(true);
    } catch (error: any) {
      setCreateError(error.detail || error.message || 'Error desconocido al crear');
    } finally {
      setIsCreating(false);
    }
  };

  const selection = (): PublisherResponse[] => {
    if (itemsState.status !== 'success') {
      return [];
    }
    return itemsState.response.items.filter(bc => selectedItems.has(bc.id));
  }

  const handleCloseMergeModal = () => {
    setMergeModalOpen(false);
    setMergeState({ type: 'idle' });
  };

  const handleMerge = async (request: MergePublishersRequest) => {
    try {
      setMergeState({ type: 'merging' });
      const response = await publisherService.mergePublishers(request);
      setMergeState({ type: 'success', result: response });
      fetchItems();
    } catch (error: any) {
      setMergeState({ type: 'error', message: error.message || 'Error desconocido al combinar' });
    }
  };

  return (
    <div className='parent-container'>
      <DashboardModuleTopBar
        title="Editoriales"
        onExportClick={handleBulkActions}
        onNewClick={handleNewItem}
        selectedCount={selectedItems.size}
        isExporting={isExporting}
        auth={auth}
        newPermission="publishers:create"
        additionalActions={
          auth && authenticationHelper.hasAnyPermission(auth, ['publishers:update']) && (
            <Button
              onClick={handleMergeClick}
              className='dashboard-module-top-bar-action'
              type='secondary'
              disabled={(selectedItems.size < 2)}
            >
              <div className='dashboard-module-top-bar-action-icon-container'>
                <FolderCopy />
              </div>
              <span className='dashboard-module-top-bar-action-text'>
                Combinar {selectedItems.size < 2 ? '' : `(${selectedItems.size})`}
              </span>
            </Button>
          )}
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

        {/* Libros (mín) */}
        <div className='filter-item'>
          <FormControl fullWidth size="small">
            <InputLabel>Libros (mín)</InputLabel>
            <Select
              value={filters.bookCountMin}
              onChange={(e) => handleFilterChange('bookCountMin', e.target.value)}
              label="Libros (mín)"
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

        {/* Libros (máx) */}
        <div className='filter-item'>
          <FormControl fullWidth size="small">
            <InputLabel>Libros (máx)</InputLabel>
            <Select
              value={filters.bookCountMax}
              onChange={(e) => handleFilterChange('bookCountMax', e.target.value)}
              label="Libros (máx)"
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
                    indeterminate={selectedItems.size > 0 && !isAllSelected}
                    onChange={handleSelectAll}
                    size="small"
                    disabled={itemsState.status === 'loading'}
                  />
                </SortableColumnHeader>
                <SortableColumnHeader
                  title='Editorial'
                  active={paginationState.sort === 'name'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("name")) }}
                  style={{ width: '70%' }}
                />
                <SortableColumnHeader
                  title='Libros'
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
              {itemsState.status === 'loading' && (
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
              {itemsState.status === 'success' && itemsState.response.items.map((item: PublisherResponse) => (
                <tr
                  key={item.id}
                  style={{
                    backgroundColor: selectedItems.has(item.id) ? '#f0f9ff' : 'transparent'
                  }}
                >
                  <td style={{ textAlign: 'center' }}>
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      size="small"
                    />
                  </td>
                  <td className='author-info-cell'>
                    <div className='author-name-and-id'>
                      <span className='author-name'>{item.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className='author-id'>ID: {item.id}</span>
                        <CopyToClipboard
                          text={item.id}
                          size="tiny"
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className='author-book-count'>{item.bookCount}</span>
                  </td>
                  <td>
                    <div className='actions'>
                      {auth && authenticationHelper.hasAnyPermission(auth, ['publishers:update']) && (
                        <button
                          className='action-button edit-button'
                          onClick={() => handleEditItem(item.id)}
                        >
                          <EditIcon className='edit-icon' />
                        </button>
                      )}
                      {auth && authenticationHelper.hasAnyPermission(auth, ['publishers:delete']) && (
                        <button
                          className='action-button delete-button'
                          onClick={() => handleDeleteClick(item)}
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
          {itemsState.status === 'error' && itemsState.error}
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
          ¿Eliminar esta editorial?
        </DialogTitle>

        <DialogContent sx={{ pt: 2, pb: 3 }}>
          {/* Alerts */}
          {deleteSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ¡Editorial eliminada exitosamente!
            </Alert>
          )}
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}

          {!deleteSuccess && itemToDelete && (
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
                  {itemToDelete.id}
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
                  {itemToDelete.name}
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
                  Libros:
                </Typography>
                <Typography variant="body2" sx={{
                  fontWeight: 600,
                  color: '#1f2937',
                  textAlign: 'right',
                  flex: 1
                }}>
                  {itemToDelete.bookCount}
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
          Editar Editorial
        </DialogTitle>

        <DialogContent sx={{ pt: 2, pb: 3, paddingTop: '14px' }}>
          {/* Alerts */}
          {updateSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ¡Editorial actualizada exitosamente!
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
                Nombre: {savedItem?.name}
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
          Crear Editorial
        </DialogTitle>

        <DialogContent sx={{ pt: 2, pb: 3, paddingTop: '14px' }}>
          {/* Alerts */}
          {createSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ¡Editorial creada exitosamente!
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
                Nombre: {savedItem?.name}
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
      <MergePublishersModal
        open={mergeModalOpen}
        onClose={handleCloseMergeModal}
        publishers={selection()}
        onConfirm={handleMerge}
        state={mergeState}
      />
    </div>
  );
};

export default Publishers;
