import type { PopularAuthorsResponse } from "../models/PopularAuthorsResponse";
import type { PopularBookCategoriesResponse } from "../models/PopularBookCategoriesResponse";
import apiClient from "./ApiClient";

class ReportsService {

    async getBookLoansReport(): Promise<Blob> {
        const response = await apiClient.get<Response>(`/api/v1/reports/books`);
        return await response.blob();
    }

    async getPopularBookCategories(): Promise<PopularBookCategoriesResponse[]> {
        return apiClient.get<PopularBookCategoriesResponse[]>("/api/v1/reports/popular-book-categories");
    }

    async getPopularAuthors(): Promise<PopularAuthorsResponse[]> {
        return apiClient.get<PopularAuthorsResponse[]>("/api/v1/reports/popular-authors");
    }
}

export default new ReportsService();