import { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Button,
} from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import type { UsersDemographyResponse } from '../../../models/UsersDemographyResponse';
import reportsService from '../../../services/ReportsService';

enum DataStatus {
    LOADING,
    READY,
    ERROR,
}

type DataState =
    | { status: DataStatus.LOADING }
    | { status: DataStatus.READY; data: UsersDemographyResponse[] }
    | { status: DataStatus.ERROR; error: string };

// Helper para colores
const colorForGender = (gender: string) => {
    if (gender === 'Femenino') return '#e91e63';
    if (gender === 'Masculino') return '#1976d2';
    return '#9e9e9e'; // gris por defecto
};

// Tooltip personalizado
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <Box sx={{ bgcolor: '#fff', border: '1px solid #ccc', p: 1, borderRadius: 1 }}>
                {payload.map((pl: any) => (
                    <Box key={pl.dataKey} mb={1}>
                        <Typography fontWeight="bold">{pl.dataKey}</Typography>
                        <Typography>Usuarios: {pl.value}</Typography>
                    </Box>
                ))}
            </Box>
        );
    }
    return null;
};

export const UsersDemography = () => {
    const [state, setState] = useState<DataState>({ status: DataStatus.LOADING });

    const loadData = async () => {
        setState({ status: DataStatus.LOADING });
        try {
            const response = await reportsService.getUsersDemography();
            setState({ status: DataStatus.READY, data: response });
        } catch (error: any) {
            setState({ status: DataStatus.ERROR, error: error.message || 'Error al cargar datos' });
        }
    };

    useEffect(() => { loadData(); }, []);

    if (state.status === DataStatus.LOADING)
        return <Box display="flex" justifyContent="center" alignItems="center" p={4}><CircularProgress /></Box>;

    if (state.status === DataStatus.ERROR)
        return (
            <Box p={2}>
                <Alert severity="error">
                    {state.error}
                    <Box mt={1}>
                        <Button variant="outlined" onClick={loadData}>Reintentar</Button>
                    </Box>
                </Alert>
            </Box>
        );

    if (state.status === DataStatus.READY && state.data.length === 0)
        return <Box p={2}><Alert severity="info">No hay datos disponibles.</Alert></Box>;

    const chartData: any[] = [];
    const genders = Array.from(new Set(state.data.map(d => d.gender)));

    const ageRanges = Array.from({ length: 10 }, (_, i) => ({ ageMin: i * 10, ageMax: i * 10 + 9 }));

    let totalAbsolute = 0;

    ageRanges.forEach(range => {
        const row: any = { age: `${range.ageMin}-${range.ageMax}` };
        let total = 0;
        genders.forEach(g => {
            const record = state.data.find(d => d.ageMin === range.ageMin && d.ageMax === range.ageMax && d.gender === g);
            const freq = record ? record.frequency : 0;
            row[g] = freq;
            total += freq;
        });
        row['Total'] = total;
        totalAbsolute += total;
        chartData.push(row);
    });

    return (
        <Box padding="20px 10px" display="flex" flexDirection="column" gap={2}>
            <Typography variant="h6">Distribución de usuarios por edad y género</Typography>
            <Typography variant="subtitle1" fontWeight="bold">
                Total de usuarios: {totalAbsolute}
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {genders.map(g => (
                        <Bar key={g} dataKey={g} fill={colorForGender(g)} />
                    ))}
                    <Bar key="Total" dataKey="Total" fill="#4caf50" />
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
};

