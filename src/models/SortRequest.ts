export type SortRequest = {
    sort?: string,
    order?: 'asc' | 'desc'
}

export function toUrlParam(sortRequest: SortRequest) {
    if (!sortRequest.sort || !sortRequest.order) {
        return "";
    }
    const separator: string = "-";
    return `${sortRequest.sort}${separator}${sortRequest.order}`;
}