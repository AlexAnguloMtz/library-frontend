export type GetAuditEventsRequest = {
    responsible?: string;
    resourceId?: string;
    resourceType?: string;
    eventType?: string;
    occurredAtMin?: Date;
    occurredAtMax?: Date;
}


export function toURLSearchParams(query: GetAuditEventsRequest): URLSearchParams {
    const url: URLSearchParams = new URLSearchParams();

    if (!query) {
        return url;
    }

    if (query.responsible) {
        url.append("responsible", query.responsible);
    }

    if (query.resourceId) {
        url.append("resourceId", query.resourceId);
    }

    if (query.eventType) {
        url.append("eventType", query.eventType);
    }

    if (query.resourceType) {
        url.append("resourceType", query.resourceType);
    }

    if (query.occurredAtMin) {
        url.append("occurredAtMin", query.occurredAtMin.toString());
    }

    if (query.occurredAtMax) {
        url.append("occurredAtMax", query.occurredAtMax.toString());
    }

    return url;
}