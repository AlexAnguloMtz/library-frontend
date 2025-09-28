import type { PaginationRequest } from "../models/PaginationRequest";
import type { PaginationResponse } from "../models/PaginationResponse";
import type { AuthorPreview } from "../models/AuthorPreview";
import type { GetAuthorPreviewsRequest } from "../models/GetAuthorPreviewsRequest";
import type { AuthorOptions } from "../models/AuthorOptions";
import type { UpdateAuthorRequest } from "../models/UpdateAuthorRequest";
import type { AuthorResponse } from "../models/AuthorResponse";
import { appConfig } from "../config/AppConfig"; 
import * as paginationRequest from '../models/PaginationRequest';
import * as getAuthorPreviewsRequest from '../models/GetAuthorPreviewsRequest';
import * as URLSearchParamsHelpers from '../util/URLSearchParamsHelpers';
import authenticationHelper from "../util/AuthenticationHelper";
import { ProblemDetailError, unknownErrorProblemDetail } from "../models/ProblemDetail";
import { datePartString } from "../util/DateHelper";

class AuthorService {
    async getAuthorPreviews(filters: GetAuthorPreviewsRequest, pagination: PaginationRequest): Promise<PaginationResponse<AuthorPreview>> {
        try {   
            const queryString = authorPreviewsQueryString(filters, pagination);

            const url = `${appConfig.apiUrl}/api/v1/authors?${queryString}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const problemDetail = await response.json();
                throw new ProblemDetailError(problemDetail);
            }

            const authors: PaginationResponse<AuthorPreview> = await response.json();
            
            return authors;
        } catch (error) {
            if (error instanceof ProblemDetailError) {
                throw error;
            }
            throw unknownErrorProblemDetail();
        }
    }

    async getAuthorOptions(): Promise<AuthorOptions> {
        try {
            const url = `${appConfig.apiUrl}/api/v1/authors/options`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const problemDetail = await response.json();
                throw new ProblemDetailError(problemDetail);
            }

            const options: AuthorOptions = await response.json();
            
            return options;
        } catch (error) {
            if (error instanceof ProblemDetailError) {
                throw error;
            }
            throw unknownErrorProblemDetail();
        }
    }

    async updateAuthor(id: string, request: UpdateAuthorRequest): Promise<AuthorResponse> {
        try {
            const url = `${appConfig.apiUrl}/api/v1/authors/${id}`;
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstName: request.firstName,
                    lastName: request.lastName,
                    dateOfBirth: datePartString(request.dateOfBirth),
                    countryId: request.countryId
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                const problemDetail = await response.json();
                throw new ProblemDetailError(problemDetail);
            }

            const author: AuthorResponse = await response.json();
            
            return author;
        } catch (error) {
            if (error instanceof ProblemDetailError) {
                throw error;
            }
            throw unknownErrorProblemDetail();
        }
    }

    async createAuthor(request: UpdateAuthorRequest): Promise<AuthorResponse> {
        try {
            const url = `${appConfig.apiUrl}/api/v1/authors`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstName: request.firstName,
                    lastName: request.lastName,
                    dateOfBirth: datePartString(request.dateOfBirth),
                    countryId: request.countryId
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                const problemDetail = await response.json();
                throw new ProblemDetailError(problemDetail);
            }

            const author: AuthorResponse = await response.json();
            
            return author;
        } catch (error) {
            if (error instanceof ProblemDetailError) {
                throw error;
            }
            throw unknownErrorProblemDetail();
        }
    }

    async deleteById(id: string): Promise<void> {
        try {
            const url = `${appConfig.apiUrl}/api/v1/authors/${id}`;
            
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const problemDetail = await response.json();
                throw new ProblemDetailError(problemDetail);
            }

            // No hay body en la respuesta, solo código 2XX
        } catch (error) {
            if (error instanceof ProblemDetailError) {
                throw error;
            }
            throw unknownErrorProblemDetail();
        }
    }

    async exportAuthors(ids: string[]): Promise<Blob> {
        try {
            const response = await fetch(`${appConfig.apiUrl}/api/v1/authors/export`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`
                },
                body: JSON.stringify({
                    format: "pdf",
                    ids
                }),
                credentials: 'include'
            });
        
            if (!response.ok) {
                const problemDetail = await response.json();
                throw new ProblemDetailError(problemDetail);
            }
        
            return await response.blob();

        } catch (error) {
            if (error instanceof ProblemDetailError) {
                throw error;
            }
            throw unknownErrorProblemDetail();
        }
    }
}

function authorPreviewsQueryString(query: GetAuthorPreviewsRequest, pagination: PaginationRequest): string {
    const filtersParams: URLSearchParams = getAuthorPreviewsRequest.toURLSearchParams(query);
    const paginationParams: URLSearchParams = paginationRequest.toURLSearchParams(pagination); 
    const finalParams: URLSearchParams = URLSearchParamsHelpers.merge([filtersParams, paginationParams]);
    return finalParams.toString();
}

export default new AuthorService();
