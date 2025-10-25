import type { BookCategoryPopularityResponse } from "../models/BookCategoryPopularityResponse";
import apiClient from "./ApiClient";
import type { BookCategoriesPopularityRequest } from "../models/BookCategoriesPopularityRequest";
import * as bookCategoriesPopularityRequest from "../models/BookCategoriesPopularityRequest";
import * as authorsPopularityRequest from "../models/AuthorsPopularityRequest";
import type { AuthorPopularityResponse } from "../models/AuthorPopularityResponse";
import type { AuthorsPopularityRequest } from "../models/AuthorsPopularityRequest";
import type { UsersAcquisitionResponse } from "../models/UsersAcquisitionResponse";
import type { UsersDemographyResponse } from "../models/UsersDemographyResponse";
import type { LoansDistributionResponse } from "../models/LoansDistributionResponse";

class ReportsService {

    async getBookLoansReport(): Promise<Blob> {
        const response = await apiClient.get<Response>(`/api/v1/reports/books`);
        return await response.blob();
    }

    async getUsersAcquisition(): Promise<UsersAcquisitionResponse[]> {
        return apiClient.get<UsersAcquisitionResponse[]>(`/api/v1/reports/users-acquisition`);
    }

    async getUsersDemography(): Promise<UsersDemographyResponse[]> {
        return apiClient.get<UsersDemographyResponse[]>(`/api/v1/reports/users-demography`);
    }

    async getBookCategoriesPopularity(request: BookCategoriesPopularityRequest): Promise<BookCategoryPopularityResponse[]> {
        const query = bookCategoriesPopularityRequest.toURLSearchParams(request);
        return apiClient.get<BookCategoryPopularityResponse[]>(`/api/v1/reports/book-categories-popularity${query.toString() ? `?${query.toString()}` : ''}`);
    }

    async getAuthorsPopularity(request: AuthorsPopularityRequest): Promise<AuthorPopularityResponse[]> {
        const query = authorsPopularityRequest.toURLSearchParams(request);
        return apiClient.get<AuthorPopularityResponse[]>(`/api/v1/reports/authors-popularity${query.toString() ? `?${query.toString()}` : ''}`);
    }

    async getLoansDistribution(): Promise<LoansDistributionResponse[]> {
        return apiClient.get<LoansDistributionResponse[]>(`/api/v1/reports/loans-distribution`);
    }

}

export default new ReportsService();