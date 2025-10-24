export type PopularBookCategoriesResponse = {
    gender: string;
    groups: {
        ageRange: {
            min: number,
            max: number
        },
        categories: {
            name: string;
            frequency: number;
        }[];
    }[];
};