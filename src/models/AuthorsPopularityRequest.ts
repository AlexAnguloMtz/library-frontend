export type AuthorsPopularityRequest = {
    limit?: number;
}

export function toURLSearchParams(request: AuthorsPopularityRequest): URLSearchParams {
    const url: URLSearchParams = new URLSearchParams();

    if (request.limit) {
        url.append("limit", request.limit.toString());
    }

    return url;
}