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
import type { BookCategoryPopularityResponse } from '../../../models/BookCategoryPopularityResponse';
import { CategoriesPopularity, type PopularCategoriesData } from '../shared/CategoriesPopularity/CategoriesPopularity';
import type { JSX } from 'react';
import type { BookCategoryPopularityMetric } from '../../../models/BookCategoriesPopularityRequest';

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


type Props = {
    data?: PopularCategoriesData;
    onDataReady: (data: PopularCategoriesData) => void;
}

export const PopularityByCategory = ({ data, onDataReady }: Props) => {
    const renderData = (
        data: BookCategoryPopularityResponse[],
        metric: BookCategoryPopularityMetric,
        colorForGender: (gender: string) => string,
        metricLabel: (metric: BookCategoryPopularityMetric) => string,
    ): JSX.Element => {
        const grouped = groupData(data);
        const allGenders = Array.from(new Set(data.map(d => d.gender)));

        return (
            <Box>
                <Box p={2} display="flex" flexDirection="column" gap="10px">
                    <Box display="flex">
                        <strong style={{ width: 120 }}>Eje horizontal:</strong>
                        <span>Edad y género</span>
                    </Box>
                    <Box display="flex">
                        <strong style={{ width: 120 }}>Eje vertical:</strong>
                        <span>{metricLabel(metric)}</span>
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
    }

    return (
        <CategoriesPopularity
            data={data}
            onDataReady={onDataReady}
            renderData={renderData}
        />
    );


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
