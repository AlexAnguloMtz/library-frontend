import type { BookCategoryResponse } from "./BookCategoryResponse";

export type MergeBookCategoriesResponse = {
    targetCategory: BookCategoryResponse;
    movedBooks: number;
    deletedCategories: number;
}