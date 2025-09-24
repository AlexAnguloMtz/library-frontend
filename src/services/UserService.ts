import type { PaginationRequest } from "../models/PaginationRequest";
import type { PaginationResponse } from "../models/PaginationResponse";
import type { UserPreview } from "../models/UserPreview";
import type { UserPreviewsQuery } from "../models/UserPreviewQuery";
import { appConfig } from "../config/AppConfig"; 
import * as paginationRequest from '../models/PaginationRequest';
import * as userPreviewsQuery from '../models/UserPreviewQuery';
import * as URLSearchParamsHelpers from '../util/URLSearchParamsHelpers';
import authenticationHelper from "../util/AuthenticationHelper";
import type { UserFiltersResponse } from "../models/UserFiltersResponse";
import type { FullUser } from "../models/FullUser";

class UserService {
    async getUsersPreviews(query: UserPreviewsQuery, pagination: PaginationRequest): Promise<PaginationResponse<UserPreview>> {
        const queryString = userPreviewsQueryString(query, pagination);

        const url = `${appConfig.apiUrl}/api/v1/users?${queryString}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error al obtener usuarios: ${response.statusText}`);
        }

        const users: PaginationResponse<UserPreview> = await response.json();
        
        return users;
    }

    async getUserFilters(): Promise<UserFiltersResponse> {
        const url = `${appConfig.apiUrl}/api/v1/users/filters`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error al obtener filtros de usuarios: ${response.statusText}`);
        }

        const filters: UserFiltersResponse = await response.json();
    
        return filters;
    }

    async getFullUserById(id: string): Promise<FullUser> {
        const url = `${appConfig.apiUrl}/api/v1/users/${id}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error al obtener usuario: ${response.statusText}`);
        }

        const user: FullUser = await response.json();

        return user;
    }

    async deleteUserById(id: string): Promise<void> {
        const url = `${appConfig.apiUrl}/api/v1/users/${id}`;
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error al eliminar usuario: ${response.statusText}`);
        }

        return;
    }
}

function userPreviewsQueryString(query: UserPreviewsQuery, pagination: PaginationRequest): string {
    const filtersParams: URLSearchParams = userPreviewsQuery.toURLSearchParams(query);
    const paginationParams: URLSearchParams = paginationRequest.toURLSearchParams(pagination); 
    const finalParams: URLSearchParams = URLSearchParamsHelpers.merge([filtersParams, paginationParams]);
    return finalParams.toString();
}

export default new UserService();