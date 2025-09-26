import type { RoleResponse } from "./RoleResponse";

export type AccountResponse = {
    email: string;
    role: RoleResponse;
    profilePictureUrl: string;
    permissions: string[];
}