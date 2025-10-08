import CloseIcon from "@mui/icons-material/Close";
import { Box, Card, IconButton, Typography } from "@mui/material";
import type { AuthorPreview } from "../../models/AuthorPreview";

export type AuthorCardModel = {
    id: string;
    firstName: string;
    lastName: string;
    country: string;
    dateOfBirth: string;
    bookCount: number;
};

export const toAuthorCardModel = (author: AuthorPreview): AuthorCardModel => {
    return {
        id: author.id,
        firstName: author.firstName,
        lastName: author.lastName,
        country: author.country.name,
        dateOfBirth: author.dateOfBirth,
        bookCount: author.bookCount
    };
};

export function AuthorCard({
    author,
    onRemove,
    showRemoveButton = true,
    hoverStyles = true,
}: {
    author: AuthorCardModel;
    onRemove?: () => void;
    showRemoveButton: boolean;
    hoverStyles?: boolean;
}) {

    const hoverStylesObject = hoverStyles ? {
        "&:hover": {
            bgcolor: "#E0E0E0",
            cursor: "pointer",
        },
    } : {};

    function keyValuePair(key: string, value: string) {
        return (
            <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography sx={{ fontSize: 13, color: "text.secondary", fontWeight: 500 }}>{key}</Typography>
                <Typography sx={{ fontSize: 13 }}>{value}</Typography>
            </Box>
        );
    }

    return (
        <Card variant="outlined" sx={{ ...hoverStylesObject, width: '100%', display: "flex", alignItems: "center", mb: 1, p: 1 }}>
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {author.lastName}, {author.firstName}
                </Typography>
                <Box sx={{ display: "flex", mt: 0.5, gap: 5, flexWrap: "wrap" }}>
                    {keyValuePair("Nacionalidad", author.country)}
                    {keyValuePair("Fecha de nacimiento", author.dateOfBirth)}
                    {keyValuePair("Libros", author.bookCount.toString())}
                </Box>
            </Box>
            {showRemoveButton && (
                <IconButton onClick={() => onRemove?.()} sx={{ color: "error.main" }} size="small">
                    <CloseIcon fontSize="small" />
                </IconButton>
            )}
        </Card>
    );
}