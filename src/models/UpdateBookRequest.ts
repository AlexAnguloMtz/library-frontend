export type UpdateBookRequest = {
    title?: string;
    isbn?: string;
    authorIds?: string[];
    categoryId?: string;
    year?: number;
    bookPicture?: File;
};