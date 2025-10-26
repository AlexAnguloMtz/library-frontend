import type { PopularityMetric } from "./PopularityMetric";

export type BookCategoriesPopularityRequest = {
    limit?: number;
    metric: PopularityMetric;
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