import type { GetBooksRequest } from "../models/GetBooksRequest";
import type { PaginationRequest } from "../models/PaginationRequest";
import type { PaginationResponse } from "../models/PaginationResponse";
import type { BookSummaryResponse } from "../models/BookSummaryResponse";
import * as getBooksRequest from "../models/GetBooksRequest";
import * as paginationRequest from "../models/PaginationRequest";
import * as URLSearchParamsHelpers from "../util/URLSearchParamsHelpers";
import type { BookOptionsResponse } from "../models/BookOptionsResponse";
import apiClient from "./ApiClient";
import type { BookDetailsResponse } from "../models/BookDetailsResponse";
import type { CreateBookRequest } from "../models/CreateBookRequest";
import type { UpdateBookRequest } from "../models/UpdateBookRequest";
import type { BookAvailabilityDetailsResponse } from "../models/BookAvailabilityDetailsResponse";
import type { GetBookAvailabilityRequest } from "../models/GetBookAvailabilityRequest";
import * as getBookAvailabilityRequest from "../models/GetBookAvailabilityRequest";

class BookService {
    async getBooks(request: GetBooksRequest, pagination: PaginationRequest): Promise<PaginationResponse<BookSummaryResponse>> {
        const query = toQueryString(request, pagination);
        const url = `/api/v1/books?${query}`;
        return apiClient.get<PaginationResponse<BookSummaryResponse>>(url);
    }

    async getBookOptions(): Promise<BookOptionsResponse> {
        return apiClient.get(`/api/v1/books/options`);
    }

    async getBookById(id: string): Promise<BookDetailsResponse> {
        return await apiClient.get(`/api/v1/books/${id}`);
    }

    async createBook(request: CreateBookRequest): Promise<BookDetailsResponse> {
        const formData = new FormData();
        formData.append('title', request.title);
        formData.append('isbn', request.isbn);
        formData.append('authorIds', request.authorIds.join(','));
        formData.append('categoryId', request.categoryId);
        formData.append('publisherId', request.publisherId);
        formData.append('year', request.year.toString());
        formData.append('bookPicture', request.bookPicture);

        return apiClient.post(`/api/v1/books`, formData);
    }

    async updateBook(id: string, request: UpdateBookRequest): Promise<BookDetailsResponse> {
        const formData = new FormData();
        if (request.title) {
            formData.append('title', request.title);
        }
        if (request.isbn) {
            formData.append('isbn', request.isbn);
        }
        if (request.authorIds) {
            formData.append('authorIds', request.authorIds.join(','));
        }
        if (request.categoryId) {
            formData.append('categoryId', request.categoryId);
        }
        if (request.publisherId) {
            formData.append('publisherId', request.publisherId);
        }
        if (request.year) {
            formData.append('year', request.year.toString());
        }
        if (request.bookPicture) {
            formData.append('bookPicture', request.bookPicture);
        }
        return apiClient.patch(`/api/v1/books/${id}`, formData);
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

    async getBookAvailabilityDetails(id: string, request: GetBookAvailabilityRequest): Promise<BookAvailabilityDetailsResponse> {
        const query: string = getBookAvailabilityRequest.toURLSearchParams(request).toString();
        return apiClient.get(`/api/v1/books/${id}/availability?${query}`);
    }

}

function toQueryString(request: GetBooksRequest, pagination: PaginationRequest): string {
    const filtersParams: URLSearchParams = getBooksRequest.toURLSearchParams(request);
    const paginationParams: URLSearchParams = paginationRequest.toURLSearchParams(pagination);
    const finalParams: URLSearchParams = URLSearchParamsHelpers.merge([filtersParams, paginationParams]);
    return finalParams.toString();
}

export default new BookService();