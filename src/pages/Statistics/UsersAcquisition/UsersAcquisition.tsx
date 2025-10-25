import { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Button,
} from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import type { UsersAcquisitionResponse } from '../../../models/UsersAcquisitionResponse';
import reportsService from '../../../services/ReportsService';

enum DataStatus {
    LOADING,
    READY,
    ERROR,
}

type DataState =
    | { status: DataStatus.LOADING }
    | { status: DataStatus.READY; data: UsersAcquisitionResponse[] }
    | { status: DataStatus.ERROR; error: string };

// Tooltip personalizado
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <Box sx={{ bgcolor: '#fff', border: '1px solid #ccc', p: 1, borderRadius: 1, boxShadow: 2 }}>
                <Typography fontWeight="bold">{label}</Typography>
                {payload.map((pl: any) => {
                    const data = pl.payload._tooltip[pl.dataKey];
                    if (!data) return null;
                    return (
                        <Box key={pl.dataKey} mb={1}>
                            <Typography fontWeight="bold">{`${pl.dataKey}`}</Typography>
                            <Typography>Usuarios al inicio: {data.usersAtBeginning}</Typography>
                            <Typography>Usuarios al final: {data.usersAtEnd}</Typography>
                            <Typography>Usuarios nuevos: {data.newUsers}</Typography>
                        </Box>
                    );
                })}
            </Box>
        );
    }
    return null;
};

// Agrupa por año
const groupByYear = (data: UsersAcquisitionResponse[]) => {
    const grouped: Record<number, UsersAcquisitionResponse[]> = {};
    data.forEach(d => {
        if (!grouped[d.year]) grouped[d.year] = [];
        grouped[d.year].push(d);
    });
    return grouped;
};

// Orden cronológico de meses (nombres)
const monthOrder = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Merge para gráfica
type ChartRow = {
    month: string;
    [year: number]: number;
    _tooltip: Record<number, UsersAcquisitionResponse>;
};

const mergeYearlyData = (grouped: Record<number, UsersAcquisitionResponse[]>) => {
    const allMonths = new Set<string>();
    Object.values(grouped).forEach(arr => arr.forEach(d => allMonths.add(d.month)));
    const sortedMonths = Array.from(allMonths).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

    const merged: ChartRow[] = sortedMonths.map(month => {
        const row: ChartRow = { month, _tooltip: {} };
        Object.entries(grouped).forEach(([yearStr, data]) => {
            const year = Number(yearStr);
            const monthData = data.find(d => d.month === month);
            if (monthData) {
                row[year] = monthData.usersAtEnd;
                row._tooltip[year] = monthData;
            }
        });
        return row;
    });

    return merged;
};

type Props = {
    data?: UsersAcquisitionResponse[],
    onDataReady: (data: UsersAcquisitionResponse[]) => void
}

export const UsersAcquisition = ({ data, onDataReady }: Props) => {
    const [state, setState] = useState<DataState>(
        data ? { status: DataStatus.READY, data } : { status: DataStatus.LOADING }
    );

    const loadData = async () => {
        setState({ status: DataStatus.LOADING });
        try {
            const response = await reportsService.getUsersAcquisition();
            setState({ status: DataStatus.READY, data: response });
            onDataReady(response);
        } catch (error: any) {
            setState({ status: DataStatus.ERROR, error: error.message || 'Error al cargar datos' });
        }
    };

    useEffect(() => {
        if (!data) {
            loadData();
        }
    }, [data]);

    if (state.status === DataStatus.LOADING) return (
        <Box display="flex" justifyContent="center" alignItems="center" p={4}><CircularProgress /></Box>
    );
    if (state.status === DataStatus.ERROR) return (
        <Box p={2}>
            <Alert severity="error">
                {state.error}
                <Box mt={1}><Button variant="outlined" onClick={loadData}>Reintentar</Button></Box>
            </Alert>
        </Box>
    );
    if (state.status === DataStatus.READY && state.data.length === 0) return (
        <Box p={2}><Alert severity="info">No hay datos disponibles.</Alert></Box>
    );

    const grouped = groupByYear(state.data);
    const chartData = mergeYearlyData(grouped);

    return (
        <Box padding={'20px 10px 400px 10px'} display="flex" flexDirection="column" gap={6}>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis
                        label={{
                            value: 'Usuarios totales',
                            angle: -90,
                            position: 'insideLeft',
                            offset: 0,
                            dx: 0,
                            dy: 0,
                            style: { textAnchor: 'middle', fontWeight: 'bold' }
                        }}
                        width={54}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {Object.keys(grouped).map(year => (
                        <Line
                            key={year}
                            type="monotone"
                            dataKey={Number(year)}
                            name={`${year}`}
                            stroke={`hsl(${Number(year) * 70 % 360}, 70%, 50%)`}
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                            activeDot={{ r: 6 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </Box>
    );
};
