import type { AuthorResponse } from "./AuthorResponse";
import type { BookCategoryMinimalResponse } from "./BookCategoryMinimalResponse";

export type BookDetailsResponse = {
    id: string;
    title: string;
    isbn: string;
    authors: AuthorResponse[];
    category: BookCategoryMinimalResponse;
    year: number;
    pictureUrl: string;
};