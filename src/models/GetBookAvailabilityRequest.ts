export type GetBookAvailabilityRequest = {
    search?: string,
    status?: string
}

export function toURLSearchParams(query: GetBookAvailabilityRequest): URLSearchParams {
    const url: URLSearchParams = new URLSearchParams();

    if (!query) {
        return url;
    }

    if (query.search) {
        url.append("search", query.search);
    }

    if (query.status) {
        url.append("status", query.status);
    }

    return url;
}