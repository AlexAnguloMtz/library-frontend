export type BookPopularityResponse = {
    gender: string;
    ageMin: number;
    ageMax: number;
    bookId: string;
    bookIsbn: string;
    bookTitle: string;
    bookImageUrl: string;
    value: number;
};