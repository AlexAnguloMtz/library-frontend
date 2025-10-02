import React, { useState, useEffect } from 'react';
import './styles.css';
import { Button } from '../../components/Button';
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Dialog, DialogTitle, DialogContent, DialogActions, Skeleton, Pagination, MenuItem, Box, Typography, CircularProgress, Checkbox, FormControl, InputLabel, Select, TextField, Alert, Chip } from '@mui/material';
import { DashboardModuleTopBar } from '../../components/DashboardModuleTopBar/DashboardModuleTopBar';
import type { GetBooksRequest } from '../../models/GetBooksRequest';
import type { PaginationRequest } from '../../models/PaginationRequest';
import { useDebounce } from '../../hooks/useDebounce';
import { SortableColumnHeader } from '../../components/SortableColumnHeader/SortableColumnHeader';
import type { SortRequest } from '../../models/SortRequest';
import type { PaginationResponse } from '../../models/PaginationResponse';
import authenticationHelper from '../../util/AuthenticationHelper';
import type { AuthenticationResponse } from '../../models/AuthenticationResponse';
import { CopyToClipboard } from '../../components/CopyToClipboard/CopyToClipboard';
import bookService from '../../services/BookService';
import type { BookResponse } from '../../models/BookResponse';
import type { OptionResponse } from '../../models/OptionResponse';
import type { BookOptionsResponse } from '../../models/BookOptionsResponse';
import { BookFormModal } from '../../components/BookFormModal/BookFormModal';

type BookFilters = {
  search: string;
  available: string;
  yearMin: string;
  yearMax: string;
  categories: string[];
};

type SortableColumn = 'title' | 'author' | 'isbn' | 'category' | 'year';

type PaginationState = {
  sort?: SortableColumn;
  order?: 'asc' | 'desc';
};

type PaginationControls = {
  page: number;
  size: number;
};

type BooksState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; response: PaginationResponse<BookResponse> };

type FiltersState =
| { status: 'idle' }
| { status: 'loading' }
| { status: 'error' }
| { status: 'success'; categories: OptionResponse[] };

