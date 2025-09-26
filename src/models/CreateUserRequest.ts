import type { CreateAccountRequest } from "./CreateAccountRequest";
import type { PersonalDataRequest } from "./PersonalDataRequest";
import type { UserAddressRequest } from "./UserAddressRequest";

export type CreateUserRequest = {
    personalData: PersonalDataRequest;
    address: UserAddressRequest;
    account: CreateAccountRequest;
}