import React, { type JSX } from 'react';
import './styles.css';
import { Box, Card, Typography, Avatar } from '@mui/material';

const ListingCard: React.FC<ListingCardProps> = ({
    title,
    icon,
    onClick
}: ListingCardProps) => {
    const defaultBg = '#fff';
    const hoverBg = '#1976d2';
    const textDefault = '#000';
    const textHover = '#fff';
    const avatarColor = '#1976d2';

    return (
        <Card
            onClick={() => onClick()}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1.5,
                bgcolor: defaultBg,
                color: textDefault,
                borderRadius: 3,
                boxShadow: 3,
                transition: 'all 0.2s',
                cursor: 'pointer',
                width: 200,
                height: 140,
                textAlign: 'center',
                '&:hover': {
                    bgcolor: hoverBg,
                    color: textHover,
                    transform: 'scale(1.05)',
                },
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                }}
            >
                <Avatar
                    sx={{
                        bgcolor: avatarColor,
                        width: 48,
                        height: 48,
                        mb: 1,
                    }}
                >
                    {icon}
                </Avatar>
                <Typography variant="subtitle1" sx={{ m: 0 }}>
                    {title}
                </Typography>
            </Box>
        </Card>
    );
};

type StatisticsListingProps = {
    onCardClicked: (id: string) => void;
    cards: StatisticsListingCardProps[]
}

type StatisticsListingCardProps = {
    id: string;
    title: string;
    icon: JSX.Element;
}

type ListingCardProps = {
    id: string;
    title: string;
    icon: JSX.Element;
    onClick: () => void;
}

export const StatisticsListing = ({ onCardClicked, cards }: StatisticsListingProps) => {

    return (
        <Box p={2}>
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    justifyContent: 'flex-start',
                }}
            >
                {cards.map((card, _) => (
                    <ListingCard
                        key={card.id}
                        id={card.id}
                        title={card.title}
                        icon={card.icon}
                        onClick={() => onCardClicked(card.id)}
                    />
                ))}
            </Box>
        </Box>
    );
};
