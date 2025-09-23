export type UserPreviewQuery = {
    search?: string,
    registrationDateMin?: Date,
    registrationDateMax?: Date,
    role?: string[],
    activeBookLoansMin?: number,
    activeBookLoansMax?: number,
};