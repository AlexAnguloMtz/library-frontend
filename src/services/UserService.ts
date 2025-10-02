import type { PaginationRequest } from "../models/PaginationRequest";
import type { PaginationResponse } from "../models/PaginationResponse";
import type { UserPreview } from "../models/UserPreview";
import type { UserPreviewsQuery } from "../models/UserPreviewQuery";
import * as paginationRequest from '../models/PaginationRequest';
import * as userPreviewsQuery from '../models/UserPreviewQuery';
import * as URLSearchParamsHelpers from '../util/URLSearchParamsHelpers';
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
import { datePartString } from "../util/DateHelper";
import apiClient from "./ApiClient";

class UserService {
    async getUsersPreviews(query: UserPreviewsQuery, pagination: PaginationRequest): Promise<PaginationResponse<UserPreview>> {
        const usersResponse: PaginationResponse<UserPreview> = await apiClient.get(`/api/v1/users?${userPreviewsQueryString(query, pagination)}`);
        const parsedUsers: PaginationResponse<UserPreview> = {
            ...usersResponse,
            items: usersResponse.items.map(user => ({
                ...user,
                dateOfBirth: new Date(user.dateOfBirth)
            }))
        };
        return parsedUsers;
    }

    async getUserOptions(): Promise<UserOptionsResponse> {
        return apiClient.get(`/api/v1/users/options`);
    }

    async getFullUserById(id: string): Promise<FullUser> {
        return apiClient.get(`/api/v1/users/${id}`);
    }

    async deleteUserById(id: string): Promise<void> {
        return apiClient.delete(`/api/v1/users/${id}`);
    }

    async updateUserPersonalData(id: string, request: PersonalDataRequest): Promise<PersonalDataResponse> {
        return apiClient.put(`/api/v1/users/${id}/personal-data`, request);
    }

    async updateUserAddress(id: string, request: UserAddressRequest): Promise<UserAddressResponse> {
        return apiClient.put(`/api/v1/users/${id}/address`, request);
    }

    async updateUserAccount(id: string, request: UpdateAccountRequest): Promise<AccountResponse> {
        return apiClient.put(`/api/v1/users/${id}/account`, request);
    }

    async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
        const requestToSend = {
            account: {
                ...request.account,
            },
            personalData: {
                ...request.personalData,
                dateOfBirth: datePartString(request.personalData.dateOfBirth)
            }
        }

        const formData = new FormData();
        
        formData.append('personalData.firstName', requestToSend.personalData.firstName);
        formData.append('personalData.lastName', requestToSend.personalData.lastName);
        formData.append('personalData.phone', requestToSend.personalData.phone);
        formData.append('personalData.genderId', requestToSend.personalData.genderId);
        formData.append('personalData.dateOfBirth', requestToSend.personalData.dateOfBirth);
        
        formData.append('account.email', requestToSend.account.email);
        formData.append('account.roleId', requestToSend.account.roleId);
        formData.append('account.password', requestToSend.account.password);
    
        return apiClient.post(`/api/v1/users`, formData);
    }

    async updateProfilePicture(id: string, request: UpdateProfilePictureRequest): Promise<UpdateProfilePictureResponse> {
        const formData = new FormData();
        formData.append('profilePicture', request.profilePicture);
        return apiClient.put(`/api/v1/users/${id}/profile-picture`, formData);
    }

    async exportUsers (ids: string[]): Promise<Blob> {
        const request = {
            format: "pdf",
            ids
        }
        const response = await apiClient.post<Response>(`/api/v1/users/export`, request);
        return response.blob();
    }

    async changePassword(id: string, request: ChangePasswordRequest): Promise<void> {
        return apiClient.put(`/api/v1/users/${id}/password`, request);
    }
}

function userPreviewsQueryString(query: UserPreviewsQuery, pagination: PaginationRequest): string {
    const filtersParams: URLSearchParams = userPreviewsQuery.toURLSearchParams(query);
    const paginationParams: URLSearchParams = paginationRequest.toURLSearchParams(pagination); 
    const finalParams: URLSearchParams = URLSearchParamsHelpers.merge([filtersParams, paginationParams]);
    return finalParams.toString();
}

export default new UserService();
