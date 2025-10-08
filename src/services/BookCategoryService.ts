import type { GetBookCategoriesRequest } from '../models/GetBookCategoriesRequest';
import type { PaginationRequest } from '../models/PaginationRequest';
import type { PaginationResponse } from '../models/PaginationResponse';
import type { BookCategoryResponse } from '../models/BookCategoryResponse';
import type { BookCategoryRequest } from '../models/BookCategoryRequest';
import * as getBookCategoriesRequest from '../models/GetBookCategoriesRequest';
import * as paginationRequest from '../models/PaginationRequest';
import * as URLSearchParamsHelpers from '../util/URLSearchParamsHelpers';
import apiClient from './ApiClient';
import type { MergeBookCategoriesRequest } from '../models/MergeBookCategoriesRequest';
import type { MergeBookCategoriesResponse } from '../models/MergeBookCategoriesResponse';

class BookCategoryService {
  async getBookCategories(filters: GetBookCategoriesRequest, pagination: PaginationRequest): Promise<PaginationResponse<BookCategoryResponse>> {
    const filtersQuery = getBookCategoriesRequest.toURLSearchParams(filters);
    const paginationQuery = paginationRequest.toURLSearchParams(pagination);
    const queryString = URLSearchParamsHelpers.merge([filtersQuery, paginationQuery]);
    return apiClient.get(`/api/v1/book-categories${queryString ? `?${queryString}` : ''}`);
  }

  async updateBookCategory(id: string, request: BookCategoryRequest): Promise<BookCategoryResponse> {
    return apiClient.put(`/api/v1/book-categories/${id}`, request);
  }

  async createBookCategory(request: BookCategoryRequest): Promise<BookCategoryResponse> {
    return apiClient.post(`/api/v1/book-categories`, request);
  }

  async deleteById(id: string): Promise<void> {
    return apiClient.delete(`/api/v1/book-categories/${id}`);
  }

  async exportBookCategories(ids: string[]): Promise<Blob> {
    const request = {
      format: 'pdf',
      ids
    }
    const response = await apiClient.post<Response>(`/api/v1/book-categories/export`, request);
    return response.blob();
  }

  async mergeBookCategories(request: MergeBookCategoriesRequest): Promise<MergeBookCategoriesResponse> {
    return apiClient.post(`/api/v1/book-categories/merge`, request);
  }

}

export default new BookCategoryService();