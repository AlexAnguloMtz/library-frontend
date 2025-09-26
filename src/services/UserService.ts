import type { PaginationRequest } from "../models/PaginationRequest";
import type { PaginationResponse } from "../models/PaginationResponse";
import type { UserPreview } from "../models/UserPreview";
import type { UserPreviewsQuery } from "../models/UserPreviewQuery";
import { appConfig } from "../config/AppConfig"; 
import * as paginationRequest from '../models/PaginationRequest';
import * as userPreviewsQuery from '../models/UserPreviewQuery';
import * as URLSearchParamsHelpers from '../util/URLSearchParamsHelpers';
import authenticationHelper from "../util/AuthenticationHelper";
import type { UserOptionsResponse } from "../models/UserOptionsResponse";
import type { FullUser } from "../models/FullUser";
import type { PersonalDataRequest } from "../models/PersonalDataRequest";
import type { PersonalDataResponse } from "../models/PersonalDataResponse";
import type { UserAddressRequest } from "../models/UserAddressRequest";
import type { UserAddressResponse } from "../models/UserAddressResponse";
import type { AccountRequest } from "../models/AccountRequest";
import type { AccountResponse } from "../models/AccountResponse";
import type { CreateUserRequest } from "../models/CreateUserRequest";
import type { CreateUserResponse } from "../models/CreateUserResponse";

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

    async getUserOptions(): Promise<UserOptionsResponse> {
        const url = `${appConfig.apiUrl}/api/v1/users/options`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error al obtener filtros de usuarios: ${response.statusText}`);
        }

        const filters: UserOptionsResponse = await response.json();
    
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

    async updateUserPersonalData(id: string, request: PersonalDataRequest): Promise<PersonalDataResponse> {
        const url = `${appConfig.apiUrl}/api/v1/users/${id}/personal-data`;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            throw new Error(`Error al actualizar datos personales: ${response.statusText}`);
        }

        const data: PersonalDataResponse = await response.json();
        return data;
    }

    async updateUserAddress(id: string, request: UserAddressRequest): Promise<UserAddressResponse> {
        const url = `${appConfig.apiUrl}/api/v1/users/${id}/address`;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            throw new Error(`Error al actualizar dirección: ${response.statusText}`);
        }

        const data: UserAddressResponse = await response.json();
        return data;
    }

    async updateUserAccount(id: string, request: AccountRequest): Promise<AccountResponse> {
        const url = `${appConfig.apiUrl}/api/v1/users/${id}/account`;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            throw new Error(`Error al actualizar cuenta: ${response.statusText}`);
        }

        const data: AccountResponse = await response.json();
        return data;
    }

    async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
        const url = `${appConfig.apiUrl}/api/v1/users`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            throw new Error(`Error al crear usuario: ${response.statusText}`);
        }

        const data: CreateUserResponse = await response.json();
 
        return data;
    }


    async exportUsers (ids: string[]): Promise<void> {
        try {
          const response = await fetch(`${appConfig.apiUrl}/api/v1/users/export`, {
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
            throw new Error("Error exportando usuarios");
          }
      
          const blob = await response.blob();
      
          const contentDisposition = response.headers.get("Content-Disposition");
          let filename = "users_export.pdf"; 
          if (contentDisposition) {
            const match = contentDisposition.match(/filename="?([^"]+)"?/);
            if (match) filename = match[1];
          }
      
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
      
        } catch (error) {
          console.error(error);
        }
      }
}

function userPreviewsQueryString(query: UserPreviewsQuery, pagination: PaginationRequest): string {
    const filtersParams: URLSearchParams = userPreviewsQuery.toURLSearchParams(query);
    const paginationParams: URLSearchParams = paginationRequest.toURLSearchParams(pagination); 
    const finalParams: URLSearchParams = URLSearchParamsHelpers.merge([filtersParams, paginationParams]);
    return finalParams.toString();
}

export default new UserService();