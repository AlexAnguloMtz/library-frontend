import type { GenderResponse } from "./GenderResponse";
import type { RoleResponse } from "./RoleResponse";
import type { UserAddressResponse } from "./UserAddressResponse";

export type FullUser = {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string;
    role: RoleResponse;
    address: UserAddressResponse | null;
    gender: GenderResponse;
    registrationDate: string;
    profilePictureUrl: string;
    dateOfBirth: string;
    age: number;
    canLogin: boolean;
    permissions: string[];
}