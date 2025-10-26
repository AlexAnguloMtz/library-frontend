import type { BookCategoryPopularityResponse } from "../models/BookCategoryPopularityResponse";
import apiClient from "./ApiClient";
import type { AuthorPopularityResponse } from "../models/AuthorPopularityResponse";
import type { PopularityRequest } from "../models/PopularityRequest";
import * as popularityRequest from "../models/PopularityRequest";
import type { UsersAcquisitionResponse } from "../models/UsersAcquisitionResponse";
import type { UsersDemographyResponse } from "../models/UsersDemographyResponse";
import type { LoansDistributionResponse } from "../models/LoansDistributionResponse";
import type { PublisherPopularityResponse } from "../models/PublisherPopularityResponse";
import type { BookPopularityResponse } from "../models/BookPopularityResponse";

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

    async getBooksPopularity(request: PopularityRequest): Promise<BookPopularityResponse[]> {
        const query = popularityRequest.toURLSearchParams(request);
        return apiClient.get<BookPopularityResponse[]>(`/api/v1/reports/books-popularity${query.toString() ? `?${query.toString()}` : ''}`);
    }

    async getBookCategoriesPopularity(request: PopularityRequest): Promise<BookCategoryPopularityResponse[]> {
        const query = popularityRequest.toURLSearchParams(request);
        return apiClient.get<BookCategoryPopularityResponse[]>(`/api/v1/reports/book-categories-popularity${query.toString() ? `?${query.toString()}` : ''}`);
    }

    async getAuthorsPopularity(request: PopularityRequest): Promise<AuthorPopularityResponse[]> {
        const query = popularityRequest.toURLSearchParams(request);
        return apiClient.get<AuthorPopularityResponse[]>(`/api/v1/reports/authors-popularity${query.toString() ? `?${query.toString()}` : ''}`);
    }

    async getPublishersPopularity(request: PopularityRequest): Promise<PublisherPopularityResponse[]> {
        const query = popularityRequest.toURLSearchParams(request);
        return apiClient.get<PublisherPopularityResponse[]>(`/api/v1/reports/publishers-popularity${query.toString() ? `?${query.toString()}` : ''}`);
    }

    async getLoansDistribution(): Promise<LoansDistributionResponse[]> {
        return apiClient.get<LoansDistributionResponse[]>(`/api/v1/reports/loans-distribution`);
    }

}

export default new ReportsService();