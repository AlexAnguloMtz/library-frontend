import type { GetBooksRequest } from "../models/GetBooksRequest";
import { appConfig } from "../config/AppConfig";
import type { PaginationRequest } from "../models/PaginationRequest";
import type { PaginationResponse } from "../models/PaginationResponse";
import type { BookResponse } from "../models/BookResponse";
import * as getBooksRequest from "../models/GetBooksRequest";
import * as paginationRequest from "../models/PaginationRequest";
import * as URLSearchParamsHelpers from "../util/URLSearchParamsHelpers";
import authenticationHelper from "../util/AuthenticationHelper";
import { ProblemDetailError } from "../models/ProblemDetail";
import { unknownErrorProblemDetail } from "../models/ProblemDetail";
import type { BookOptionsResponse } from "../models/BookOptionsResponse";


class BookService {
    async getBooks(request: GetBooksRequest, pagination: PaginationRequest): Promise<PaginationResponse<BookResponse>> {
        try {
            const query = toQueryString(request, pagination);
            const url = `${appConfig.apiUrl}/api/v1/books?${query}`;
            
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

            const books: PaginationResponse<BookResponse> = await response.json();
            
            return books;
        } catch (error) {
            if (error instanceof ProblemDetailError) {
                throw error;
            }
            throw unknownErrorProblemDetail();
        }
    }

    async getBookOptions(): Promise<BookOptionsResponse> {
        try {
        const url = `${appConfig.apiUrl}/api/v1/books/options`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`
            }
        });

        if (!response.ok) {
            const problemDetail = await response.json();
            throw new ProblemDetailError(problemDetail);
        }

        const filters: BookOptionsResponse = await response.json();
    
        return filters;
        } catch (error) {
            if (error instanceof ProblemDetailError) {
                throw error;
            }
            throw unknownErrorProblemDetail();
        }
    }

    async deleteById(id: string): Promise<void> {
        try {
            const url = `${appConfig.apiUrl}/api/v1/books/${id}`;
            
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

    async exportBooks(ids: string[]): Promise<Blob> {
        try {
            const response = await fetch(`${appConfig.apiUrl}/api/v1/books/export`, {
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

function toQueryString(request: GetBooksRequest, pagination: PaginationRequest): string {
    const filtersParams: URLSearchParams = getBooksRequest.toURLSearchParams(request);
    const paginationParams: URLSearchParams = paginationRequest.toURLSearchParams(pagination); 
    const finalParams: URLSearchParams = URLSearchParamsHelpers.merge([filtersParams, paginationParams]);
    return finalParams.toString();
}

export default new BookService();