import './styles.css';
import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from '@mui/icons-material/Search';
import { Dialog, DialogTitle, DialogContent, DialogActions, Skeleton, Pagination, MenuItem, Checkbox, FormControl, InputLabel, Select, TextField, OutlinedInput, Box, Chip } from '@mui/material';
import { DashboardModuleTopBar } from '../../components/DashboardModuleTopBar/DashboardModuleTopBar';
import type { PaginationRequest } from '../../models/PaginationRequest';
import { useDebounce } from '../../hooks/useDebounce';
import { SortableColumnHeader } from '../../components/SortableColumnHeader/SortableColumnHeader';
import type { SortRequest } from '../../models/SortRequest';
import type { PaginationResponse } from '../../models/PaginationResponse';
import authenticationHelper from '../../util/AuthenticationHelper';
import type { AuthenticationResponse } from '../../models/AuthenticationResponse';
import type { AuditEventResponse } from '../../models/AuditEventResponse';
import auditService from '../../services/AuditService';
import type { GetAuditEventsRequest } from '../../models/GetAuditEventsRequest';
import { CopyToClipboard } from '../../components/CopyToClipboard/CopyToClipboard';
import { Icon as CustomIcon, Icons } from '../../components/Icon';
import type { AuditResourceTypeResponse } from '../../models/AuditResourceTypeResponse';

type Filters = {
    responsible: string;
    resourceType: string;
    eventType: string;
    occurredAtMin?: Date;
    occurredAtMax?: Date;
}

type SortableColumn = 'responsible' | 'resourceType' | 'eventType' | 'occurredAt';

type PaginationState = {
    sort?: SortableColumn;
    order?: 'asc' | 'desc';
};

type PaginationControls = {
    page: number;
    size: number;
};

type DataState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'error'; error: string }
    | { status: 'success'; response: PaginationResponse<AuditEventResponse> };

type OptionsState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'success'; resourceTypes: AuditResourceTypeResponse[] };

