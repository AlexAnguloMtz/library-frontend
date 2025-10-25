import { Box, Typography, CircularProgress, Alert, Button, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useEffect, useState } from 'react';
import type { LoansDistributionResponse } from '../../../models/LoansDistributionResponse';
import reportsService from '../../../services/ReportsService';

enum DataStatus {
    LOADING,
    READY,
    ERROR,
}

type DataState =
    | { status: DataStatus.LOADING }
    | { status: DataStatus.READY; data: LoansDistributionResponse[] }
    | { status: DataStatus.ERROR; error: string };

const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const genderMap: Record<string, string> = {
    Male: 'Hombres',
    Female: 'Mujeres',
    Other: 'Otro',
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);

    return (
        <Box bgcolor="white" p={1} border="1px solid #ccc">
            <Typography variant="subtitle2">{`Mes: ${monthNames[label - 1]}`}</Typography>
            {payload.map((entry: any) => (
                <Typography key={entry.name} style={{ color: entry.stroke }}>
                    {genderMap[entry.name] || entry.name}: {new Intl.NumberFormat().format(entry.value)}
                </Typography>
            ))}
            <Typography variant="body2" fontWeight="bold" mt={0.5}>
                {`Total mes: ${new Intl.NumberFormat().format(total)}`}
            </Typography>
        </Box>
    );
};

const groupByYear = (data: LoansDistributionResponse[]) => {
    const grouped: Record<number, any[]> = {};
    data.forEach(item => {
        if (!grouped[item.year]) grouped[item.year] = [];
        grouped[item.year].push(item);
    });
    const result: Record<number, any[]> = {};
    for (const year in grouped) {
        const months = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            Male: 0,
            Female: 0,
            Other: 0,
        }));
        grouped[year].forEach(item => {
            const monthIndex = item.month - 1;
            const key = item.gender === 'Hombres' ? 'Male' : item.gender === 'Mujeres' ? 'Female' : 'Other';
            months[monthIndex][key] = item.value;
        });
        result[year] = months;
    }
    return result;
};

const totalByYear = (dataByYear: Record<number, any[]>) => {
    const result: Record<number, any[]> = {};
    for (const year in dataByYear) {
        result[year] = dataByYear[year].map(month => ({
            month: month.month,
            Total: month.Male + month.Female + month.Other,
        }));
    }
    return result;
};

export const LoansDistribution = () => {
    const [state, setState] = useState<DataState>({ status: DataStatus.LOADING });
    const [view, setView] = useState<'gender' | 'total'>('total');

    const loadData = async () => {
        setState({ status: DataStatus.LOADING });
        try {
            const response = await reportsService.getLoansDistribution();
            setState({ status: DataStatus.READY, data: response });
        } catch (error: any) {
            setState({ status: DataStatus.ERROR, error: error.message || 'Error al cargar datos' });
        }
    };

    useEffect(() => { loadData(); }, []);

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

    const dataByYear = groupByYear(state.data);
    const totalDataByYear = totalByYear(dataByYear);

    // Total global
    const globalTotal = state.data.reduce((acc, item) => acc + item.value, 0);

    // Total por año
    const yearlyTotals: Record<number, number> = {};
    for (const year in dataByYear) {
        yearlyTotals[year] = dataByYear[year].reduce((sum, month) => sum + month.Male + month.Female + month.Other, 0);
    }

    const displayedData = view === 'gender' ? dataByYear : totalDataByYear;

    return (
        <Box padding={'20px 10px 400px 10px'} display="flex" flexDirection="column" gap={4}>
            <ToggleButtonGroup
                value={view}
                exclusive
                onChange={(_, newView) => newView && setView(newView)}
                sx={{ mb: 2 }}
            >
                <ToggleButton value="total">Totales</ToggleButton>
                <ToggleButton value="gender">Por Género</ToggleButton>
            </ToggleButtonGroup>

            <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                Total de préstamos: {new Intl.NumberFormat().format(globalTotal)}
            </Typography>

            {Object.entries(displayedData)
                .sort((a, b) => Number(b[0]) - Number(a[0]))
                .map(([year, months]) => (
                    <Box key={year}>
                        <Typography variant="h6">{`Año ${year}`}</Typography>
                        <Typography variant="body2" fontWeight="bold" color="textSecondary" mb={1}>
                            {`Total año: ${new Intl.NumberFormat().format(yearlyTotals[Number(year)])}`}
                        </Typography>

                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={months}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="month"
                                    tickFormatter={(m) => monthNames[m - 1]}
                                    label={{ value: 'Mes', position: 'insideBottom', offset: 5 }}
                                />
                                <YAxis
                                    label={{
                                        value: 'Frecuencia de préstamos',
                                        angle: -90,
                                        position: 'insideLeft',
                                        offset: 4,
                                        dy: 70
                                    }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend formatter={(value) => genderMap[value] || value} />
                                {view === 'gender' ? (
                                    <>
                                        <Line type="monotone" dataKey="Male" stroke="#1976d2" />
                                        <Line type="monotone" dataKey="Female" stroke="#e91e63" />
                                        <Line type="monotone" dataKey="Other" stroke="#9e9e9e" />
                                    </>
                                ) : (
                                    <Line type="monotone" dataKey="Total" stroke="#1976d2" />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                ))}
        </Box>
    );
};
