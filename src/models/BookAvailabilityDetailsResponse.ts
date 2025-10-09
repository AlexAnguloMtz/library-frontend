import type { BookCopyResponse } from "./BookCopyResponse";

export type BookAvailabilityDetailsResponse = {
    total: number;
    available: number;
    borrowed: number;
    copies: BookCopyResponse[]
}