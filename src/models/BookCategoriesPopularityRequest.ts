export enum BookCategoryPopularityMetric {
    AVERAGE = 'AVERAGE',
    DISTINCT_USERS = 'DISTINCT_USERS',
}

export type BookCategoriesPopularityRequest = {
    limit?: number;
    metric: BookCategoryPopularityMetric;
}

export function toURLSearchParams(request: BookCategoriesPopularityRequest): URLSearchParams {
    const url: URLSearchParams = new URLSearchParams();

    if (request.limit) {
        url.append("limit", request.limit.toString());
    }

    if (request.metric) {
        url.append("metric", request.metric);
    }

    return url;
}