export type PopularAuthorsResponse = {
    gender: string;
    groups: {
        ageRange: {
            min: number,
            max: number
        },
        authors: {
            name: string;
            frequency: number;
        }[];
    }[];
};