const Books: React.FC = () => {
  const [filters, setFilters] = useState<BookFilters>({
    search: '',
    available: '',
    yearMin: '',
    yearMax: '',
    categories: []
  });

  const [paginationState, setPaginationState] = useState<PaginationState>({
    sort: undefined,
    order: undefined
  });

  const [paginationControls, setPaginationControls] = useState<PaginationControls>({
    page: 0,
    size: 20
  });

  const [booksState, setBooksState] = useState<BooksState>({ status: 'idle' });
  const [filtersState, setFiltersState] = useState<FiltersState>({ status: 'idle' });
  const [bookOptions, setBookOptions] = useState<BookOptionsResponse | null>(null);
  const [auth, setAuth] = useState<AuthenticationResponse | null>(null);
  const [displayPagination, setDisplayPagination] = useState<{ totalPages: number; page: number } | null>(null);
  const [displayCount, setDisplayCount] = useState<{ start: number; end: number; total: number } | null>(null);

  const [errorOpen, setErrorOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<BookResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Estados del modal de crear libro
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Estados para selección múltiple
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportErrorOpen, setExportErrorOpen] = useState(false);
  const [exportErrorMessage, setExportErrorMessage] = useState('');

  const debouncedSearch = useDebounce(filters.search, 500);
  const debouncedYearMin = useDebounce(filters.yearMin, 500);
  const debouncedYearMax = useDebounce(filters.yearMax, 500);

  // Funciones para selección múltiple
  const handleSelectBook = (bookId: string) => {
    setSelectedBooks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookId)) {
        newSet.delete(bookId);
      } else {
        newSet.add(bookId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (booksState.status === 'success' && booksState.response) {
      if (isAllSelected || selectedBooks.size > 0) {
        // Deseleccionar todos
        setSelectedBooks(new Set());
        setIsAllSelected(false);
      } else {
        // Seleccionar todos
        const allBookIds = new Set(booksState.response.items.map(book => book.id));
        setSelectedBooks(allBookIds);
        setIsAllSelected(true);
      }
    }
  };

  const handleBulkActions = async () => {
    try {
      setIsExporting(true);
      const selectedIds = Array.from(selectedBooks);
      const blob: Blob = await bookService.exportBooks(selectedIds);
      // TODO: Implementar downloadBlob cuando esté disponible
      console.log('Export blob:', blob);
    } catch (error: any) {
      console.error('Error al exportar libros:', error);
      setExportErrorMessage(error.message || 'Error desconocido al exportar libros');
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
    if (booksState.status === 'success' && booksState.response) {
      setSelectedBooks(new Set());
      setIsAllSelected(false);
    }
  }, [booksState.status, booksState.status === 'success' ? booksState.response?.items : undefined]);

  // Sincronizar checkbox maestro
  useEffect(() => {
    if (booksState.status === 'success' && booksState.response) {
      const totalBooks = booksState.response.items.length;
      const selectedCount = selectedBooks.size;
      
      if (selectedCount === 0) {
        setIsAllSelected(false);
      } else if (selectedCount === totalBooks) {
        setIsAllSelected(true);
      } else {
        setIsAllSelected(false);
      }
    }
  }, [selectedBooks, booksState]);

  // Fetch options for dropdowns
  useEffect(() => {
    const fetchFilters = async () => {
      setFiltersState({ status: 'loading' });
      try {
        const response = await bookService.getBookOptions();
        const sortedOptions = withSortedOptions(response);
        setFiltersState({ status: 'success', categories: sortedOptions.categories });
        setBookOptions(sortedOptions); 
      } catch (error: any) {
        // Fail silently 
        setFiltersState({ status: 'error' });
      }
    };

    fetchFilters();
  }, []);

  // Update display pagination and count only when we have successful data
  useEffect(() => {
    if (booksState.status === 'success') {
      const response = booksState.response;
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
  }, [booksState]);

  // Reset pagination when filters change
  useEffect(() => {
    setPaginationControls(prev => ({ ...prev, page: 0 }));
  }, [debouncedSearch, filters.available, debouncedYearMin, debouncedYearMax, filters.categories]);

  useEffect(() => {
    const fetchBooks = async () => {
      setBooksState({ status: 'loading' });
      try {
        const response = await bookService.getBooks(toQuery(filters), pagination(paginationState, paginationControls));
        setBooksState({ status: 'success', response });
      } catch (error: any) {
        setBooksState({ status: 'error', error: error.message || 'Unknown error' });
        setErrorOpen(true);
      }
    };

    fetchBooks();
  }, [debouncedSearch, filters.available, debouncedYearMin, debouncedYearMax, filters.categories, paginationState, paginationControls]);

  const toQuery = (filters: BookFilters): GetBooksRequest => {
    return {
      search: filters.search || undefined,
      categoryId: filters.categories.length > 0 ? filters.categories : undefined,
      yearMin: filters.yearMin ? parseInt(filters.yearMin, 10) : undefined,
      yearMax: filters.yearMax ? parseInt(filters.yearMax, 10) : undefined,
      available: filters.available ? filters.available === 'true' : undefined
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
    if (paginationState.sort === 'title') {
      return [{ sort: 'title', order: paginationState.order }];
    }

    if (paginationState.sort === 'author') {
      return [{ sort: 'author', order: paginationState.order }];
    }

    if (paginationState.sort === 'isbn') {
      return [{ sort: 'isbn', order: paginationState.order }];
    }

    if (paginationState.sort === 'category') {
      return [{ sort: 'category', order: paginationState.order }];
    }

    if (paginationState.sort === 'year') {
      return [{ sort: 'year', order: paginationState.order }];
    }

    return [];
  }

  const handleFilterChange = (field: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Función para manejar input de año con validaciones
  const handleYearInput = (field: 'yearMin' | 'yearMax', value: string) => {
    // Solo permitir dígitos
    const numericValue = value.replace(/\D/g, '');
    
    // No permitir que empiece con 0 si tiene más de 1 dígito
    const cleanValue = numericValue.length > 1 && numericValue.startsWith('0') 
      ? numericValue.substring(1) 
      : numericValue;
    
    // Máximo 4 dígitos
    const finalValue = cleanValue.length > 4 ? cleanValue.substring(0, 4) : cleanValue;
    
    // Validar que esté en el rango 1 - año actual
    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(finalValue, 10);
    
    if (finalValue === '' || (yearNum >= 1 && yearNum <= currentYear)) {
      setFilters(prev => ({ ...prev, [field]: finalValue }));
    }
  };

  const closeError = (_: any) => setErrorOpen(false);

  const clearFilters = () => {
    setFilters({
      search: '',
      available: '',
      yearMin: '',
      yearMax: '',
      categories: []
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

  const handleDeleteClick = (book: BookResponse) => {
    setBookToDelete(book);
    setDeleteModalOpen(true);
    setDeleteSuccess(false);
    setDeleteError(null);
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setBookToDelete(null);
    setDeleteSuccess(false);
    setDeleteError(null);
  };

  const handleDeleteClose = () => {
    setDeleteModalOpen(false);
    setBookToDelete(null);
    setDeleteSuccess(false);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!bookToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      await bookService.deleteById(bookToDelete.id);
      
      // Remove book from table
      if (booksState.status === 'success') {
        const updatedItems = booksState.response.items.filter(book => book.id !== bookToDelete.id);
        const updatedResponse = {
          ...booksState.response,
          items: updatedItems,
          totalItems: booksState.response.totalItems - 1
        };
        setBooksState({ status: 'success', response: updatedResponse });
      }
      
      setDeleteSuccess(true);
    } catch (error: any) {
      console.error('Error deleting book:', error);
      setDeleteError(error.detail || error.message || 'Error desconocido al eliminar libro');
    } finally {
      setIsDeleting(false);
    }
  };

  const withSortedOptions = (options: BookOptionsResponse): BookOptionsResponse => {
    return {
      ...options,
      categories: options.categories.sort((a, b) => a.label.localeCompare(b.label))
    };
  }

  const handleNewBook = () => {
    setCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
  };

  const renderAuthors = (authors: string[]) => {
    if (authors.length === 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span>---</span>
        </div>
      );
    }
    if (authors.length <= 2) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {authors.map((author, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontSize: '12px', 
              color: '#1f2937' 
            }}>
              <div style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: '#6B7280',
                flexShrink: 0
              }}></div>
              <span>{author}</span>
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {authors.slice(0, 2).map((author, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontSize: '12px', 
              color: '#1f2937' 
            }}>
              <div style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: '#6B7280',
                flexShrink: 0
              }}></div>
              <span>{author}</span>
            </div>
          ))}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            fontSize: '11px', 
            color: '#6B7280' 
          }}>
            <div style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: '#9CA3AF',
              flexShrink: 0
            }}></div>
            <span>{authors.length - 2} más...</span>
          </div>
        </div>
      );
    }
  };

  const renderAvailability = (availability: any) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <Chip
          label={availability.available ? "Disponible" : "Agotado"}
          size="small"
          sx={{
            backgroundColor: availability.available ? '#dcfce7' : '#fecaca',
            color: availability.available ? '#166534' : '#dc2626',
            fontSize: '10px',
            height: '20px',
            '& .MuiChip-label': {
              padding: '0 8px'
            }
          }}
        />
        <span style={{ 
          fontSize: '11px', 
          color: '#6B7280',
          fontWeight: 400
        }}>
          {availability.availableCopies} de {availability.totalCopies} copias
        </span>
      </div>
    );
  };

  return (
    <div className='parent-container'>
      <DashboardModuleTopBar
        title="Libros"
        onExportClick={handleBulkActions}
        onNewClick={handleNewBook}
        selectedCount={selectedBooks.size}
        isExporting={isExporting}
        auth={auth}
        newPermission="books:create"
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

        {/* Disponibilidad */}
        <div className='filter-item'>
          <FormControl fullWidth size="small">
            <InputLabel>Disponibilidad</InputLabel>
            <Select
              value={filters.available}
              onChange={(e) => handleFilterChange('available', e.target.value)}
              label="Disponibilidad"
            >
              <MenuItem value="">
                <em>Todos</em>
              </MenuItem>
              <MenuItem value="true">Disponible</MenuItem>
              <MenuItem value="false">Agotado</MenuItem>
            </Select>
          </FormControl>
        </div>

        {/* Año (mín) */}
        <div className='filter-item'>
          <TextField
            value={filters.yearMin}
            onChange={(e) => handleYearInput('yearMin', e.target.value)}
            label="Año (mín)"
            placeholder='Ej: 1990'
            variant="outlined"
            fullWidth
            size='small'
            inputProps={{
              maxLength: 4,
              inputMode: 'numeric',
              pattern: '[0-9]*'
            }}
          />
        </div>

        {/* Año (máx) */}
        <div className='filter-item'>
          <TextField
            value={filters.yearMax}
            onChange={(e) => handleYearInput('yearMax', e.target.value)}
            label="Año (máx)"
            placeholder='Ej: 2023'
            variant="outlined"
            fullWidth
            size='small'
            inputProps={{
              maxLength: 4,
              inputMode: 'numeric',
              pattern: '[0-9]*'
            }}
          />
        </div>

        {/* Categorías */}
        <div className='filter-item'>
          <FormControl fullWidth size="small">
            <InputLabel>Categorías</InputLabel>
            <Select
              multiple
              value={filters.categories}
              onChange={(e) => handleFilterChange('categories', e.target.value)}
              label="Categorías"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip 
                      key={value} 
                      label={bookOptions?.categories.find(cat => cat.value === value)?.label || value}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            >
              {bookOptions?.categories.map((category) => (
                <MenuItem key={category.value} value={category.value}>
                  {category.label}
                </MenuItem>
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
                    indeterminate={selectedBooks.size > 0 && !isAllSelected}
                    onChange={handleSelectAll}
                    size="small"
                    disabled={booksState.status === 'loading'}
                  />
                </SortableColumnHeader>
                <SortableColumnHeader
                  title='Libro'
                  active={paginationState.sort === 'title'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("title")) }}
                  style={{ width: '25%' }}
                />
                <SortableColumnHeader
                  title='Autores'
                  active={paginationState.sort === 'author'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("author")) }}
                  style={{ width: '20%' }}
                />
                <SortableColumnHeader
                  title='ISBN'
                  active={paginationState.sort === 'isbn'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("isbn")) }}
                  style={{ width: '15%' }}
                />
                <SortableColumnHeader
                  title='Categoría'
                  active={paginationState.sort === 'category'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("category")) }}
                  style={{ width: '15%' }}
                />
                <SortableColumnHeader
                  title='Año'
                  active={paginationState.sort === 'year'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("year")) }}
                  style={{ width: '10%' }}
                />
                <SortableColumnHeader
                  title='Disponibilidad'
                  nonSortable={true}
                  style={{ width: '10%' }}
                />
                <SortableColumnHeader
                  title='Acciones'
                  nonSortable={true}
                  style={{ width: '5%' }}
                />
              </tr>
            </thead>
            <tbody>
              {booksState.status === 'loading' && (
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
                    <td><Skeleton variant="rectangular" height={40} /></td>
                  </tr>
                ))
              )}
              {booksState.status === 'success' && booksState.response.items.map((book: BookResponse) => (
                <tr 
                  key={book.id}
                  style={{ 
                    backgroundColor: selectedBooks.has(book.id) ? '#f0f9ff' : 'transparent' 
                  }}
                >
                  <td style={{ textAlign: 'center' }}>
                    <Checkbox
                      checked={selectedBooks.has(book.id)}
                      onChange={() => handleSelectBook(book.id)}
                      size="small"
                    />
                  </td>
                  <td className='author-info-cell'>
                    <div className='book-image-container'>
                      <img src={book.imageUrl} alt={book.title} className='book-image' />
                    </div>
                    <div className='author-name-and-id'>
                      <span className='author-name'>{book.title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className='author-id'>ID: {book.id}</span>
                        <CopyToClipboard 
                          text={book.id}
                          size="tiny"
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    {renderAuthors(book.authors)}
                  </td>
                  <td>
                    <span className='author-book-count'>{book.isbn}</span>
                  </td>
                  <td>
                    <span className='author-book-count'>{book.category || '---'}</span>
                  </td>
                  <td>
                    <span className='author-book-count'>{book.year}</span>
                  </td>
                  <td>
                    {renderAvailability(book.availability)}
                  </td>
                  <td>
                    <div className='actions'>
                      {auth && authenticationHelper.hasAnyPermission(auth, ['books:read']) && (
                        <button 
                          className='action-button view-button'
                          onClick={() => {/* TODO: Implement view functionality */}}
                        >
                          <VisibilityIcon className='view-icon' />
                        </button>
                      )}
                      {auth && authenticationHelper.hasAnyPermission(auth, ['books:delete']) && (
                        <button 
                          className='action-button delete-button'
                          onClick={() => handleDeleteClick(book)}
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
          {booksState.status === 'error' && booksState.error}
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
          ¿Eliminar este libro?
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2, pb: 3 }}>
          {/* Alerts */}
          {deleteSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ¡Libro eliminado exitosamente!
            </Alert>
          )}
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}

          {!deleteSuccess && bookToDelete && (
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
                  {bookToDelete.id}
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
                  Título:
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  color: '#1f2937',
                  textAlign: 'right',
                  flex: 1
                }}>
                  {bookToDelete.title}
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
                  ISBN:
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  color: '#1f2937',
                  textAlign: 'right',
                  flex: 1
                }}>
                  {bookToDelete.isbn}
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
                  Categoría:
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  color: '#1f2937',
                  textAlign: 'right',
                  flex: 1
                }}>
                  {bookToDelete.category}
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
                  Año:
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  color: '#1f2937',
                  textAlign: 'right',
                  flex: 1
                }}>
                  {bookToDelete.year}
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
    </div>
  );
};

export default Books;
