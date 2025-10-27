import type { OptionResponse } from "./OptionResponse";

export type AuditResourceTypeResponse = {
    id: string;
    name: string;
    eventTypes: OptionResponse[];
}