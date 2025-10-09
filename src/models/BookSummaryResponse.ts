import type { BookAvailabilityResponse } from "./BookAvailabilityResponse";

export type BookSummaryResponse = {
    id: string;
    title: string;
    isbn: string;
    authors: string[];
    category: string;
    publisher: string;
    year: number;
    imageUrl: string;
    availability: BookAvailabilityResponse;
}