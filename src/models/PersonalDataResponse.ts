import type { GenderResponse } from "./GenderResponse";

export type PersonalDataResponse = {
    firstName: string;
    lastName: string;
    phone: string;
    gender: GenderResponse;
    dateOfBirth: string;
}