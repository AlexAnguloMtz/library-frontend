import type { SortRequest } from "./SortRequest";

export type PaginationRequest = {
    page?: number;
    size?: number;
    sorts?: SortRequest[]
}