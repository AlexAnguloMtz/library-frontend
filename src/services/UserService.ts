import { UserFactory } from "../factories/UserFactory";
import type { PaginationRequest } from "../models/PaginationRequest";
import type { UserPreview } from "../models/UserPreview";
import type { UserPreviewQuery } from "../models/UserPreviewQuery";

interface UserClient {
    getUsersPreviews(query: string, pagination: string): string;
}

export interface UserService {
    getUsersPreviews(query: UserPreviewQuery, pagination: PaginationRequest): Promise<UserPreview[]>;
}

class DevelopmentUserService implements UserService {
    async getUsersPreviews(_: UserPreviewQuery, __: PaginationRequest): Promise<UserPreview[]> {
        await new Promise(resolve => setTimeout(resolve, 3000));
        return UserFactory.createUsersPreviews(25);
    }
}

class ProductionUserService implements UserService {
    private userClient: UserClient;

    constructor() {
        // @ts-ignore
        if (!window.userClient) {
            throw new Error("user client not available in window");
        }

        // @ts-ignore
        this.userClient = window.userClient;
    }

    async getUsersPreviews(query: UserPreviewQuery, pagination: PaginationRequest): Promise<UserPreview[]> {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const queryJson = JSON.stringify(query);
        const paginationJson = JSON.stringify(pagination);

        return JSON.parse(this.userClient.getUsersPreviews(queryJson, paginationJson)) as UserPreview[];
    }

}

const isDevelopment = process.env.NODE_ENV === 'development';

export const userService = isDevelopment
    ? new DevelopmentUserService()
    : new ProductionUserService();
