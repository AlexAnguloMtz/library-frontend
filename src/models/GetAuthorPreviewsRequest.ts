export type GetAuthorPreviewsRequest = {
    search?: string;
    countryId?: string[];
    dateOfBirthMin?: string;
    dateOfBirthMax?: string;
    booksMin?: string;
    booksMax?: string;
};

export function toURLSearchParams(query: GetAuthorPreviewsRequest): URLSearchParams {
    const url: URLSearchParams = new URLSearchParams();
    
    if (!query) {
        return url;
    }

    if (query.search) {
        url.append("search", query.search);
    }

    if (query.countryId) {
        query.countryId.forEach(id => {
            url.append("countryId", id);
        });
    }

    if (query.dateOfBirthMin) {
        url.append("dateOfBirthMin", query.dateOfBirthMin);
    }

    if (query.dateOfBirthMax) {
        url.append("dateOfBirthMax", query.dateOfBirthMax);
    }

    if (query.booksMin) {
        url.append("bookCountMin", query.booksMin);
    }

    if (query.booksMax) {
        url.append("bookCountMax", query.booksMax);
    }

    return url;
}
