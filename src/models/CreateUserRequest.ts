import type { CreateAccountRequest } from "./CreateAccountRequest";
import type { PersonalDataRequest } from "./PersonalDataRequest";

export type CreateUserRequest = {
    personalData: PersonalDataRequest;
    account: CreateAccountRequest;
}