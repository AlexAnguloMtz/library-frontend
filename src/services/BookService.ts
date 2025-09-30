import type { GetBooksRequest } from "../models/GetBooksRequest";
import type { PaginationRequest } from "../models/PaginationRequest";
import type { PaginationResponse } from "../models/PaginationResponse";
import type { BookResponse } from "../models/BookResponse";
import * as getBooksRequest from "../models/GetBooksRequest";
import * as paginationRequest from "../models/PaginationRequest";
import * as URLSearchParamsHelpers from "../util/URLSearchParamsHelpers";
import type { BookOptionsResponse } from "../models/BookOptionsResponse";
import apiClient from "./ApiClient";

class BookService {
    async getBooks(request: GetBooksRequest, pagination: PaginationRequest): Promise<PaginationResponse<BookResponse>> {
        const query = toQueryString(request, pagination);
        const url = `/api/v1/books?${query}`;
        return apiClient.get<PaginationResponse<BookResponse>>(url);
    }

    async getBookOptions(): Promise<BookOptionsResponse> {
        return apiClient.get(`/api/v1/books/options`);
    }

    async deleteById(id: string): Promise<void> {
        return apiClient.delete(`/api/v1/books/${id}`);
    }

    async exportBooks(ids: string[]): Promise<Blob> {
        const request = {
            format: "pdf",
            ids
        }
        const response = await apiClient.post<Response>(`/api/v1/books/export`, request);
        return response.blob();
    }
}

function toQueryString(request: GetBooksRequest, pagination: PaginationRequest): string {
    const filtersParams: URLSearchParams = getBooksRequest.toURLSearchParams(request);
    const paginationParams: URLSearchParams = paginationRequest.toURLSearchParams(pagination); 
    const finalParams: URLSearchParams = URLSearchParamsHelpers.merge([filtersParams, paginationParams]);
    return finalParams.toString();
}

export default new BookService();