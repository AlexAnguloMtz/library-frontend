import React, { useState, useEffect } from 'react';
import './styles.css';
import { Button } from '../../components/Button';
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Dialog, DialogTitle, DialogContent, DialogActions, Skeleton, Pagination, MenuItem, Box, CircularProgress, Checkbox, FormControl, InputLabel, Select, TextField, Chip } from '@mui/material';
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
import type { BookSummaryResponse } from '../../models/BookSummaryResponse';
import type { OptionResponse } from '../../models/OptionResponse';
import type { BookOptionsResponse } from '../../models/BookOptionsResponse';
import { BookFormModal, type BookFormData } from '../../components/BookFormModal/BookFormModal';
import type { CreateBookRequest } from '../../models/CreateBookRequest';
import { toUpdateDto } from '../../models/UpdateBookRequest';
import { fromDtoToFormValues, type BookDetailsResponse } from '../../models/BookDetailsResponse';
import { useNavigate } from 'react-router-dom';
import { DeleteBookModal, DeleteStatus, type DeleteState } from '../../components/DeleteBookModal/DeleteBookModal';
import * as blobHelpers from '../../util/BlobHelpers';

type BookFilters = {
  search: string;
  available: string;
  yearMin: string;
  yearMax: string;
  categories: string[];
  publishers: string[];
};

type SortableColumn = 'title' | 'author' | 'isbn' | 'category' | 'publisher' | 'year';

type SortingState = {
  sort?: SortableColumn;
  order?: 'asc' | 'desc';
};

type PaginationControls = {
  page: number;
  size: number;
};

enum DataLoadStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

type BookDetailsState =
  | { status: DataLoadStatus.IDLE }
  | { status: DataLoadStatus.LOADING }
  | { status: DataLoadStatus.ERROR; error: string }
  | { status: DataLoadStatus.SUCCESS; book: BookDetailsResponse };

type BooksState =
  | { status: DataLoadStatus.IDLE }
  | { status: DataLoadStatus.LOADING }
  | { status: DataLoadStatus.ERROR; error: string }
  | { status: DataLoadStatus.SUCCESS; response: PaginationResponse<BookSummaryResponse> };

type FiltersState =
  | { status: DataLoadStatus.IDLE }
  | { status: DataLoadStatus.LOADING }
  | { status: DataLoadStatus.ERROR; error: string }
  | { status: DataLoadStatus.SUCCESS; categories: OptionResponse[] };

