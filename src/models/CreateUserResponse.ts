import type { AccountResponse } from "./AccountResponse";
import type { PersonalDataResponse } from "./PersonalDataResponse";

export type CreateUserResponse = {  
    id: string;
    personalData: PersonalDataResponse;
    account: AccountResponse;
    permissions: string[];
}