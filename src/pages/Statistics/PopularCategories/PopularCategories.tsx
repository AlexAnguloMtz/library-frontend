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
    LOADING,
    READY,
    ERROR,
}

type DataState =
    | { status: DataStatus.LOADING }
    | { status: DataStatus.READY; data: BookCategoryPopularityResponse[] }
    | { status: DataStatus.ERROR; error: string };

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
        return {
            gender,
            ageMin: Number(ageMin),
            ageMax: Number(ageMax),
            categories: items.map((i) => ({
                name: i.category,
                value: i.value,
            })),
        };
    });
};

type Props = {
    data?: BookCategoryPopularityResponse[];
    onDataReady: (data: BookCategoryPopularityResponse[]) => void;
}

export const PopularCategories = ({ data, onDataReady }: Props) => {
    const [state, setState] = useState<DataState>({ status: DataStatus.LOADING });
    const [metric, setMetric] = useState<BookCategoryPopularityMetric>(BookCategoryPopularityMetric.DISTINCT_USERS);

    const loadData = async () => {
        setState({ status: DataStatus.LOADING });
        try {
            const data = await reportsService.getBookCategoriesPopularity({ limit: 5, metric: BookCategoryPopularityMetric.DISTINCT_USERS });
            setState({ status: DataStatus.READY, data });
            onDataReady(data);
        } catch (error: any) {
            setState({
                status: DataStatus.ERROR,
                error: error.message || 'Error al cargar datos',
            });
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
        if (!data) {
            loadData();
        }
    }, [data]);

    const toggleButtons = (): JSX.Element => {
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
    }

    const verticalAxisLabel = (): string => {
        return metric === BookCategoryPopularityMetric.AVERAGE
            ? 'Media de préstamos por categoría'
            : 'Usuarios distintos con al menos 1 préstamo para esa categoría';
    }

    const viewContent = (): JSX.Element => {
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
                            <Button variant="outlined" color="primary" onClick={loadData}>
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
                        <span>{verticalAxisLabel()}</span>
                    </Box>
                </Box>
                <Box p={2} display="flex" flexWrap="wrap" gap={2}>
                    {grouped.map((group, idx) => (
                        <Box
                            key={idx}
                            flex="1 1 48%"
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
    }

    return (
        <Box>
            {toggleButtons()}
            {viewContent()}
        </Box>
    );
};
