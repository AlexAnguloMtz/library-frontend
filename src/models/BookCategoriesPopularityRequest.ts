export type BookCategoriesPopularityRequest = {
    limit?: number;
}

export function toURLSearchParams(request: BookCategoriesPopularityRequest): URLSearchParams {
    const url: URLSearchParams = new URLSearchParams();

    if (request.limit) {
        url.append("limit", request.limit.toString());
    }

    return url;
}