export type CreateBookResponse = {
    id: string;
    title: string;
    isbn: string;
    authors: string[];
    category: string;
    year: number;
    imageUrl: string;
};