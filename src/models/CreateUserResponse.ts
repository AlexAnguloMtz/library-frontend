import type { AccountResponse } from "./AccountResponse";
import type { PersonalDataResponse } from "./PersonalDataResponse";
import type { UserAddressResponse } from "./UserAddressResponse";

export type CreateUserResponse = {  
    id: string;
    personalData: PersonalDataResponse;
    address: UserAddressResponse;
    account: AccountResponse;
}