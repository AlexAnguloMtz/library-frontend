import type { PaginationRequest } from '../models/PaginationRequest';
import type { PaginationResponse } from '../models/PaginationResponse';
import * as paginationRequest from '../models/PaginationRequest';
import * as URLSearchParamsHelpers from '../util/URLSearchParamsHelpers';
import apiClient from './ApiClient';
import type { AuditEventResponse } from '../models/AuditEventResponse';
import type { GetAuditEventsRequest } from '../models/GetAuditEventsRequest';
import * as getAuditEventsRequest from '../models/GetAuditEventsRequest';
import type { AuditResourceTypeResponse } from '../models/AuditResourceTypeResponse';
import type { FullAuditEventResponse } from '../models/FullAuditEventResponse';

class AuditService {
    async getAuditEvents(filters: GetAuditEventsRequest, pagination: PaginationRequest): Promise<PaginationResponse<AuditEventResponse>> {
        const filtersQuery = getAuditEventsRequest.toURLSearchParams(filters);
        const paginationQuery = paginationRequest.toURLSearchParams(pagination);
        const queryString = URLSearchParamsHelpers.merge([filtersQuery, paginationQuery]);
        const data = await apiClient.get<PaginationResponse<AuditEventResponse>>(`/api/v1/audit/events${queryString ? `?${queryString}` : ''}`);
        const parsedData: PaginationResponse<AuditEventResponse> = { ...data, items: data.items.map(parseAuditEventJson) };
        return parsedData;
    }

    async getResourceTypes(): Promise<AuditResourceTypeResponse[]> {
        return await apiClient.get<AuditResourceTypeResponse[]>(`/api/v1/audit/resource-types`);
    }

    async getAuditEventById(id: string): Promise<FullAuditEventResponse> {
        const data: any = await apiClient.get<any>(`/api/v1/audit/events/${id}`);
        return parseAuditEventJson(data);
    }

}

const parseAuditEventJson = (json: any) => {
    return {
        ...json,
        occurredAt: new Date(json.occurredAt)
    };
}

export default new AuditService();