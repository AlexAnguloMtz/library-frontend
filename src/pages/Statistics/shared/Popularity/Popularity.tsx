import { useEffect, useState, type JSX } from 'react';
import { Box, CircularProgress, Alert, Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { PopularityMetric } from '../../../../models/PopularityMetric';

enum DataStatus {
    IDLE,
    LOADING,
    READY,
    ERROR,
}

type DataState<T> =
    | { status: DataStatus.IDLE }
    | { status: DataStatus.LOADING }
    | { status: DataStatus.READY; data: T[] }
    | { status: DataStatus.ERROR; error: string };

export type PopularityData<T> = {
    distinctUsers?: T[];
    averages?: T[];
    frequencies?: T[];
    medians?: T[];
}

export type PopularityState<T> = {
    distinctUsers: DataState<T>;
    averages: DataState<T>;
    frequencies: DataState<T>;
    medians: DataState<T>;
}

export type PopularityProps<T> = {
    limit?: number;
    data?: PopularityData<T>;
    onDataReady: (data: PopularityData<T>) => void;
    renderData: (
        data: T[],
        metric: PopularityMetric,
        colorForGender: (gender: string) => string,
        metricLabel: (metric: PopularityMetric) => string,
    ) => JSX.Element;
    getItems: ({ metric, limit }: { metric: PopularityMetric, limit?: number }) => Promise<T[]>;
};

function initialState<T>(): PopularityState<T> {
    return {
        distinctUsers: { status: DataStatus.IDLE },
        averages: { status: DataStatus.IDLE },
        frequencies: { status: DataStatus.IDLE },
        medians: { status: DataStatus.IDLE },
    };
}

export function Popularity<T>({ limit, data, onDataReady, renderData, getItems }: PopularityProps<T>) {
    const [state, setState] = useState<PopularityState<T>>(initialState<T>());
    const [metric, setMetric] = useState<PopularityMetric>(
        PopularityMetric.DISTINCT_USERS
    );

    const newStateWithError = (
        previous: PopularityState<T>,
        metric: PopularityMetric,
        error: string
    ): PopularityState<T> => {
        if (metric === PopularityMetric.DISTINCT_USERS) {
            return {
                ...previous,
                distinctUsers: { status: DataStatus.ERROR, error }
            }
        }
        if (metric === PopularityMetric.FREQUENCY) {
            return {
                ...previous,
                frequencies: { status: DataStatus.ERROR, error }
            }
        }
        if (metric === PopularityMetric.MEDIAN) {
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
        previous: PopularityState<T>,
        metric: PopularityMetric,
    ): PopularityState<T> => {
        if (metric === PopularityMetric.DISTINCT_USERS) {
            return {
                ...previous,
                distinctUsers: { status: DataStatus.LOADING }
            }
        }
        if (metric === PopularityMetric.FREQUENCY) {
            return {
                ...previous,
                frequencies: { status: DataStatus.LOADING }
            }
        }
        if (metric === PopularityMetric.MEDIAN) {
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
        previous: PopularityState<T>,
        data: T[],
        metric: PopularityMetric,
    ): PopularityState<T> => {
        if (metric === PopularityMetric.DISTINCT_USERS) {
            return {
                ...previous,
                distinctUsers: { status: DataStatus.READY, data }
            }
        }
        if (metric === PopularityMetric.FREQUENCY) {
            return {
                ...previous,
                frequencies: { status: DataStatus.READY, data }
            }
        }
        if (metric === PopularityMetric.MEDIAN) {
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

    const loadData = async (metric: PopularityMetric) => {
        setState((prev) => newStateWithLoading(prev, metric));
        try {
            const items: T[] = await getItems({ limit, metric });
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
        const shouldLoadAverages: boolean = metric === PopularityMetric.AVERAGE && !data?.averages
        const shouldLoadFrequencies: boolean = metric === PopularityMetric.FREQUENCY && !data?.frequencies;
        const shouldLoadMedians: boolean = metric === PopularityMetric.MEDIAN && !data?.medians;
        const shouldLoadData = shouldLoadAverages || shouldLoadFrequencies || shouldLoadMedians;

        if (shouldLoadData) {
            loadData(metric);
        }

    }, [metric]);

    useEffect(() => {
        const newData: PopularityData<T> = {};
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
        const options = [
            { value: PopularityMetric.DISTINCT_USERS, label: 'Usuarios distintos' },
            { value: PopularityMetric.AVERAGE, label: 'Media' },
            { value: PopularityMetric.MEDIAN, label: 'Mediana' },
            { value: PopularityMetric.FREQUENCY, label: 'Frecuencia' },
        ];

        return (
            <ToggleButtonGroup
                value={metric}
                exclusive
                onChange={(_, newView) => newView && setMetric(newView)}
                sx={{ mb: 2 }}
            >
                {options.map(({ value, label }) => (
                    <ToggleButton key={value} value={value}>
                        {label}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
        );
    };

    const dataSateForMetric = (state: PopularityState<T>, metric: PopularityMetric): DataState<T> => {
        if (metric === PopularityMetric.DISTINCT_USERS) {
            return state.distinctUsers;
        }
        if (metric === PopularityMetric.FREQUENCY) {
            return state.frequencies;
        }
        if (metric === PopularityMetric.MEDIAN) {
            return state.medians;
        }
        return state.averages;
    }

    const ViewContent = ({ state }: { state: DataState<T> }): JSX.Element => {
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

const metricLabel = (metric: PopularityMetric): string => {
    if (metric === PopularityMetric.DISTINCT_USERS) {
        return 'Usuarios distintos con al menos 1 préstamo';
    }
    if (metric === PopularityMetric.FREQUENCY) {
        return 'Frecuencia de préstamos';
    }
    if (metric === PopularityMetric.MEDIAN) {
        return 'Mediana de préstamos';
    }
    return 'Media de préstamos';
};