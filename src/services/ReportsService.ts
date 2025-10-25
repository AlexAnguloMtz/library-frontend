import type { PopularAuthorsResponse } from "../models/PopularAuthorsResponse";
import type { BookCategoryPopularityResponse } from "../models/BookCategoryPopularityResponse";
import apiClient from "./ApiClient";
import type { BookCategoriesPopularityRequest } from "../models/BookCategoriesPopularityRequest";
import * as bookCategoriesPopularityRequest from "../models/BookCategoriesPopularityRequest";

class ReportsService {

    async getBookLoansReport(): Promise<Blob> {
        const response = await apiClient.get<Response>(`/api/v1/reports/books`);
        return await response.blob();
    }

    async getBookCategoriesPopularity(request: BookCategoriesPopularityRequest): Promise<BookCategoryPopularityResponse[]> {
        const query = bookCategoriesPopularityRequest.toURLSearchParams(request);
        return apiClient.get<BookCategoryPopularityResponse[]>(`/api/v1/reports/book-categories-popularity${query.toString() ? `?${query.toString()}` : ''}`);
    }

    async getPopularAuthors(): Promise<PopularAuthorsResponse[]> {
        return apiClient.get<PopularAuthorsResponse[]>("/api/v1/reports/popular-authors");
    }
}

export default new ReportsService();