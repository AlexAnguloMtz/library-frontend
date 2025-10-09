import type { PaginationRequest } from '../models/PaginationRequest';
import type { PaginationResponse } from '../models/PaginationResponse';
import * as paginationRequest from '../models/PaginationRequest';
import * as URLSearchParamsHelpers from '../util/URLSearchParamsHelpers';
import apiClient from './ApiClient';
import type { MergePublishersRequest } from '../models/MergePublishersRequest';
import type { MergePublishersResponse } from '../models/MergePublishersResponse';
import type { PublisherRequest } from '../models/PublisherRequest';
import type { PublisherResponse } from '../models/PublisherResponse';
import type { GetPublishersRequest } from '../models/GetPublishersRequest';
import * as getPublishersRequest from '../models/GetPublishersRequest';

class PublisherService {
  async getPublishers(filters: GetPublishersRequest, pagination: PaginationRequest): Promise<PaginationResponse<PublisherResponse>> {
    const filtersQuery = getPublishersRequest.toURLSearchParams(filters);
    const paginationQuery = paginationRequest.toURLSearchParams(pagination);
    const queryString = URLSearchParamsHelpers.merge([filtersQuery, paginationQuery]);
    return apiClient.get(`/api/v1/publishers${queryString ? `?${queryString}` : ''}`);
  }

  async updatePublisher(id: string, request: PublisherRequest): Promise<PublisherResponse> {
    return apiClient.put(`/api/v1/publishers/${id}`, request);
  }

  async createPublisher(request: PublisherRequest): Promise<PublisherResponse> {
    return apiClient.post(`/api/v1/publishers`, request);
  }

  async deleteById(id: string): Promise<void> {
    return apiClient.delete(`/api/v1/publishers/${id}`);
  }

  async exportPublishers(ids: string[]): Promise<Blob> {
    const request = {
      format: 'pdf',
      ids
    }
    const response = await apiClient.post<Response>(`/api/v1/publishers/export`, request);
    return response.blob();
  }

  async mergePublishers(request: MergePublishersRequest): Promise<MergePublishersResponse> {
    return apiClient.post(`/api/v1/publishers/merge`, request);
  }

}

export default new PublisherService();