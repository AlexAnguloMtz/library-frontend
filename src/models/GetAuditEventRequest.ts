export type GetAuditEventRequest = {
    eventDataPretty?: boolean;
}

export function toURLSearchParams(query: GetAuditEventRequest): URLSearchParams {
    const url: URLSearchParams = new URLSearchParams();

    if (!query) {
        return url;
    }

    if (query.eventDataPretty) {
        url.append("eventDataPretty", String(query.eventDataPretty));
    }

    return url;
}