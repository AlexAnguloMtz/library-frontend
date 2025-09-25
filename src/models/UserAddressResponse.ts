import type { StateResponse } from "./StateResponse";

export type UserAddressResponse = {
    address: string;
    district: string;
    state: StateResponse;
    city: string;
    zipCode: string;
}