export const Audit: React.FC = () => {
    const [filters, setFilters] = useState<Filters>({ responsible: '', resourceType: '', eventType: '' });

    const [paginationState, setPaginationState] = useState<PaginationState>({
        sort: undefined,
        order: undefined
    });

    const [paginationControls, setPaginationControls] = useState<PaginationControls>({
        page: 0,
        size: 20
    });

    const [dataState, setDataState] = useState<DataState>({ status: 'idle' });
    const [optionsState, setOptionsState] = useState<OptionsState>({ status: 'idle' });
    const [auth, setAuth] = useState<AuthenticationResponse | null>(null);
    const [displayPagination, setDisplayPagination] = useState<{ totalPages: number; page: number } | null>(null);
    const [displayCount, setDisplayCount] = useState<{ start: number; end: number; total: number } | null>(null);

    const [errorOpen, setErrorOpen] = useState(false);

    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportErrorOpen, setExportErrorOpen] = useState(false);
    const [exportErrorMessage, setExportErrorMessage] = useState('');

    const debouncedResponsibleSearch = useDebounce(filters.responsible, 500);

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
        if (dataState.status === 'success' && dataState.response) {
            if (isAllSelected || selectedItems.size > 0) {
                setSelectedItems(new Set());
                setIsAllSelected(false);
            } else {
                const allIds = new Set(dataState.response.items.map(item => item.id));
                setSelectedItems(allIds);
                setIsAllSelected(true);
            }
        }
    };

    const handleBulkActions = async () => {

    };

    useEffect(() => {
        const fetchOptions = async () => {
            setOptionsState({ status: 'loading' });
            try {
                const response = await auditService.getResourceTypes();
                setOptionsState({ status: 'success', resourceTypes: response });
            } catch (error: any) {
                setOptionsState({ status: 'error' });
            }
        };

        fetchOptions();
    }, []);

    useEffect(() => {
        const authentication = authenticationHelper.getAuthentication();
        setAuth(authentication);
    }, []);

    useEffect(() => {
        if (dataState.status === 'success' && dataState.response) {
            setSelectedItems(new Set());
            setIsAllSelected(false);
        }
    }, [dataState.status, dataState.status === 'success' ? dataState.response?.items : undefined]);

    useEffect(() => {
        if (dataState.status === 'success' && dataState.response) {
            const totalItems = dataState.response.items.length;
            const selectedCount = selectedItems.size;

            if (selectedCount === 0) {
                setIsAllSelected(false);
            } else if (selectedCount === totalItems) {
                setIsAllSelected(true);
            } else {
                setIsAllSelected(false);
            }
        }
    }, [selectedItems, dataState]);

    useEffect(() => {
        if (dataState.status === 'success') {
            const response = dataState.response;
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
    }, [dataState]);

    useEffect(() => {
        setPaginationControls(prev => ({ ...prev, page: 0 }));
    }, [debouncedResponsibleSearch, filters.eventType, filters.resourceType, filters.occurredAtMin, filters.occurredAtMax]);

    useEffect(() => {
        fetchItems();
    }, [debouncedResponsibleSearch, filters.eventType, filters.resourceType, filters.occurredAtMin, filters.occurredAtMax, paginationState, paginationControls]);


    const fetchItems = async () => {
        setDataState({ status: 'loading' });
        try {
            const response = await auditService.getAuditEvents(toQuery(filters), pagination(paginationState, paginationControls));
            setDataState({ status: 'success', response });
        } catch (error: any) {
            setDataState({ status: 'error', error: error.message || 'Unknown error' });
            setErrorOpen(true);
        }
    };

    const toQuery = (filters: Filters): GetAuditEventsRequest => {
        return {
            responsible: filters.responsible,
            eventType: filters.eventType,
            resourceType: filters.resourceType,
            occurredAtMin: filters.occurredAtMin,
            occurredAtMax: filters.occurredAtMax,
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
        if (paginationState.sort === 'eventType') {
            return [{ sort: 'eventType', order: paginationState.order }];
        }

        if (paginationState.sort === 'resourceType') {
            return [{ sort: 'resourceType', order: paginationState.order }];
        }

        return [];
    }

    const handleFilterChange = (field: keyof typeof filters, value: any) => {
        setFilters(prev => {
            const newFilters = { ...prev, [field]: value };
            return newFilters;
        });
    };

    const closeError = (_: any) => setErrorOpen(false);

    const clearFilters = () => {
        setFilters((_) => ({
            responsible: '',
            resourceType: '',
            eventType: '',
            occurredAtMin: undefined,
            occurredAtMax: undefined,
        }));

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

    const handleViewItem = (id: string) => void {

    }

    const dateTimeFormat = (): Intl.DateTimeFormat => {
        const options: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        };

        return new Intl.DateTimeFormat('es-ES', options);
    }

    const findResourceType = (id: string): AuditResourceTypeResponse | undefined => {
        if (optionsState.status !== 'success') {
            return undefined;
        }
        return optionsState.resourceTypes.find((x) => x.id === id);
    }

    return (
        <div className='parent-container'>
            <DashboardModuleTopBar
                title="Bitácora"
                showCreateNew={false}
                onExportClick={handleBulkActions}
                selectedCount={selectedItems.size}
                isExporting={isExporting}
                auth={auth}
            />

            <div className='filters'>
                <div className='filter-item'>
                    <TextField
                        value={filters.responsible}
                        onChange={(e) => handleFilterChange('responsible', e.target.value)}
                        label="Responsable"
                        placeholder='Responsable...'
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
                <div className='filter-item'>
                    <FormControl fullWidth variant="outlined">
                        <InputLabel id="country-label" sx={{
                            transform: 'translate(14px, 9px) scale(1)',
                            '&.MuiInputLabel-shrink': {
                                transform: 'translate(14px, -6px) scale(0.75)',
                            },
                            fontSize: '1rem',
                        }}>Tipo de recurso</InputLabel>
                        <Select
                            labelId="country-label"
                            value={filters.resourceType || ''}
                            onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                            label="Tipo de recurso"
                            size='small'
                            input={<OutlinedInput label="Tipo de recurso" />}
                        >
                            {optionsState.status === 'success' && optionsState.resourceTypes.map((resourceType) => (
                                <MenuItem key={resourceType.id} value={resourceType.id}>
                                    {resourceType.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </div>
                <div className='filter-item'>
                    <FormControl fullWidth variant="outlined">
                        <InputLabel id="country-label" sx={{
                            transform: 'translate(14px, 9px) scale(1)',
                            '&.MuiInputLabel-shrink': {
                                transform: 'translate(14px, -6px) scale(0.75)',
                            },
                            fontSize: '1rem',
                        }}>Acción</InputLabel>
                        <Select
                            labelId="country-label"
                            value={filters.eventType}
                            onChange={(e) => handleFilterChange('eventType', e.target.value)}
                            label="Acción"
                            size='small'
                            input={<OutlinedInput label="Acción" />}
                            disabled={filters.resourceType === ''}
                        >
                            {optionsState.status === 'success' && filters.resourceType !== '' && findResourceType(filters.resourceType) !== undefined && findResourceType(filters.resourceType)!.eventTypes.map((eventType) => (
                                <MenuItem key={eventType.value} value={eventType.value}>
                                    {eventType.label}
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
                                    style={{ width: '5%', textAlign: 'center' }}
                                >
                                    <Checkbox
                                        checked={isAllSelected}
                                        indeterminate={selectedItems.size > 0 && !isAllSelected}
                                        onChange={handleSelectAll}
                                        size="small"
                                        disabled={dataState.status === 'loading'}
                                    />
                                </SortableColumnHeader>
                                <SortableColumnHeader
                                    title='Fecha y hora'
                                    active={paginationState.sort === 'occurredAt'}
                                    order={paginationState.order}
                                    onClick={() => { setPaginationState(nextPagination("occurredAt")) }}
                                    style={{ width: '15%' }}
                                />
                                <SortableColumnHeader
                                    title='Responsable'
                                    active={paginationState.sort === 'responsible'}
                                    order={paginationState.order}
                                    onClick={() => { setPaginationState(nextPagination("responsible")) }}
                                    style={{ width: '20%' }}
                                />
                                <SortableColumnHeader
                                    title='Tipo de recurso'
                                    active={paginationState.sort === 'resourceType'}
                                    order={paginationState.order}
                                    onClick={() => { setPaginationState(nextPagination("resourceType")) }}
                                    style={{ width: '15%' }}
                                />
                                <SortableColumnHeader
                                    title='Acción'
                                    active={paginationState.sort === 'eventType'}
                                    order={paginationState.order}
                                    onClick={() => { setPaginationState(nextPagination("eventType")) }}
                                    style={{ width: '12.5%' }}
                                />
                                <SortableColumnHeader
                                    title='Acciones'
                                    nonSortable={true}
                                    style={{ width: '5%' }}
                                />
                            </tr>
                        </thead>

                        <tbody>
                            {dataState.status === 'loading' && (
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
                            {dataState.status === 'success' && dataState.response.items.map((item: AuditEventResponse) => (
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
                                    <td>
                                        <span className=''>{dateTimeFormat().format(item.occurredAt)}</span>
                                    </td>
                                    <td className='user-info-cell'>
                                        <div className='user-avatar-container'>
                                            {item.responsibleProfilePictureUrl ? (
                                                <img
                                                    src={item.responsibleProfilePictureUrl}
                                                    alt={`${item.responsibleFirstName + ' ' + item.responsibleLastName} profile`}
                                                    className='user-avatar-image'
                                                />
                                            ) : (
                                                <CustomIcon name={Icons.user_avatar} />
                                            )}
                                        </div>
                                        <div className='user-name-and-id'>
                                            <span className='user-name'>{item.responsibleFirstName + ' ' + item.responsibleLastName}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span className='user-id'>ID: {item.responsibleId}</span>
                                                <CopyToClipboard
                                                    text={item.responsibleId}
                                                    size="tiny"
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className=''>{item.resourceType}</span>
                                    </td>
                                    <td>
                                        <span className=''>{item.eventType}</span>
                                    </td>
                                    <td>
                                        {auth && authenticationHelper.hasAnyPermission(auth, ['audit-events:read']) && (
                                            <button
                                                className='action-button view-button'
                                                onClick={() => handleViewItem(item.id)}
                                            >
                                                <CustomIcon name={Icons.eye} className='view-icon' />
                                            </button>
                                        )}
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
                    {dataState.status === 'error' && dataState.error}
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
        </div>
    );
};

export default Audit;
