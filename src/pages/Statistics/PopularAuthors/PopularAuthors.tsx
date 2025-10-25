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
import type { AuthorPopularityResponse } from '../../../models/AuthorPopularityResponse';
import reportsService from '../../../services/ReportsService';

enum DataStatus {
    LOADING,
    READY,
    ERROR,
}

type DataState =
    | { status: DataStatus.LOADING }
    | { status: DataStatus.READY; data: AuthorPopularityResponse[] }
    | { status: DataStatus.ERROR; error: string };

type Props = {
    data?: AuthorPopularityResponse[];
    onDataReady: (data: AuthorPopularityResponse[]) => void;
};

const CustomTooltip = ({ active, payload }: any) => {
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
                {payload.map((pl: any) => {
                    const data = pl.payload;
                    return (
                        <Box key={pl.dataKey} mb={1}>
                            <Typography fontWeight="bold">{data.name}</Typography>
                            <Typography>ID Autor: {data.id}</Typography>
                            <Typography>Media de préstamos: {data.value}</Typography>
                        </Box>
                    );
                })}
            </Box>
        );
    }
    return null;
};

const groupData = (data: AuthorPopularityResponse[]) => {
    const map = new Map<string, AuthorPopularityResponse[]>();

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
            authors: items.map((i) => ({
                id: i.authorId,
                name: `${i.authorFirstName} ${i.authorLastName}`,
                value: i.value,
            })),
        };
    });
};

export const PopularAuthors = ({ data, onDataReady }: Props) => {
    const [state, setState] = useState<DataState>(
        data ? { status: DataStatus.READY, data } : { status: DataStatus.LOADING }
    );

    const loadData = async () => {
        setState({ status: DataStatus.LOADING });
        try {
            const response = await reportsService.getAuthorsPopularity({ limit: 5 });
            setState({ status: DataStatus.READY, data: response });
            onDataReady(response);
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
                    <span>Autores</span>
                </Box>
                <Box display="flex">
                    <strong style={{ width: 120 }}>Eje vertical:</strong>
                    <span>Media de préstamos por autor</span>
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
                        <div style={{ height: '20px' }}></div>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                                data={group.authors}
                                margin={{ top: 10, right: 10, left: 0, bottom: 100 }}
                                barCategoryGap="15%"
                                barGap={3}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="name"
                                    interval={0}
                                    angle={-50}
                                    textAnchor="end"
                                    tick={{ fontWeight: 'bold', fontSize: 12 }}
                                    tickMargin={10}
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
