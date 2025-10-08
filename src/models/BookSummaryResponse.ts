import type { BookAvailabilityResponse } from "./BookAvailabilityResponse";

export type BookSummaryResponse = {
    id: string;
    title: string;
    isbn: string;
    authors: string[];
    category: string;
    year: number;
    imageUrl: string;
    availability: BookAvailabilityResponse;
}