import type { BookFormData } from "../components/BookFormModal/BookFormModal";

export type UpdateBookRequest = {
    title?: string;
    isbn?: string;
    authorIds?: string[];
    categoryId?: string;
    year?: number;
    bookPicture?: File;
};


export function toUpdateDto(form: BookFormData, imageFile: File | null): UpdateBookRequest {
    return {
        title: form.title,
        year: parseInt(form.year),
        isbn: form.isbn,
        authorIds: form.authors.map((author) => author.id),
        categoryId: form.categoryId,
        bookPicture: imageFile || undefined,
    };
}
