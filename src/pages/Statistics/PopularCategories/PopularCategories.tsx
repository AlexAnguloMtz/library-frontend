import { useEffect, useState, type JSX } from 'react';
import { Box, Typography, CircularProgress, Alert, Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import type { BookCategoryPopularityResponse } from '../../../models/BookCategoryPopularityResponse';
import reportsService from '../../../services/ReportsService';
import { BookCategoryPopularityMetric } from '../../../models/BookCategoriesPopularityRequest';

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
}

type PopularCategoriesState = {
    distinctUsers: DataState;
    averages: DataState;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <Box
                sx={{
                    bgcolor: '#fff',
                    border: '1px solid #ccc',
                    p: 1,
                    borderRadius: 1,
                    boxShadow: 2,
                }}
            >
                <Typography fontWeight="bold">{label}</Typography>
                {payload.map((pl: any) => (
                    <Typography key={pl.dataKey}>
                        {pl.dataKey}: {pl.value}
                    </Typography>
                ))}
            </Box>
        );
    }
    return null;
};

const groupData = (data: BookCategoryPopularityResponse[]) => {
    const map = new Map<string, BookCategoryPopularityResponse[]>();

    data.forEach((item) => {
        const key = `${item.gender}-${item.ageMin}-${item.ageMax}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(item);
    });

    return Array.from(map.entries()).map(([key, items]) => {
        const [gender, ageMin, ageMax] = key.split('-');

        const categories = items
            .map((i) => ({
                name: i.category,
                value: i.value,
            }))
            .sort((a, b) => a.value - b.value);

        return {
            gender,
            ageMin: Number(ageMin),
            ageMax: Number(ageMax),
            categories,
        };
    });
};

type Props = {
    data?: PopularCategoriesData;
    onDataReady: (data: PopularCategoriesData) => void;
};

const initialState: PopularCategoriesState = {
    distinctUsers: { status: DataStatus.IDLE },
    averages: { status: DataStatus.IDLE }
}

export const PopularCategories = ({ data, onDataReady }: Props) => {
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
        return {
            ...previous,
            averages: { status: DataStatus.READY, data }
        }
    }

    const loadData = async (metric: BookCategoryPopularityMetric) => {
        setState((prev) => newStateWithLoading(prev, metric));
        try {
            const items: BookCategoryPopularityResponse[] = await reportsService.getBookCategoriesPopularity({ limit: 5, metric });
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
        if (metric === BookCategoryPopularityMetric.AVERAGE && !data?.averages) {
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
        onDataReady(newData);
    }, [state.distinctUsers, state.averages]);

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
                    Promedio de préstamos
                </ToggleButton>
            </ToggleButtonGroup>
        );
    };

    const verticalAxisLabel = (metric: BookCategoryPopularityMetric): string => {
        return metric === BookCategoryPopularityMetric.DISTINCT_USERS
            ? 'Usuarios distintos con al menos 1 préstamo por categoría'
            : 'Promedio de préstamos por categoría';
    };

    const dataSateForMetric = (state: PopularCategoriesState, metric: BookCategoryPopularityMetric): DataState => {
        if (metric === BookCategoryPopularityMetric.DISTINCT_USERS) {
            return state.distinctUsers;
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

        const grouped = groupData(state.data);

        return (
            <>
                <Box p={2} display="flex" flexDirection="column" gap="10px">
                    <Box display="flex">
                        <strong style={{ width: 120 }}>Eje horizontal:</strong>
                        <span>Categorías de libros</span>
                    </Box>
                    <Box display="flex">
                        <strong style={{ width: 120 }}>Eje vertical:</strong>
                        <span>{verticalAxisLabel(metric)}</span>
                    </Box>
                </Box>
                <Box
                    p={2}
                    display="flex"
                    flexWrap="wrap"
                    justifyContent="space-between"
                    gap={2}
                >
                    {grouped.map((group, idx) => (
                        <Box
                            key={idx}
                            width="32%"
                            border="1px solid #ddd"
                            borderRadius={2}
                            p={2}
                        >
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                {group.gender} {group.ageMin}-{group.ageMax} años
                            </Typography>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart
                                    data={group.categories}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
                                    barCategoryGap="15%"
                                    barGap={3}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="name"
                                        interval={0}
                                        angle={-40}
                                        textAnchor="end"
                                        tick={{ fontWeight: 'bold', fontSize: 12 }}
                                        tickMargin={5}
                                        minTickGap={0}
                                    />
                                    <YAxis
                                        width={30}
                                        mirror={false}
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar
                                        dataKey="value"
                                        fill={colorForGender(group.gender)}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    ))}
                </Box>
            </>
        );
    };

    return (
        <Box>
            <ToggleButtons />
            <ViewContent state={dataSateForMetric(state, metric)} />
        </Box>
    );
};
