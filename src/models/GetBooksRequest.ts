export type GetBooksRequest = {
    search?: string;
    categoryId?: string[];
    yearMin?: number
    yearMax?: number;
    available?: boolean;
}

export function toURLSearchParams(request: GetBooksRequest): URLSearchParams {
    const url: URLSearchParams = new URLSearchParams();

    if (request.search) {
        url.append("search", request.search);
    }

    if (request.categoryId) {
        request.categoryId.forEach(id => {
            url.append("categoryId", id);
        });
    }
    
    if (request.yearMin) {
        url.append("yearMin", request.yearMin.toString());
    }

    if (request.yearMax) {
        url.append("yearMax", request.yearMax.toString());
    }
    
    if (request.available) {
        url.append("available", request.available.toString());
    }

    return url;
}