import type { BookFormData } from "../components/BookFormModal/BookFormModal";
import type { AuthorResponse } from "./AuthorResponse";
import type { BookCategoryMinimalResponse } from "./BookCategoryMinimalResponse";
import type { PublisherMinimalResponse } from "./PublisherMinimalResponse";

export type BookDetailsResponse = {
    id: string;
    title: string;
    isbn: string;
    authors: AuthorResponse[];
    category: BookCategoryMinimalResponse;
    publisher: PublisherMinimalResponse;
    year: number;
    imageUrl: string;
};

export function fromDtoToFormValues(dto: BookDetailsResponse): BookFormData {
    return {
        title: dto.title,
        year: dto.year.toString(),
        isbn: dto.isbn,
        authors: dto.authors.map((author: AuthorResponse) => ({
            id: author.id,
            firstName: author.firstName,
            lastName: author.lastName,
            country: author.country.name,
            dateOfBirth: author.dateOfBirth,
            bookCount: author.bookCount,
        })),
        categoryId: dto.category.id,
        publisherId: dto.publisher.id,
    };
}