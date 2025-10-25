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
import type { BookCategoryPopularityResponse } from '../../../models/BookCategoryPopularityResponse';
import reportsService from '../../../services/ReportsService';

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
    const grouped: Record<string, any[]> = {};

    data.forEach((item) => {
        const ageGroup = `${item.ageMin}-${item.ageMax}`;
        if (!grouped[item.category]) grouped[item.category] = [];
        let group = grouped[item.category].find((g) => g.ageGroup === ageGroup);
        if (!group) {
            group = { ageGroup };
            grouped[item.category].push(group);
        }
        group[item.gender] = item.value;
    });

    Object.values(grouped).forEach((arr) => {
        arr.sort((a, b) => parseInt(a.ageGroup.split('-')[0]) - parseInt(b.ageGroup.split('-')[0]));
    });

    const orderedGrouped: Record<string, any[]> = {};
    Object.keys(grouped)
        .sort((a, b) => a.localeCompare(b))
        .forEach((key) => {
            orderedGrouped[key] = grouped[key];
        });

    return orderedGrouped;
};


export const PopularityByCategory = () => {
    const [state, setState] = useState<DataState>({ status: DataStatus.LOADING });

    const loadData = async () => {
        setState({ status: DataStatus.LOADING });
        try {
            const response: BookCategoryPopularityResponse[] = await reportsService.getBookCategoriesPopularity({});
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

    const allGenders = Array.from(new Set(state.data.map(d => d.gender)));

    return (
        <Box>
            <Box p={2} display="flex" flexDirection="column" gap="10px">
                <Box display="flex">
                    <strong style={{ width: 120 }}>Eje horizontal:</strong>
                    <span>Edad y género</span>
                </Box>
                <Box display="flex">
                    <strong style={{ width: 120 }}>Eje vertical:</strong>
                    <span>Media de préstamos</span>
                </Box>
            </Box>
            <Box
                p={2}
                display="flex"
                flexDirection="column"
                gap={4}
            >
                {Object.entries(grouped).map(([category, data]) => (
                    <Box
                        key={category}
                        width="100%"
                        height={400}
                    >
                        <Typography textAlign="center" fontWeight="bold" mb={1}>
                            {category}
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
                                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="ageGroup" />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                {allGenders.map((gender) => (
                                    <Bar
                                        key={gender}
                                        dataKey={gender}
                                        fill={colorForGender(gender)}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                ))}
            </Box>

        </Box>
    );
};
