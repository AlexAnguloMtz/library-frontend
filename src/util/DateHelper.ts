export function datePartString(date: Date): string {
    const isoString = date.toISOString();
    const [datePart] = isoString.split("T"); 
    return datePart;
}