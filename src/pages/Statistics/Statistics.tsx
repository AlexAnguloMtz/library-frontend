import React, { useState, useEffect } from 'react';
import './styles.css';
import { Box, Tabs, Tab, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { StatisticsListing } from './StatisticsListing/StatisticsListing';
import CategoryIcon from '@mui/icons-material/Category';
import { PopularCategories } from './PopularCategories/PopularCategories';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import { PopularAuthors } from './PopularAuthors/PopularAuthors';

type TabItem = {
    id: string;
    label: string;
    content: React.ReactNode;
    removable: boolean;
};

export const Statistics = () => {
    const cards = [
        {
            id: 'popular-authors',
            title: 'Autores populares',
            icon: < PersonSearchIcon />,
            content: <PopularAuthors />
        },
        {
            id: 'popular-categories',
            title: 'Categorías populares',
            icon: <CategoryIcon />,
            content: <PopularCategories />
        },
    ];

    const [activeTab, setActiveTab] = useState('statistics-listing');
    const [tabs, setTabs] = useState<TabItem[]>([]);

    useEffect(() => {
        setTabs([
            {
                id: 'statistics-listing',
                label: 'Todas',
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

            const newTab: TabItem = {
                id: card.id,
                label: card.title,
                content: card.content,
                removable: true,
            };

            setActiveTab(card.id);
            return [...prevTabs, newTab];
        });
    };

    const handleCloseTab = (id: string) => {
        setTabs((prev) => {
            const newTabs = prev.filter((t) => t.id !== id);
            if (activeTab === id) setActiveTab('statistics-listing');
            return newTabs;
        });
    };

    return (
        <Box p={2}>
            <h1 className="dashboard-module-top-bar-title">{'Estadísticas'}</h1>

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
                            <Box display="flex" alignItems="center">
                                {tab.label}
                                {tab.removable && (
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
                                )}
                            </Box>
                        }
                    />
                ))}
            </Tabs>

            <Box mt={2}>
                {tabs.map(
                    (tab) => tab.id === activeTab && <Box key={tab.id}>{tab.content}</Box>
                )}
            </Box>
        </Box>
    );
};
