import type { PaginationRequest } from "../models/PaginationRequest";
import type { PaginationResponse } from "../models/PaginationResponse";
import type { AuthorPreview } from "../models/AuthorPreview";
import type { GetAuthorPreviewsRequest } from "../models/GetAuthorPreviewsRequest";
import type { AuthorOptions } from "../models/AuthorOptions";
import type { UpdateAuthorRequest } from "../models/UpdateAuthorRequest";
import type { AuthorResponse } from "../models/AuthorResponse";
import * as paginationRequest from '../models/PaginationRequest';
import * as getAuthorPreviewsRequest from '../models/GetAuthorPreviewsRequest';
import * as URLSearchParamsHelpers from '../util/URLSearchParamsHelpers';
import { datePartString } from "../util/DateHelper";
import apiClient from "./ApiClient";

class AuthorService {
    async getAuthorPreviews(filters: GetAuthorPreviewsRequest, pagination: PaginationRequest): Promise<PaginationResponse<AuthorPreview>> {
        const queryString = authorPreviewsQueryString(filters, pagination);
        return apiClient.get(`/api/v1/authors?${queryString}`);
    }

    async getAuthorOptions(): Promise<AuthorOptions> {
        return apiClient.get(`/api/v1/authors/options`);
    }

    async updateAuthor(id: string, request: UpdateAuthorRequest): Promise<AuthorResponse> {
        const requestToSend = {
            firstName: request.firstName,
            lastName: request.lastName,
            dateOfBirth: datePartString(request.dateOfBirth),
            countryId: request.countryId
        }
        return apiClient.put(`/api/v1/authors/${id}`, requestToSend);
    }

    async createAuthor(request: UpdateAuthorRequest): Promise<AuthorResponse> {
        const requestToSend = {
            firstName: request.firstName,
            lastName: request.lastName,
            dateOfBirth: datePartString(request.dateOfBirth),
            countryId: request.countryId
        }
        return apiClient.post(`/api/v1/authors`, requestToSend);
    }

    async deleteById(id: string): Promise<void> {
        return apiClient.delete(`/api/v1/authors/${id}`);
    }

    async exportAuthors(ids: string[]): Promise<Blob> {
        const request = {
            format: "pdf",
            ids
        }
        const response = await apiClient.post<Response>(`/api/v1/authors/export`, request);
        return response.blob();
    }
}

function authorPreviewsQueryString(query: GetAuthorPreviewsRequest, pagination: PaginationRequest): string {
    const filtersParams: URLSearchParams = getAuthorPreviewsRequest.toURLSearchParams(query);
    const paginationParams: URLSearchParams = paginationRequest.toURLSearchParams(pagination); 
    const finalParams: URLSearchParams = URLSearchParamsHelpers.merge([filtersParams, paginationParams]);
    return finalParams.toString();
}

export default new AuthorService();
