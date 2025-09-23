import type { PaginationRequest } from "../models/PaginationRequest";
import type { PaginationResponse } from "../models/PaginationResponse";
import type { UserPreview } from "../models/UserPreview";
import type { UserPreviewsQuery } from "../models/UserPreviewQuery";
import { appConfig } from "../config/AppConfig"; 
import * as paginationRequest from '../models/PaginationRequest';
import * as userPreviewsQuery from '../models/UserPreviewQuery';
import * as URLSearchParamsHelpers from '../util/URLSearchParamsHelpers';

class UserService {
    async getUsersPreviews(query: UserPreviewsQuery, pagination: PaginationRequest): Promise<PaginationResponse<UserPreview>> {
        const queryString = userPreviewsQueryString(query, pagination);

        const url = `${appConfig.apiUrl}/api/v1/users?${queryString}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Error al obtener usuarios: ${response.statusText}`);
        }

        const users: PaginationResponse<UserPreview> = await response.json();
        
        return users;
    }
}

function userPreviewsQueryString(query: UserPreviewsQuery, pagination: PaginationRequest): string {
    const filtersParams: URLSearchParams = userPreviewsQuery.toURLSearchParams(query);
    const paginationParams: URLSearchParams = paginationRequest.toURLSearchParams(pagination); 
    const finalParams: URLSearchParams = URLSearchParamsHelpers.merge([filtersParams, paginationParams]);
    return finalParams.toString();
}

export default new UserService();