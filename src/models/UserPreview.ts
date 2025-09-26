import type { RoleResponse } from "./RoleResponse";

export type UserPreview = {
    id: string;
    name: string;
    email: string;
    role: RoleResponse;
    phone: string;
    registrationDate: string;
    activeLoans: string;
    profilePictureUrl: string;
}