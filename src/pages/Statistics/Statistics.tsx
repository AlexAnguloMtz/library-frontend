import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CategoryIcon from '@mui/icons-material/Category';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import { StatisticsListing } from './StatisticsListing/StatisticsListing';
import { PopularCategories } from './PopularCategories/PopularCategories';
import { PopularAuthors } from './PopularAuthors/PopularAuthors';
import { PopularityByCategory } from './PopularityByCategory/PopularityByCategory';

type TabItem = {
    id: string;
    title: string;
    content: React.ReactNode;
    removable: boolean;
};

const cards = [
    { id: 'popular-authors', title: 'Autores más populares', content: <PopularAuthors />, icon: <PersonSearchIcon /> },
    { id: 'popular-categories', title: 'Categorías más populares', content: <PopularCategories />, icon: <CategoryIcon /> },
    { id: 'popularity-by-category', title: 'Popularidad por categoría', content: <PopularityByCategory />, icon: <CategoryIcon /> },
];

export const Statistics = () => {
    const [tabs, setTabs] = useState<TabItem[]>([]);
    const [activeTab, setActiveTab] = useState('statistics-listing');

    useEffect(() => {
        setTabs([
            {
                id: 'statistics-listing',
                title: 'Todas',
                content: <StatisticsListing onCardClicked={handleCardClicked} cards={cards} />,
                removable: false,
            },
        ]);
    }, []);

    const handleCardClicked = (id: string) => {
        setTabs((prevTabs) => {
            if (prevTabs.find((t) => t.id === id)) {
                setActiveTab(id);
                return prevTabs;
            }
            const card = cards.find((c) => c.id === id);
            if (!card) return prevTabs;

            setActiveTab(card.id);
            return [...prevTabs, { ...card, removable: true }];
        });
    };

    const handleCloseTab = (id: string) => {
        setTabs((prev) => prev.filter((t) => t.id !== id));
        if (activeTab === id) setActiveTab('statistics-listing');
    };

    return (
        <Box p={2}>
            <h1 className="dashboard-module-top-bar-title">Estadísticas</h1>

            <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
            >
                {tabs.map((tab) => (
                    <Tab
                        key={tab.id}
                        value={tab.id}
                        label={
                            tab.removable ? (
                                <Box display="flex" alignItems="center">
                                    {tab.title}
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCloseTab(tab.id);
                                        }}
                                        sx={{ ml: 1 }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ) : (
                                tab.title
                            )
                        }
                        sx={{ textTransform: 'none', minHeight: 48 }}
                    />
                ))}
            </Tabs>

            <Box mt={2}>
                {tabs.map((tab) => tab.id === activeTab && <Box key={tab.id}>{tab.content}</Box>)}
            </Box>
        </Box>
    );
};
