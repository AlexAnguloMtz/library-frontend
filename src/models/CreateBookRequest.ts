export type CreateBookRequest = {
    title: string;
    isbn: string;
    authorIds: string[];
    categoryId: string;
    year: number;
    image: File;
}