export type GetBookCategoriesRequest = {
    search?: string;
    bookCountMin?: string;
    bookCountMax?: string;
};

export function toURLSearchParams(query: GetBookCategoriesRequest): URLSearchParams {
    const url: URLSearchParams = new URLSearchParams();

    if (!query) {
        return url;
    }

    if (query.search) {
        url.append("search", query.search);
    }

    if (query.bookCountMin) {
        url.append("bookCountMin", query.bookCountMin);
    }

    if (query.bookCountMax) {
        url.append("bookCountMax", query.bookCountMax);
    }

    return url;
}