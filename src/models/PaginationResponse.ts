export type PaginationResponse<T> = {
    items: T[];
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
}