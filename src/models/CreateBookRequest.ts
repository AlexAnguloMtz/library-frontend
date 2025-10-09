export type CreateBookRequest = {
    title: string;
    isbn: string;
    authorIds: string[];
    categoryId: string;
    publisherId: string;
    year: number;
    bookPicture: File;
}