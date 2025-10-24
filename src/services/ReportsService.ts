import type { PopularBookCategoriesResponse } from "../models/PopularBookCategoriesResponse";

const data: PopularBookCategoriesResponse[] = [
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

class ReportsService {
    async getPopularBookCategories(): Promise<PopularBookCategoriesResponse[]> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() < 0.5) {
                    resolve(data);
                } else {
                    reject(new Error("Error simulado al cargar categorías populares"));
                }
            }, 2000);
        });
    }
}

export default new ReportsService();
