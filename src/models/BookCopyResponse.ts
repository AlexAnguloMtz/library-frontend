import type { AvailabilityStatusResponse } from "./AvailabilityStatusResponse";

export type BookCopyResponse = {
    id: string;
    status: AvailabilityStatusResponse;
    observations: string | null;
}