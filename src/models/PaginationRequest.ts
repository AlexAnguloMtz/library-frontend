import type { SortRequest } from "./SortRequest";
import * as sortRequest from './SortRequest';

export type PaginationRequest = {
    page?: number;
    size?: number;
    sorts?: SortRequest[]
}

export function toURLSearchParams(paginationRequest: PaginationRequest): URLSearchParams {
    const params: URLSearchParams = new URLSearchParams();
 
    if (!paginationRequest) {
        return params;
    }

    if (paginationRequest.page !== undefined) {
        params.append("page", paginationRequest.page.toString());
    }

    if (paginationRequest.size !== undefined) {
        params.append("size", paginationRequest.size.toString());
    }

    if (paginationRequest.sorts) {
        paginationRequest.sorts.forEach(sort => {
            params.append("sort", sortRequest.toUrlParam(sort))
        });
    }

    return params;
}