export type UserPreviewQuery = {
    search?: string,
    memberSinceMin?: Date,
    memberSinceMax?: Date,
    role?: string[],
    activeBookLoansMin?: number,
    activeBookLoansMax?: number,
};