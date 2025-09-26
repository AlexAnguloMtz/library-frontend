import type { AccountRequest } from "./AccountRequest";
import type { PersonalDataRequest } from "./PersonalDataRequest";
import type { UserAddressRequest } from "./UserAddressRequest";

export type CreateUserRequest = {
    personalData: PersonalDataRequest;
    address: UserAddressRequest;
    account: AccountRequest;
}