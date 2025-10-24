import type { PopularAuthorsResponse } from "../models/PopularAuthorsResponse";
import type { PopularBookCategoriesResponse } from "../models/PopularBookCategoriesResponse";

const categoriesData: PopularBookCategoriesResponse[] = [
    {
        gender: 'Hombres',
        groups: [
            {
                ageRange: { min: 10, max: 20 },
                categories: [
                    { name: 'Fantasía', frequency: 120 },
                    { name: 'Romance', frequency: 90 },
                    { name: 'Ciencia', frequency: 60 },
                    { name: 'Misterio', frequency: 80 },
                    { name: 'Aventura', frequency: 70 },
                ],
            },
            {
                ageRange: { min: 21, max: 30 },
                categories: [
                    { name: 'Fantasía', frequency: 200 },
                    { name: 'Romance', frequency: 180 },
                    { name: 'Ciencia', frequency: 90 },
                    { name: 'Misterio', frequency: 120 },
                    { name: 'Aventura', frequency: 110 },
                ],
            },
        ],
    },
    {
        gender: 'Mujeres',
        groups: [
            {
                ageRange: { min: 10, max: 20 },
                categories: [
                    { name: 'Fantasía', frequency: 100 },
                    { name: 'Romance', frequency: 150 },
                    { name: 'Ciencia', frequency: 70 },
                    { name: 'Misterio', frequency: 90 },
                    { name: 'Aventura', frequency: 50 },
                ],
            },
            {
                ageRange: { min: 21, max: 30 },
                categories: [
                    { name: 'Fantasía', frequency: 220 },
                    { name: 'Romance', frequency: 210 },
                    { name: 'Ciencia', frequency: 110 },
                    { name: 'Misterio', frequency: 140 },
                    { name: 'Aventura', frequency: 130 },
                ],
            },
        ],
    },
];

const authorsData: PopularAuthorsResponse[] = [
    {
        gender: 'Hombres',
        groups: [
            {
                ageRange: { min: 10, max: 20 },
                authors: [
                    { name: 'J.K. Rowling', frequency: 120 },
                    { name: 'George R.R. Martin', frequency: 90 },
                    { name: 'Isaac Asimov', frequency: 60 },
                    { name: 'Agatha Christie', frequency: 80 },
                    { name: 'J.R.R. Tolkien', frequency: 70 },
                ],
            },
            {
                ageRange: { min: 21, max: 30 },
                authors: [
                    { name: 'J.K. Rowling', frequency: 200 },
                    { name: 'George R.R. Martin', frequency: 180 },
                    { name: 'Isaac Asimov', frequency: 90 },
                    { name: 'Agatha Christie', frequency: 120 },
                    { name: 'J.R.R. Tolkien', frequency: 110 },
                ],
            },
        ],
    },
    {
        gender: 'Mujeres',
        groups: [
            {
                ageRange: { min: 10, max: 20 },
                authors: [
                    { name: 'Suzanne Collins', frequency: 100 },
                    { name: 'Jane Austen', frequency: 150 },
                    { name: 'Margaret Atwood', frequency: 70 },
                    { name: 'Agatha Christie', frequency: 90 },
                    { name: 'Veronica Roth', frequency: 50 },
                ],
            },
            {
                ageRange: { min: 21, max: 30 },
                authors: [
                    { name: 'Suzanne Collins', frequency: 220 },
                    { name: 'Jane Austen', frequency: 210 },
                    { name: 'Margaret Atwood', frequency: 110 },
                    { name: 'Agatha Christie', frequency: 140 },
                    { name: 'Veronica Roth', frequency: 130 },
                ],
            },
        ],
    },
];

class ReportsService {
    async getPopularBookCategories(): Promise<PopularBookCategoriesResponse[]> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() < 0.5) {
                    resolve(categoriesData);
                } else {
                    reject(new Error("Error simulado al cargar categorías populares"));
                }
            }, 2000);
        });
    }

    async getPopularAuthors(): Promise<PopularAuthorsResponse[]> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() < 0.5) {
                    resolve(authorsData);
                } else {
                    reject(new Error("Error simulado al cargar categorías populares"));
                }
            }, 2000);
        });
    }
}

export default new ReportsService();
