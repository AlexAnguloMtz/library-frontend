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
import type { PopularBookCategoriesResponse } from '../../../models/PopularBookCategoriesResponse';
import reportsService from '../../../services/ReportsService';

enum DataStatus {
    LOADING,
    READY,
    ERROR
}

type DataState =
    | { status: DataStatus.LOADING }
    | { status: DataStatus.READY; data: PopularBookCategoriesResponse[] }
    | { status: DataStatus.ERROR; error: string }

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

export const PopularCategories = () => {
    const [state, setState] = useState<DataState>({ status: DataStatus.LOADING });

    const loadData = async () => {
        setState({ status: DataStatus.LOADING });
        try {
            const response = await reportsService.getPopularBookCategories();
            setState({ status: DataStatus.READY, data: response });
        } catch (error: any) {
            setState({ status: DataStatus.ERROR, error: error.message || 'Error al cargar datos' });
        }
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

    return (
        <Box>
            <Box p={2} display="flex" flexDirection={'column'} gap={'10px'}>
                <p><strong>Eje horizontal:</strong> Categorías de libros</p>
                <p><strong>Eje vertical:</strong> Usuarios distintos con al menos un préstamo de libro de dicha categoría</p>
            </Box>
            <Box p={2} display="flex" flexWrap="wrap" gap={2}>
                {state.data.map((item, idx) =>
                    item.groups.map((group, gIdx) => (
                        <Box
                            key={`${idx}-${gIdx}`}
                            flex="1 1 48%"
                            border="1px solid #ddd"
                            borderRadius={2}
                            p={2}
                        >
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                {item.gender} {group.ageRange.min}-{group.ageRange.max} años
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={group.categories.map(c => ({ name: c.name, frequency: c.frequency }))}
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
                                        dataKey="frequency"
                                        fill={
                                            item.gender === 'Hombres'
                                                ? '#1976d2'
                                                : item.gender === 'Mujeres'
                                                    ? '#e91e63'
                                                    : '#9e9e9e'
                                        }
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    ))
                )}
            </Box>
        </Box>
    );
};
