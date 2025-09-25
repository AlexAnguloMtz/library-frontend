import type { GenderResponse } from "./GenderResponse";
import type { RoleDTO } from "./RoleDTO";
import type { UserAddressResponse } from "./UserAddressResponse";

export type FullUser = {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string;
    roles: RoleDTO[];
    address: UserAddressResponse;
    gender: GenderResponse;
    registrationDate: string;
    profilePictureUrl: string;
}