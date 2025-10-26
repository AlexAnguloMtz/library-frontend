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
import type { AuthorPopularityResponse } from '../../../models/AuthorPopularityResponse';
import reportsService from '../../../services/ReportsService';
import type { PopularityMetric } from '../../../models/PopularityMetric';
import { Popularity, type PopularityData } from '../shared/Popularity/Popularity';

const CustomTooltip = ({ active, payload, metric, metricLabel }: any) => {
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
                            <Typography>{metricLabel(metric)}: <strong>{data.value}</strong></Typography>
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

        const authors = items
            .map((i) => ({
                id: i.authorId,
                name: `${i.authorFirstName} ${i.authorLastName}`,
                value: i.value,
            }))
            .sort((a, b) => a.value - b.value);

        return {
            gender,
            ageMin: Number(ageMin),
            ageMax: Number(ageMax),
            authors,
        };
    });
};

type Props = {
    data?: PopularityData<AuthorPopularityResponse>,
    onDataReady: (data: PopularityData<AuthorPopularityResponse>) => void;
}

export const PopularAuthors = ({ data, onDataReady }: Props) => {
    const renderData = (
        data: AuthorPopularityResponse[],
        metric: PopularityMetric,
        colorForGender: (gender: string) => string,
        metricLabel: (metric: PopularityMetric) => string,
    ): JSX.Element => {
        const grouped = groupData(data);
        return (
            <>
                <Box>
                    <Box p={2} display="flex" flexDirection="column" gap="10px">
                        <Box display="flex">
                            <strong style={{ width: 120 }}>Eje horizontal:</strong>
                            <span>Autores</span>
                        </Box>
                        <Box display="flex">
                            <strong style={{ width: 120 }}>Eje vertical:</strong>
                            <span>{metricLabel(metric)}</span>
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
                                        <Tooltip content={
                                            <CustomTooltip
                                                metric={metric}
                                                metricLabel={metricLabel}
                                            />
                                        } />
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
            </>
        );
    }

    return (
        <Popularity
            limit={5}
            data={data}
            renderData={renderData}
            onDataReady={onDataReady}
            getItems={(request) => reportsService.getAuthorsPopularity(request)}
        />
    );
};
