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
import type { CreateAccountRequest } from "../models/CreateAccountRequest";
import type { AccountResponse } from "../models/AccountResponse";
import type { CreateUserRequest } from "../models/CreateUserRequest";
import type { CreateUserResponse } from "../models/CreateUserResponse";
import type { UpdateProfilePictureRequest } from "../models/UpdateProfilePictureRequest";
import type { UpdateProfilePictureResponse } from "../models/UpdateProfilePictureResponse";
import type { UpdateAccountRequest } from "../models/UpdateAccountRequest";
import type { ChangePasswordRequest } from "../models/ChangePasswordRequest";

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

    async updateUserAccount(id: string, request: UpdateAccountRequest): Promise<AccountResponse> {
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
        
        const formData = new FormData();
        
        formData.append('personalData.firstName', request.personalData.firstName);
        formData.append('personalData.lastName', request.personalData.lastName);
        formData.append('personalData.phone', request.personalData.phone);
        formData.append('personalData.genderId', request.personalData.genderId);
        
        formData.append('address.address', request.address.address);
        formData.append('address.stateId', request.address.stateId);
        formData.append('address.city', request.address.city);
        formData.append('address.district', request.address.district);
        formData.append('address.zipCode', request.address.zipCode);
        
        formData.append('account.email', request.account.email);
        formData.append('account.roleId', request.account.roleId);
        formData.append('account.password', request.account.password);
        formData.append('account.profilePicture', request.account.profilePicture);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`
                // No establecer Content-Type, el navegador lo hará automáticamente para FormData
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error al crear usuario: ${response.statusText}`);
        }

        const data: CreateUserResponse = await response.json();
        return data;
    }

    async updateProfilePicture(id: string, request: UpdateProfilePictureRequest): Promise<UpdateProfilePictureResponse> {
        const url = `${appConfig.apiUrl}/api/v1/users/${id}/profile-picture`;
        
        const formData = new FormData();
        formData.append('profilePicture', request.profilePicture);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`
                // No establecer Content-Type, el navegador lo hará automáticamente para FormData
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error al actualizar foto de perfil: ${response.statusText}`);
        }

        const data: UpdateProfilePictureResponse = await response.json();
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

    async changePassword(id: string, request: ChangePasswordRequest): Promise<void> {
        const url = `${appConfig.apiUrl}/api/v1/users/${id}/password`;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
        });
        
        if (!response.ok) {
            throw new Error(`Error al cambiar contraseña: ${response.statusText}`);
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