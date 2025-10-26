import { useEffect, useReducer, type JSX } from 'react';
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

// ------------------------ Reducer ------------------------
type Action<T> =
    | { type: 'LOADING'; metric: PopularityMetric }
    | { type: 'READY'; metric: PopularityMetric; data: T[] }
    | { type: 'ERROR'; metric: PopularityMetric; error: string };

const metricKey = (metric: PopularityMetric) => {
    switch (metric) {
        case PopularityMetric.DISTINCT_USERS: return 'distinctUsers';
        case PopularityMetric.AVERAGE: return 'averages';
        case PopularityMetric.FREQUENCY: return 'frequencies';
        case PopularityMetric.MEDIAN: return 'medians';
    }
}

function reducer<T>(state: PopularityState<T>, action: Action<T>): PopularityState<T> {
    const key = metricKey(action.metric) as keyof PopularityState<T>;
    switch (action.type) {
        case 'LOADING':
            return { ...state, [key]: { status: DataStatus.LOADING } };
        case 'READY':
            return { ...state, [key]: { status: DataStatus.READY, data: action.data } };
        case 'ERROR':
            return { ...state, [key]: { status: DataStatus.ERROR, error: action.error } };
    }
}

// ------------------------ Component ------------------------
function initialState<T>(): PopularityState<T> {
    return {
        distinctUsers: { status: DataStatus.IDLE },
        averages: { status: DataStatus.IDLE },
        frequencies: { status: DataStatus.IDLE },
        medians: { status: DataStatus.IDLE },
    };
}

export function Popularity<T>({ limit, data, onDataReady, renderData, getItems }: PopularityProps<T>) {
    const [state, dispatch] = useReducer(reducer, initialState<T>());
    const [metric, setMetric] = useReducer((_: PopularityMetric, newMetric: PopularityMetric) => newMetric, PopularityMetric.DISTINCT_USERS);

    const loadData = async (metric: PopularityMetric) => {
        dispatch({ type: 'LOADING', metric });
        try {
            const items = await getItems({ limit, metric });
            dispatch({ type: 'READY', metric, data: items });
        } catch (e: any) {
            dispatch({ type: 'ERROR', metric, error: e.message });
        }
    };

    const colorForGender = (gender: string): string => {
        const colors: Record<string, string> = {
            Hombres: '#1976d2',
            Mujeres: '#e91e63',
        };
        return colors[gender] ?? '#9e9e9e';
    };

    const currentState = state[metricKey(metric)];

    useEffect(() => {
        const key = metricKey(metric) as keyof PopularityData<T>;
        if (!data || !data[key]) {
            loadData(metric);
        }
    }, [metric, data]);

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

    const ViewContent = ({ state }: { state: DataState<T> }): JSX.Element => {
        if (state.status === DataStatus.IDLE) return <></>;
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
                            <Button variant="outlined" color="primary" onClick={() => loadData(metric)}>
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
        return renderData(state.data, metric, colorForGender, metricLabel);
    };

    return (
        <Box>
            <ToggleButtons />
            <ViewContent state={currentState} />
        </Box>
    );
};

const metricLabel = (metric: PopularityMetric): string => {
    switch (metric) {
        case PopularityMetric.DISTINCT_USERS:
            return 'Usuarios distintos con al menos 1 préstamo';
        case PopularityMetric.FREQUENCY:
            return 'Frecuencia de préstamos';
        case PopularityMetric.MEDIAN:
            return 'Mediana de préstamos';
        case PopularityMetric.AVERAGE:
            return 'Media de préstamos';
    }
};
