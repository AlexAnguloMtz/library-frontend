import { appConfig } from '../config/AppConfig';
import authenticationHelper from '../util/AuthenticationHelper';
import type { GetBookCategoriesRequest } from '../models/GetBookCategoriesRequest';
import type { PaginationRequest } from '../models/PaginationRequest';
import type { PaginationResponse } from '../models/PaginationResponse';
import type { BookCategoryResponse } from '../models/BookCategoryResponse';
import type { BookCategoryRequest } from '../models/BookCategoryRequest';
import type { ProblemDetail } from '../models/ProblemDetail';
import { ProblemDetailError } from '../models/ProblemDetail';
import * as getBookCategoriesRequest from '../models/GetBookCategoriesRequest';
import * as paginationRequest from '../models/PaginationRequest';
import * as URLSearchParamsHelpers from '../util/URLSearchParamsHelpers';

const unknownErrorProblemDetail = (): ProblemDetail => ({
  type: 'about:blank',
  title: 'Internal Server Error',
  status: 500,
  detail: 'An unexpected error occurred',
  instance: ''
});

class BookCategoryService {
  async getBookCategories(filters: GetBookCategoriesRequest, pagination: PaginationRequest): Promise<PaginationResponse<BookCategoryResponse>> {
    try {
      const filtersQuery = getBookCategoriesRequest.toURLSearchParams(filters);
      const paginationQuery = paginationRequest.toURLSearchParams(pagination);
      const queryString = URLSearchParamsHelpers.merge([filtersQuery, paginationQuery]);
      
      const url = `${appConfig.apiUrl}/api/v1/book-categories${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const problemDetail = await response.json();
        throw new ProblemDetailError(problemDetail);
      }

      return await response.json();

    } catch (error) {
      if (error instanceof ProblemDetailError) {
        throw error;
      }
      throw unknownErrorProblemDetail();
    }
  }

  async updateBookCategory(id: string, request: BookCategoryRequest): Promise<BookCategoryResponse> {
    try {
      const response = await fetch(`${appConfig.apiUrl}/api/v1/book-categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`
        },
        body: JSON.stringify(request),
        credentials: 'include'
      });

      if (!response.ok) {
        const problemDetail = await response.json();
        throw new ProblemDetailError(problemDetail);
      }

      return await response.json();

    } catch (error) {
      if (error instanceof ProblemDetailError) {
        throw error;
      }
      throw unknownErrorProblemDetail();
    }
  }

  async createBookCategory(request: BookCategoryRequest): Promise<BookCategoryResponse> {
    try {
      const response = await fetch(`${appConfig.apiUrl}/api/v1/book-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`
        },
        body: JSON.stringify(request),
        credentials: 'include'
      });

      if (!response.ok) {
        const problemDetail = await response.json();
        throw new ProblemDetailError(problemDetail);
      }

      return await response.json();

    } catch (error) {
      if (error instanceof ProblemDetailError) {
        throw error;
      }
      throw unknownErrorProblemDetail();
    }
  }

  async deleteById(id: string): Promise<void> {
    try {
      const response = await fetch(`${appConfig.apiUrl}/api/v1/book-categories/${id}`, {
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

    } catch (error) {
      if (error instanceof ProblemDetailError) {
        throw error;
      }
      throw unknownErrorProblemDetail();
    }
  }

  async exportBookCategories(ids: string[]): Promise<Blob> {
    try {
      const response = await fetch(`${appConfig.apiUrl}/api/v1/book-categories/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`
        },
        body: JSON.stringify({
          format: 'pdf',
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

export default new BookCategoryService();
