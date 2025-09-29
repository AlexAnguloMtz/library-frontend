export function datePartString(date: Date): string {
    const isoString = date.toISOString();
    const [datePart] = isoString.split("T"); 
    return datePart;
}

export function parseLocalDate(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
}