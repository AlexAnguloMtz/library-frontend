import { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import type { BookCategoryPopularityGroupResponse } from '../../../models/BookCategoryPopularityGroupResponse';
import reportsService from '../../../services/ReportsService';

enum DataStatus {
    LOADING,
    READY,
    ERROR,
}

type DataState =
    | { status: DataStatus.LOADING }
    | { status: DataStatus.READY; data: BookCategoryPopularityGroupResponse[] }
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

const groupData = (data: BookCategoryPopularityGroupResponse[]) => {
    const map = new Map<string, BookCategoryPopularityGroupResponse[]>();

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

export const PopularCategories = () => {
    const [state, setState] = useState<DataState>({ status: DataStatus.LOADING });

    const loadData = async () => {
        setState({ status: DataStatus.LOADING });
        try {
            const response = await reportsService.getPopularBookCategories();
            setState({ status: DataStatus.READY, data: response });
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
        loadData();
    }, []);

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
        <Box>
            <Box p={2} display="flex" flexDirection="column" gap="10px">
                <Box display="flex">
                    <strong style={{ width: 120 }}>Eje horizontal:</strong>
                    <span>Categorías de libros</span>
                </Box>
                <Box display="flex">
                    <strong style={{ width: 120 }}>Eje vertical:</strong>
                    <span>Media de préstamos por categoría</span>
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
                        <ResponsiveContainer width="100%" height={300}>
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
        </Box>
    );
};
