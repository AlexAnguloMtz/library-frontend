export type UserPreviewsQuery = {
    search?: string,
    registrationDateMin?: Date,
    registrationDateMax?: Date,
    role?: string[],
    activeBookLoansMin?: number,
    activeBookLoansMax?: number,
};

export function toURLSearchParams(query: UserPreviewsQuery): URLSearchParams {
    const url: URLSearchParams = new URLSearchParams();
    
    if (!query) {
        return url;
    }

    if (query.search) {
        url.append("search", query.search);
    }

    if (query.registrationDateMin) {
        url.append("registrationDateMin", query.registrationDateMin.toISOString());
    }

    if (query.registrationDateMax) {
        url.append("registrationDateMax", query.registrationDateMax.toISOString());
    }

    if (query.role) {
        query.role.forEach(r => {
            url.append("role", r);
        });
    }

    if (query.activeBookLoansMin !== undefined) {
        url.append("activeBookLoansMin", query.activeBookLoansMin.toString());
    }

    if (query.activeBookLoansMax !== undefined) {
        url.append("activeBookLoansMax", query.activeBookLoansMax.toString());
    }

    return url;
}