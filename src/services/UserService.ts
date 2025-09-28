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
import type { AccountResponse } from "../models/AccountResponse";
import type { CreateUserRequest } from "../models/CreateUserRequest";
import type { CreateUserResponse } from "../models/CreateUserResponse";
import type { UpdateProfilePictureRequest } from "../models/UpdateProfilePictureRequest";
import type { UpdateProfilePictureResponse } from "../models/UpdateProfilePictureResponse";
import type { UpdateAccountRequest } from "../models/UpdateAccountRequest";
import type { ChangePasswordRequest } from "../models/ChangePasswordRequest";
import { ProblemDetailError, unknownErrorProblemDetail } from "../models/ProblemDetail";

class UserService {
    async getUsersPreviews(query: UserPreviewsQuery, pagination: PaginationRequest): Promise<PaginationResponse<UserPreview>> {
        try {   
            const queryString = userPreviewsQueryString(query, pagination);

            const url = `${appConfig.apiUrl}/api/v1/users?${queryString}`;

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

            const users: PaginationResponse<UserPreview> = await response.json();
            
            return users;
        } catch (error) {
            if (error instanceof ProblemDetailError) {
                throw error;
            }
            throw unknownErrorProblemDetail();
        }
    }

    async getUserOptions(): Promise<UserOptionsResponse> {
        try {
            const url = `${appConfig.apiUrl}/api/v1/users/options`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`
                }
            });

            if (!response.ok) {
                const problemDetail = await response.json();
                throw new ProblemDetailError(problemDetail);
            }

            const filters: UserOptionsResponse = await response.json();
        
            return filters;
        } catch (error) {
            if (error instanceof ProblemDetailError) {
                throw error;
            }
            throw unknownErrorProblemDetail();
        }
    }

    async getFullUserById(id: string): Promise<FullUser> {
        try {
            const url = `${appConfig.apiUrl}/api/v1/users/${id}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${authenticationHelper.getAuthentication()?.accessToken}`
                }
            });

            if (!response.ok) {
                const problemDetail = await response.json();
                throw new ProblemDetailError(problemDetail);
            }

            const user: FullUser = await response.json();

            return user;
        } catch (error) {
            if (error instanceof ProblemDetailError) {
                throw error;
            }
            throw unknownErrorProblemDetail();
        }
    }

    async deleteUserById(id: string): Promise<void> {
        try {
            const url = `${appConfig.apiUrl}/api/v1/users/${id}`;
            
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

            return;
        } catch (error) {
            if (error instanceof ProblemDetailError) {
                throw error;
            }
            throw unknownErrorProblemDetail();
        }
    }

    async updateUserPersonalData(id: string, request: PersonalDataRequest): Promise<PersonalDataResponse> {
        try {
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
                const problemDetail = await response.json();
                throw new ProblemDetailError(problemDetail);
            }

            const data: PersonalDataResponse = await response.json();
            return data;
        } catch (error) {
            if (error instanceof ProblemDetailError) {
                throw error;
            }
            throw unknownErrorProblemDetail();
        }
    }

    async updateUserAddress(id: string, request: UserAddressRequest): Promise<UserAddressResponse> {
        try {
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
                const problemDetail = await response.json();
                throw new ProblemDetailError(problemDetail);
            }

            const data: UserAddressResponse = await response.json();
            return data;
        } catch (error) {
            if (error instanceof ProblemDetailError) {
                throw error;
            }
            throw unknownErrorProblemDetail();
        }
    }

    async updateUserAccount(id: string, request: UpdateAccountRequest): Promise<AccountResponse> {
        try {
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
                const problemDetail = await response.json();
                throw new ProblemDetailError(problemDetail);
            }

            const data: AccountResponse = await response.json();
            return data;
        } catch (error) {
            if (error instanceof ProblemDetailError) {
                throw error;
            }
            throw unknownErrorProblemDetail();
        }
    }

    async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
        try {
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
                const problemDetail = await response.json();
                throw new ProblemDetailError(problemDetail);
            }

            const data: CreateUserResponse = await response.json();
            return data;
        } catch (error) {
            if (error instanceof ProblemDetailError) {
                throw error;
            }
            throw unknownErrorProblemDetail();
        }
    }

    async updateProfilePicture(id: string, request: UpdateProfilePictureRequest): Promise<UpdateProfilePictureResponse> {
        try {
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
                const problemDetail = await response.json();
                throw new ProblemDetailError(problemDetail);
            }

            const data: UpdateProfilePictureResponse = await response.json();
            return data;
        } catch (error) {
            if (error instanceof ProblemDetailError) {
                throw error;
            }
            throw unknownErrorProblemDetail();
        }
    }


    async exportUsers (ids: string[]): Promise<Blob> {
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

    async changePassword(id: string, request: ChangePasswordRequest): Promise<void> {
        try {
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
                const problemDetail = await response.json();
                throw new ProblemDetailError(problemDetail);
            }

            return;
        } catch (error) {
            if (error instanceof ProblemDetailError) {
                throw error;
            }
            throw unknownErrorProblemDetail();
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
