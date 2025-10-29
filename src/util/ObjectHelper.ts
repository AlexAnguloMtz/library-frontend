export const reverse = (obj: Object): Object => {
    const entries = Object.entries(obj);
    const inverted = entries.reverse();
    return Object.fromEntries(inverted);
}