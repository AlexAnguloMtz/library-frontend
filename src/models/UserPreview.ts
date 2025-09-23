import type { RoleDTO } from "./RoleDTO";

export type UserPreview = {
    id: string;
    name: string;
    email: string;
    roles: RoleDTO[];
    activeLoans: string;
    memberSince: string;
    phone: string;
}