import React, { useState, useEffect, type JSX } from 'react';
import { Box, Tabs, Tab, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CategoryIcon from '@mui/icons-material/Category';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import PersonIcon from '@mui/icons-material/Person';
import MenuBookIcon from '@mui/icons-material/MenuBook';

import { StatisticsListing } from './StatisticsListing/StatisticsListing';
import { PopularCategories, type PopularCategoriesData } from './PopularCategories/PopularCategories';
import { PopularAuthors } from './PopularAuthors/PopularAuthors';
import { PopularityByCategory } from './PopularityByCategory/PopularityByCategory';
import { UsersAcquisition } from './UsersAcquisition/UsersAcquisition';
import { UsersDemography } from './UsersDemography/UsersDemography';
import { LoansDistribution } from './LoansDistribution/LoansDistibution';

import type { AuthorPopularityResponse } from '../../models/AuthorPopularityResponse';
import type { UsersAcquisitionResponse } from '../../models/UsersAcquisitionResponse';
import type { UsersDemographyResponse } from '../../models/UsersDemographyResponse';
import type { BookCategoryPopularityResponse } from '../../models/BookCategoryPopularityResponse';
import type { LoansDistributionResponse } from '../../models/LoansDistributionResponse';
import { Button } from '../../components/Button';

type TabItem = {
    id: string;
    title: string;
    content: React.ReactNode;
    removable: boolean;
    icon: JSX.Element;
};

type TabsData = {
    popularAuthors?: AuthorPopularityResponse[];
    usersAcquisition?: UsersAcquisitionResponse[];
    usersDemography?: UsersDemographyResponse[];
    popularCategories?: PopularCategoriesData;
    popularityByCategory?: BookCategoryPopularityResponse[];
    loansDistribution?: LoansDistributionResponse[];
};

export const Statistics = () => {
    const [tabs, setTabs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('statistics-listing');
    const [tabsData, setTabsData] = useState<TabsData>({});

    const makeOnDataReady = <K extends keyof TabsData>(key: K) => {
        return (data: TabsData[K]) => {
            setTabsData((state) => ({ ...state, [key]: data }));
        };
    };

    const cards: TabItem[] = [
        {
            id: 'users-acquisition',
            title: 'Adquisición de usuarios',
            content: (
                <UsersAcquisition
                    data={tabsData.usersAcquisition}
                    onDataReady={makeOnDataReady('usersAcquisition')}
                />
            ),
            removable: true,
            icon: <PersonIcon />
        },
        {
            id: 'users-demography',
            title: 'Demografía de usuarios',
            content: (
                <UsersDemography
                    data={tabsData.usersDemography}
                    onDataReady={makeOnDataReady('usersDemography')}
                />
            ),
            removable: true,
            icon: <PersonIcon />
        },
        {
            id: 'popular-authors',
            title: 'Autores más populares',
            content: (
                <PopularAuthors
                    data={tabsData.popularAuthors}
                    onDataReady={makeOnDataReady('popularAuthors')}
                />
            ),
            removable: true,
            icon: <PersonSearchIcon />
        },
        {
            id: 'popular-categories',
            title: 'Categorías más populares',
            content: (
                <PopularCategories
                    data={tabsData.popularCategories}
                    onDataReady={makeOnDataReady('popularCategories')}
                />
            ),
            removable: true,
            icon: <CategoryIcon />
        },
        {
            id: 'popularity-by-category',
            title: 'Popularidad por categoría',
            content: (
                <PopularityByCategory
                    data={tabsData.popularityByCategory}
                    onDataReady={makeOnDataReady('popularityByCategory')}
                />
            ),
            removable: true,
            icon: <CategoryIcon />
        },
        {
            id: 'loans-distribution',
            title: 'Distribución de préstamos',
            content: (
                <LoansDistribution
                    data={tabsData.loansDistribution}
                    onDataReady={makeOnDataReady('loansDistribution')}
                />
            ),
            removable: true,
            icon: <MenuBookIcon />
        }
    ];

    useEffect(() => {
        // Tab principal "Todas"
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
        if (activeTab === id) {
            setActiveTab('statistics-listing');
        }
    };

    const handleCloseTabs = () => {
        setTabs((prev) => prev.filter((t) => t.id === 'statistics-listing'));
        setActiveTab('statistics-listing');
        setTabsData({});
    }

    return (
        <Box p={2}>
            <Box display={'flex'} gap={3} alignItems={'center'}>
                <h1 className="dashboard-module-top-bar-title">Estadísticas</h1>
                <Button
                    type={'secondary'}
                    variant='outlined'
                    onClick={handleCloseTabs}
                    disabled={tabs.length < 2}
                >
                    Cerrar pestañas
                </Button>
            </Box>
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
                {tabs.map((tab) => (
                    <Box
                        key={tab.id}
                        style={{ display: tab.id === activeTab ? 'block' : 'none' }}
                    >
                        {tab.content}
                    </Box>
                ))}
            </Box>
        </Box>
    );
};
