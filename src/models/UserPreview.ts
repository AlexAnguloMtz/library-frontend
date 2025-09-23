import type { RoleDTO } from "./RoleDTO";

export type UserPreview = {
    id: string;
    name: string;
    email: string;
    roles: RoleDTO[];
    phone: string;
    registrationDate: string;
    activeLoans: string;
}