import { useEffect, useState, type JSX } from 'react';
import { Box, CircularProgress, Alert, Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import type { BookCategoryPopularityResponse } from '../../../../models/BookCategoryPopularityResponse';
import reportsService from '../../../../services/ReportsService';
import { BookCategoryPopularityMetric } from '../../../../models/BookCategoriesPopularityRequest';

enum DataStatus {
    IDLE,
    LOADING,
    READY,
    ERROR,
}

type DataState =
    | { status: DataStatus.IDLE }
    | { status: DataStatus.LOADING }
    | { status: DataStatus.READY; data: BookCategoryPopularityResponse[] }
    | { status: DataStatus.ERROR; error: string };

export type PopularCategoriesData = {
    distinctUsers?: BookCategoryPopularityResponse[];
    averages?: BookCategoryPopularityResponse[];
    frequencies?: BookCategoryPopularityResponse[];
    medians?: BookCategoryPopularityResponse[];
}

export type PopularCategoriesState = {
    distinctUsers: DataState;
    averages: DataState;
    frequencies: DataState;
    medians: DataState;
}

export type CategoriesPopularityProps = {
    topCategories?: number;
    data?: PopularCategoriesData;
    onDataReady: (data: PopularCategoriesData) => void;
    renderData: (
        data: BookCategoryPopularityResponse[],
        metric: BookCategoryPopularityMetric,
        colorForGender: (gender: string) => string,
        metricLabel: (metric: BookCategoryPopularityMetric) => string,
    ) => JSX.Element;
};

const initialState: PopularCategoriesState = {
    distinctUsers: { status: DataStatus.IDLE },
    averages: { status: DataStatus.IDLE },
    frequencies: { status: DataStatus.IDLE },
    medians: { status: DataStatus.IDLE },
}

export const CategoriesPopularity = ({ topCategories, data, onDataReady, renderData }: CategoriesPopularityProps) => {
    const [state, setState] = useState<PopularCategoriesState>(initialState);
    const [metric, setMetric] = useState<BookCategoryPopularityMetric>(
        BookCategoryPopularityMetric.DISTINCT_USERS
    );

    const newStateWithError = (
        previous: PopularCategoriesState,
        metric: BookCategoryPopularityMetric,
        error: string
    ): PopularCategoriesState => {
        if (metric === BookCategoryPopularityMetric.DISTINCT_USERS) {
            return {
                ...previous,
                distinctUsers: { status: DataStatus.ERROR, error }
            }
        }
        if (metric === BookCategoryPopularityMetric.FREQUENCY) {
            return {
                ...previous,
                frequencies: { status: DataStatus.ERROR, error }
            }
        }
        if (metric === BookCategoryPopularityMetric.MEDIAN) {
            return {
                ...previous,
                medians: { status: DataStatus.ERROR, error }
            }
        }
        return {
            ...previous,
            averages: { status: DataStatus.ERROR, error }
        }
    }

    const newStateWithLoading = (
        previous: PopularCategoriesState,
        metric: BookCategoryPopularityMetric,
    ): PopularCategoriesState => {
        if (metric === BookCategoryPopularityMetric.DISTINCT_USERS) {
            return {
                ...previous,
                distinctUsers: { status: DataStatus.LOADING }
            }
        }
        if (metric === BookCategoryPopularityMetric.FREQUENCY) {
            return {
                ...previous,
                frequencies: { status: DataStatus.LOADING }
            }
        }
        if (metric === BookCategoryPopularityMetric.MEDIAN) {
            return {
                ...previous,
                medians: { status: DataStatus.LOADING }
            }
        }
        return {
            ...previous,
            averages: { status: DataStatus.LOADING }
        }
    }

    const newStateWithData = (
        previous: PopularCategoriesState,
        data: BookCategoryPopularityResponse[],
        metric: BookCategoryPopularityMetric,
    ): PopularCategoriesState => {
        if (metric === BookCategoryPopularityMetric.DISTINCT_USERS) {
            return {
                ...previous,
                distinctUsers: { status: DataStatus.READY, data }
            }
        }
        if (metric === BookCategoryPopularityMetric.FREQUENCY) {
            return {
                ...previous,
                frequencies: { status: DataStatus.READY, data }
            }
        }
        if (metric === BookCategoryPopularityMetric.MEDIAN) {
            return {
                ...previous,
                medians: { status: DataStatus.READY, data }
            }
        }
        return {
            ...previous,
            averages: { status: DataStatus.READY, data }
        }
    }

    const loadData = async (metric: BookCategoryPopularityMetric) => {
        setState((prev) => newStateWithLoading(prev, metric));
        try {
            const items: BookCategoryPopularityResponse[] = await reportsService.getBookCategoriesPopularity({ limit: topCategories, metric });
            setState((prev) => newStateWithData(prev, items, metric));
        } catch (error: any) {
            setState((prev) => newStateWithError(prev, metric, error.message));
        }
    };

    const colorForGender = (gender: string): string => {
        const colors: Record<string, string> = {
            Hombres: '#1976d2',
            Mujeres: '#e91e63',
        };

        return colors[gender] ?? '#9e9e9e';
    };

    useEffect(() => {
        if (!data || !data.distinctUsers) {
            loadData(metric);
        }
    }, [data?.distinctUsers]);

    useEffect(() => {
        const shouldLoadAverages: boolean = metric === BookCategoryPopularityMetric.AVERAGE && !data?.averages
        const shouldLoadFrequencies: boolean = metric === BookCategoryPopularityMetric.FREQUENCY && !data?.frequencies;
        const shouldLoadMedians: boolean = metric === BookCategoryPopularityMetric.MEDIAN && !data?.medians;
        const shouldLoadData = shouldLoadAverages || shouldLoadFrequencies || shouldLoadMedians;

        if (shouldLoadData) {
            loadData(metric);
        }

    }, [metric]);

    useEffect(() => {
        const newData: PopularCategoriesData = {};
        if (state.averages.status === DataStatus.READY) {
            newData.averages = state.averages.data;
        }
        if (state.distinctUsers.status === DataStatus.READY) {
            newData.distinctUsers = state.distinctUsers.data;
        }
        if (state.frequencies.status === DataStatus.READY) {
            newData.frequencies = state.frequencies.data;
        }
        if (state.medians.status === DataStatus.READY) {
            newData.medians = state.medians.data;
        }
        onDataReady(newData);
    }, [state.distinctUsers, state.averages, state.frequencies, state.medians]);

    const ToggleButtons = (): JSX.Element => {
        return (
            <ToggleButtonGroup
                value={metric}
                exclusive
                onChange={(_, newView) => newView && setMetric(newView)}
                sx={{ mb: 2 }}
            >
                <ToggleButton value={BookCategoryPopularityMetric.DISTINCT_USERS}>
                    Usuarios distintos
                </ToggleButton>
                <ToggleButton value={BookCategoryPopularityMetric.AVERAGE}>
                    Media
                </ToggleButton>
                <ToggleButton value={BookCategoryPopularityMetric.MEDIAN}>
                    Mediana
                </ToggleButton>
                <ToggleButton value={BookCategoryPopularityMetric.FREQUENCY}>
                    Frecuencia
                </ToggleButton>
            </ToggleButtonGroup>
        );
    };

    const dataSateForMetric = (state: PopularCategoriesState, metric: BookCategoryPopularityMetric): DataState => {
        if (metric === BookCategoryPopularityMetric.DISTINCT_USERS) {
            return state.distinctUsers;
        }
        if (metric === BookCategoryPopularityMetric.FREQUENCY) {
            return state.frequencies;
        }
        if (metric === BookCategoryPopularityMetric.MEDIAN) {
            return state.medians;
        }
        return state.averages;
    }

    const ViewContent = ({ state }: { state: DataState }): JSX.Element => {
        if (state.status === DataStatus.IDLE) {
            return <></>
        }

        if (state.status === DataStatus.LOADING) {
            return (
                <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                    <CircularProgress />
                </Box>
            );
        }

        if (state.status === DataStatus.ERROR) {
            return (
                <Box p={2}>
                    <Alert severity="error">
                        {state.error}
                        <Box mt={1}>
                            <Button variant="outlined" color="primary" onClick={(_) => loadData(metric)}>
                                Reintentar
                            </Button>
                        </Box>
                    </Alert>
                </Box>
            );
        }

        if (state.status === DataStatus.READY && state.data.length === 0) {
            return (
                <Box p={2}>
                    <Alert severity="info">No hay datos disponibles.</Alert>
                </Box>
            );
        }

        return (
            renderData(state.data, metric, colorForGender, metricLabel)
        );
    };

    return (
        <Box>
            <ToggleButtons />
            <ViewContent state={dataSateForMetric(state, metric)} />
        </Box>
    );
};

const metricLabel = (metric: BookCategoryPopularityMetric): string => {
    if (metric === BookCategoryPopularityMetric.DISTINCT_USERS) {
        return 'Usuarios distintos con al menos 1 préstamo';
    }
    if (metric === BookCategoryPopularityMetric.FREQUENCY) {
        return 'Frecuencia de préstamos';
    }
    if (metric === BookCategoryPopularityMetric.MEDIAN) {
        return 'Mediana de préstamos';
    }
    return 'Media de préstamos';
};