const Books: React.FC = () => {
  const [filters, setFilters] = useState<BookFilters>({
    search: '',
    available: '',
    yearMin: '',
    yearMax: '',
    categories: [],
    publishers: [],
  });

  const [paginationState, setPaginationState] = useState<SortingState>({
    sort: undefined,
    order: undefined
  });

  const [paginationControls, setPaginationControls] = useState<PaginationControls>({
    page: 0,
    size: 20
  });

  const [booksState, setBooksState] = useState<BooksState>({ status: DataLoadStatus.IDLE });
  const [_, setFiltersState] = useState<FiltersState>({ status: DataLoadStatus.IDLE });
  const [bookOptions, setBookOptions] = useState<BookOptionsResponse | null>(null);
  const [auth, setAuth] = useState<AuthenticationResponse | null>(null);
  const [displayPagination, setDisplayPagination] = useState<{ totalPages: number; page: number } | null>(null);
  const [displayCount, setDisplayCount] = useState<{ start: number; end: number; total: number } | null>(null);

  const [errorOpen, setErrorOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bookToDeleteState, setBookToDeleteState] = useState<BookDetailsState>({ status: DataLoadStatus.IDLE });
  const [deleteState, setDeleteState] = useState<DeleteState>({ status: DeleteStatus.Idle });

  // Estados del modal de crear libro
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [bookToUpdate, setBookToUpdate] = useState<BookSummaryResponse | null>(null);

  // Estados para selección múltiple
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportErrorOpen, setExportErrorOpen] = useState(false);
  const [exportErrorMessage, setExportErrorMessage] = useState('');

  const debouncedSearch = useDebounce(filters.search, 500);
  const debouncedYearMin = useDebounce(filters.yearMin, 500);
  const debouncedYearMax = useDebounce(filters.yearMax, 500);

  const [bookSummaryToDelete, setBookSummaryToDelete] = useState<BookSummaryResponse | null>(null);
  const [loadingBookToDeleteModalOpen, setLoadingBookToDeleteModalOpen] = useState(false);

  const navigate = useNavigate();

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
      blobHelpers.downloadBlob(blob, "libros.pdf");
    } catch (error: any) {
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
    if (booksState.status === DataLoadStatus.SUCCESS && booksState.response) {
      setSelectedBooks(new Set());
      setIsAllSelected(false);
    }
  }, [booksState.status, booksState.status === DataLoadStatus.SUCCESS ? booksState.response?.items : undefined]);

  // Sincronizar checkbox maestro
  useEffect(() => {
    if (booksState.status === DataLoadStatus.SUCCESS && booksState.response) {
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
      setFiltersState({ status: DataLoadStatus.LOADING });
      try {
        const response = await bookService.getBookOptions();
        const sortedOptions = withSortedOptions(response);
        setFiltersState({ status: DataLoadStatus.SUCCESS, categories: sortedOptions.categories });
        setBookOptions(sortedOptions);
      } catch (error: any) {
        // Fail silently
        setFiltersState({ status: DataLoadStatus.ERROR, error: error.message || 'Error desconocido' });
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
    fetchBooks();
  }, [debouncedSearch, filters.available, debouncedYearMin, debouncedYearMax, filters.categories, filters.publishers, paginationState, paginationControls]);

  useEffect(() => {
    if (bookSummaryToDelete) {
      loadBookToDeleteDetails();
    }
  }, [bookSummaryToDelete]);

  const fetchBooks = async () => {
    setBooksState({ status: DataLoadStatus.LOADING });
    try {
      const response = await bookService.getBooks(toQuery(filters), pagination(paginationState, paginationControls));
      setBooksState({ status: DataLoadStatus.SUCCESS, response });
    } catch (error: any) {
      setBooksState({ status: DataLoadStatus.ERROR, error: error.message || 'Unknown error' });
      setErrorOpen(true);
    }
  };

  const toQuery = (filters: BookFilters): GetBooksRequest => {
    return {
      search: filters.search || undefined,
      categoryId: filters.categories.length > 0 ? filters.categories : undefined,
      publisherId: filters.publishers.length > 0 ? filters.publishers : undefined,
      yearMin: filters.yearMin ? parseInt(filters.yearMin, 10) : undefined,
      yearMax: filters.yearMax ? parseInt(filters.yearMax, 10) : undefined,
      available: filters.available ? filters.available === 'true' : undefined
    };
  }

  const pagination = (paginationState: SortingState, paginationControls: PaginationControls): PaginationRequest => {
    const sorts = mapSort(paginationState);
    return {
      sorts: sorts,
      page: paginationControls.page,
      size: paginationControls.size
    };
  }

  const mapSort = (paginationState: SortingState): SortRequest[] => {
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

    if (paginationState.sort === 'publisher') {
      return [{ sort: 'publisher', order: paginationState.order }];
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
      categories: [],
      publishers: [],
    });
    setPaginationControls(prev => ({ ...prev, page: 0 }));
  };

  const nextPagination = (column: SortableColumn): SortingState => {
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

  const handleViewBookClick = (book: BookSummaryResponse) => {
    navigate(`/dashboard/books/${book.id}`);
  };

  const handleEditClick = (book: BookSummaryResponse) => {
    setBookToUpdate(book);
    setUpdateModalOpen(true);
  };

  const handleDeleteClick = async (book: BookSummaryResponse) => {
    setBookSummaryToDelete(book);
  };

  const loadBookToDeleteDetails = async () => {
    setBookToDeleteState({ status: DataLoadStatus.LOADING });
    try {
      setLoadingBookToDeleteModalOpen(true);
      const book = await bookService.getBookById(bookSummaryToDelete!.id);
      setBookToDeleteState({ status: DataLoadStatus.SUCCESS, book });
      setDeleteModalOpen(true);
    } catch (error: any) {
      setBookToDeleteState({ status: DataLoadStatus.ERROR, error: error.message || 'Error desconocido' });
      setDeleteState({ status: DeleteStatus.Idle });
    } finally {
      setLoadingBookToDeleteModalOpen(false);
    }
  }

  const handleDeleteClose = () => {
    setDeleteModalOpen(false);
    setBookToDeleteState({ status: DataLoadStatus.IDLE });
    setDeleteState({ status: DeleteStatus.Idle });
    setBookSummaryToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (bookToDeleteState.status !== DataLoadStatus.SUCCESS) return;

    setDeleteState({ status: DeleteStatus.Deleting });

    try {
      await bookService.deleteById(bookToDeleteState.book.id);
      setDeleteState({ status: DeleteStatus.Deleted });
      fetchBooks();
      setBookSummaryToDelete(null);
    } catch (error: any) {
      setDeleteState({ status: DeleteStatus.Error, error: error.detail || error.message || 'Error desconocido al eliminar libro' });
    }
  };

  const withSortedOptions = (options: BookOptionsResponse): BookOptionsResponse => {
    return {
      ...options,
      categories: options.categories.sort((a, b) => a.label.localeCompare(b.label)),
      publishers: options.publishers.sort((a, b) => a.label.localeCompare(b.label))
    };
  }

  const bookToDelete = (): BookDetailsResponse | null => {
    if (bookToDeleteState.status === DataLoadStatus.SUCCESS) {
      return bookToDeleteState.book;
    }
    return null;
  };

  const handleNewBook = () => {
    setCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
  };

  const handleCloseUpdateModal = () => {
    setUpdateModalOpen(false);
  };

  const getBookToUpdateDetails = async (): Promise<BookFormData> => {
    if (!bookToUpdate) {
      throw new Error('No book selected for update');
    }
    const bookDetails: BookDetailsResponse = await bookService.getBookById(bookToUpdate.id);
    return fromDtoToFormValues(bookDetails);
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

        {/* Editoriales */}
        <div className='filter-item'>
          <FormControl fullWidth size="small">
            <InputLabel>Editoriales</InputLabel>
            <Select
              multiple
              value={filters.publishers}
              onChange={(e) => handleFilterChange('publishers', e.target.value)}
              label="Editoriales"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip
                      key={value}
                      label={bookOptions?.publishers.find(pub => pub.value === value)?.label || value}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            >
              {bookOptions?.publishers.map((publisher) => (
                <MenuItem key={publisher.value} value={publisher.value}>
                  {publisher.label}
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
                  title='ISBN'
                  active={paginationState.sort === 'isbn'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("isbn")) }}
                  style={{ width: '15%' }}
                />
                <SortableColumnHeader
                  title='Editorial'
                  active={paginationState.sort === 'publisher'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("publisher")) }}
                  style={{ width: '10%' }}
                />
                <SortableColumnHeader
                  title='Categoría'
                  active={paginationState.sort === 'category'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("category")) }}
                  style={{ width: '10%' }}
                />
                <SortableColumnHeader
                  title='Año'
                  active={paginationState.sort === 'year'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("year")) }}
                  style={{ width: '10%' }}
                />
                <SortableColumnHeader
                  title='Autores'
                  active={paginationState.sort === 'author'}
                  order={paginationState.order}
                  onClick={() => { setPaginationState(nextPagination("author")) }}
                  style={{ width: '20%' }}
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
                    <td><Skeleton variant="rectangular" height={40} /></td>
                  </tr>
                ))
              )}
              {booksState.status === 'success' && booksState.response.items.map((book: BookSummaryResponse) => (
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className='author-book-count'>{book.isbn}</span>
                      <CopyToClipboard
                        text={book.isbn}
                        size="tiny"
                      />
                    </div>
                  </td>
                  <td>
                    <span className='author-book-count'>{book.publisher || '---'}</span>
                  </td>
                  <td>
                    <span className='author-book-count'>{book.category || '---'}</span>
                  </td>
                  <td>
                    <span className='author-book-count'>{book.year}</span>
                  </td>
                  <td>
                    {renderAuthors(book.authors)}
                  </td>
                  <td>
                    {renderAvailability(book.availability)}
                  </td>
                  <td>
                    <div className='actions'>
                      {auth && authenticationHelper.hasAnyPermission(auth, ['books:read']) && (
                        <button
                          className='action-button view-button'
                          onClick={() => { handleViewBookClick(book) }}
                        >
                          <VisibilityIcon className='view-icon' />
                        </button>
                      )}
                      {auth && authenticationHelper.hasAnyPermission(auth, ['books:update']) && (
                        <button
                          className='action-button edit-button'
                          onClick={() => handleEditClick(book)}
                        >
                          <EditIcon className='edit-icon' />
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

      {/* Create Modal */}
      <BookFormModal
        open={createModalOpen}
        onCloseModal={handleCloseCreateModal}
        categories={bookOptions?.categories || []}
        publishers={bookOptions?.publishers || []}
        save={(data: BookFormData, imageFile: File | null) => bookService.createBook(toCreationDto(data, imageFile))}
        successPrimaryActionLabel="Ver libro"
        onSuccessPrimaryAction={(book: BookDetailsResponse) => {
          navigate(`/dashboard/books/${book.id}`);
        }}
      />

      {/* Update Modal */}
      <BookFormModal
        open={updateModalOpen}
        onCloseModal={handleCloseUpdateModal}
        categories={bookOptions?.categories || []}
        publishers={bookOptions?.publishers || []}
        initialImageSrc={bookToUpdate?.imageUrl || undefined}
        getInitialFormValues={getBookToUpdateDetails}
        save={(data: BookFormData, imageFile: File | null) => bookService.updateBook(bookToUpdate!.id, toUpdateDto(data, imageFile))}
        successPrimaryActionLabel="Ver libro"
        onSaveSuccess={() => fetchBooks()}
        onSuccessPrimaryAction={(book: BookDetailsResponse) => {
          navigate(`/dashboard/books/${book.id}`);
        }}
      />

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

      <Dialog open={loadingBookToDeleteModalOpen}>
        <DialogTitle>Cargando libro...</DialogTitle>
        <DialogContent>
          {bookToDeleteState.status === DataLoadStatus.LOADING && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
              <CircularProgress />
            </div>
          )}
          {bookToDeleteState.status === DataLoadStatus.ERROR && (
            <div style={{ color: '#dc2626' }}>
              {bookToDeleteState.error}
            </div>
          )}
          {bookToDeleteState.status === DataLoadStatus.ERROR && (
            <Box>
              <DialogActions>
                <Button type='primary' onClick={loadBookToDeleteDetails}>Reintentar</Button>
              </DialogActions>
            </Box>
          )}
        </DialogContent>
      </Dialog>


      {/* Delete Confirmation Modal */}
      <DeleteBookModal
        open={deleteModalOpen}
        bookToDelete={bookToDelete()}
        onClose={handleDeleteClose}
        onDeleteConfirm={handleDeleteConfirm}
        deleteState={deleteState}
        successActionLabel={'Cerrar'}
        onSuccessAction={handleDeleteClose}
        closable={deleteState.status !== DeleteStatus.Deleting}
      />

    </div >
  );
};

function toCreationDto(form: BookFormData, imageFile: File | null): CreateBookRequest {
  if (imageFile === null) {
    throw new Error("Book image is required");
  }
  return {
    title: form.title,
    year: parseInt(form.year),
    isbn: form.isbn,
    authorIds: form.authors.map((author) => author.id),
    categoryId: form.categoryId,
    publisherId: form.publisherId,
    bookPicture: imageFile,
  };
}

export default Books;
