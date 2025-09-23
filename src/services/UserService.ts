import type { PaginationRequest } from "../models/PaginationRequest";
import type { PaginationResponse } from "../models/PaginationResponse";
import type { UserPreview } from "../models/UserPreview";
import type { UserPreviewQuery } from "../models/UserPreviewQuery";

class UserService {
    async getUsersPreviews(query: UserPreviewQuery, pagination: PaginationRequest): Promise<PaginationResponse<UserPreview>> {
        const { page, size } = pagination;

        const url = `http://localhost:8080/api/v1/users?page=${page}&size=${size}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Error al obtener usuarios: ${response.statusText}`);
        }

        const users: PaginationResponse<UserPreview> = await response.json();
        
        return users;
    }
}

export default new UserService();