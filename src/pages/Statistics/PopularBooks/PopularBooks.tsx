import { type JSX } from 'react';
import { Box, Typography } from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { PopularityMetric } from '../../../models/PopularityMetric';
import { Popularity, type PopularityData } from '../shared/Popularity/Popularity';
import reportsService from '../../../services/ReportsService';
import type { BookPopularityResponse } from '../../../models/BookPopularityResponse';

const groupData = (data: BookPopularityResponse[]) => {
    const map = new Map<string, BookPopularityResponse[]>();

    data.forEach((item) => {
        const key = `${item.gender}-${item.ageMin}-${item.ageMax}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(item);
    });

    return Array.from(map.entries()).map(([key, items]) => {
        const [gender, ageMin, ageMax] = key.split('-');

        const books = items
            .map((i) => ({
                name: i.bookTitle,
                value: i.value,
            }))
            .sort((a, b) => a.value - b.value);

        return {
            gender,
            ageMin: Number(ageMin),
            ageMax: Number(ageMax),
            books,
        };
    });
};

type Props = {
    data?: PopularityData<BookPopularityResponse>,
    onDataReady: (data: PopularityData<BookPopularityResponse>) => void;
}

export const PopularBooks = ({ data, onDataReady }: Props) => {
    const renderData = (
        data: BookPopularityResponse[],
        metric: PopularityMetric,
        colorForGender: (gender: string) => string,
        metricLabel: (metric: PopularityMetric) => string,
    ): JSX.Element => {
        const grouped = groupData(data);
        return (
            <>
                <Box p={2} display="flex" flexDirection="column" gap="10px">
                    <Box display="flex">
                        <strong style={{ width: 120 }}>Eje horizontal:</strong>
                        <span>Libros</span>
                    </Box>
                    <Box display="flex">
                        <strong style={{ width: 120 }}>Eje vertical:</strong>
                        <span>{metricLabel(metric)}</span>
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
                                    data={group.books}
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
                                    <Tooltip content={
                                        <CustomTooltip
                                            metric={metric}
                                            metricLabel={metricLabel}
                                        />}
                                    />
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
        <Popularity
            limit={5}
            data={data}
            onDataReady={onDataReady}
            renderData={renderData}
            getItems={(request) => reportsService.getBooksPopularity(request)}
        />
    );
};

const CustomTooltip = ({ active, payload, label, metric, metricLabel }: any) => {
    if (active && payload && payload.length) {
        const value = payload[0].value;
        return (
            <Box
                sx={{
                    bgcolor: '#fff',
                    border: '1px solid #ccc',
                    p: 1.2,
                    borderRadius: 1,
                    boxShadow: 2,
                }}
            >
                <Typography fontWeight="bold">{label}</Typography>
                <Typography>
                    {metricLabel(metric)}: <strong>{value}</strong>
                </Typography>
            </Box>
        );
    }
    return null;
};

