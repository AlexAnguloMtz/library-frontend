import type { CountryResponse } from "./CountryResponse";

export type AuthorResponse = {
    id: string;
    firstName: string;
    lastName: string;
    country: CountryResponse;
    dateOfBirth: string;
    bookCount: number;
};
