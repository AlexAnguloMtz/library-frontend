export enum Icons {
    add = 'add',
    export = 'export',
    user_avatar = 'user_avatar',
    book_open = 'book_open',
    sort_asc = 'sort_asc',
    sort_desc = 'sort_desc'
}

export const Icon: React.FC<{ name: Icons, className?: string, fillColor?: string }> = ({ name, className, fillColor }) => {
    const getColor = (defaultColor: string) => fillColor || defaultColor;
    if (name === Icons.add) {
        return (
            <svg className={className} width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.18774 9.35516H14.6877" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9.43774 4.10516V14.6052" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }
    if (name === Icons.export) {
        return (
            <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 10V2" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4.66675 6.66669L8.00008 10L11.3334 6.66669" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

        );
    }
    if (name === Icons.user_avatar) {
        return (
            <svg className={className} width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.8333 18V16.3333C15.8333 15.4493 15.4821 14.6014 14.857 13.9763C14.2319 13.3512 13.384 13 12.5 13H7.49996C6.6159 13 5.76806 13.3512 5.14294 13.9763C4.51782 14.6014 4.16663 15.4493 4.16663 16.3333V18" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9.99996 9.66667C11.8409 9.66667 13.3333 8.17428 13.3333 6.33333C13.3333 4.49238 11.8409 3 9.99996 3C8.15901 3 6.66663 4.49238 6.66663 6.33333C6.66663 8.17428 8.15901 9.66667 9.99996 9.66667Z" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }
    if (name === Icons.book_open) {
        return (
            <svg className={className} width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.4377 7V21" stroke={getColor("white")} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21.4377 18C21.703 18 21.9573 17.8946 22.1449 17.7071C22.3324 17.5196 22.4377 17.2652 22.4377 17V4C22.4377 3.73478 22.3324 3.48043 22.1449 3.29289C21.9573 3.10536 21.703 3 21.4377 3H16.4377C15.3769 3 14.3595 3.42143 13.6093 4.17157C12.8592 4.92172 12.4377 5.93913 12.4377 7C12.4377 5.93913 12.0163 4.92172 11.2662 4.17157C10.516 3.42143 9.49861 3 8.43774 3H3.43774C3.17253 3 2.91817 3.10536 2.73064 3.29289C2.5431 3.48043 2.43774 3.73478 2.43774 4V17C2.43774 17.2652 2.5431 17.5196 2.73064 17.7071C2.91817 17.8946 3.17253 18 3.43774 18H9.43774C10.2334 18 10.9965 18.3161 11.5591 18.8787C12.1217 19.4413 12.4377 20.2044 12.4377 21C12.4377 20.2044 12.7538 19.4413 13.3164 18.8787C13.879 18.3161 14.6421 18 15.4377 18H21.4377Z" stroke={getColor("white")} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }
    if (name === Icons.sort_asc) {
        return (
            <svg className={className} width="800px" height="800px" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 8.24994C8.81 8.24994 8.62 8.17994 8.47 8.02994L6.5 6.05994L4.53 8.02994C4.24 8.31994 3.76 8.31994 3.47 8.02994C3.18 7.73994 3.18 7.25994 3.47 6.96994L5.97 4.46994C6.26 4.17994 6.74 4.17994 7.03 4.46994L9.53 6.96994C9.82 7.25994 9.82 7.73994 9.53 8.02994C9.38 8.17994 9.19 8.24994 9 8.24994Z" fill="white" />
                <path d="M6.5 19.75C6.09 19.75 5.75 19.41 5.75 19V5C5.75 4.59 6.09 4.25 6.5 4.25C6.91 4.25 7.25 4.59 7.25 5V19C7.25 19.41 6.91 19.75 6.5 19.75Z" fill="white" />
                <path d="M20 8.25H12C11.59 8.25 11.25 7.91 11.25 7.5C11.25 7.09 11.59 6.75 12 6.75H20C20.41 6.75 20.75 7.09 20.75 7.5C20.75 7.91 20.41 8.25 20 8.25Z" fill="white" />
                <path d="M16 14.25H12C11.59 14.25 11.25 13.91 11.25 13.5C11.25 13.09 11.59 12.75 12 12.75H16C16.41 12.75 16.75 13.09 16.75 13.5C16.75 13.91 16.41 14.25 16 14.25Z" fill="white" />
                <path d="M14 17.25H12C11.59 17.25 11.25 16.91 11.25 16.5C11.25 16.09 11.59 15.75 12 15.75H14C14.41 15.75 14.75 16.09 14.75 16.5C14.75 16.91 14.41 17.25 14 17.25Z" fill="white" />
                <path d="M18 11.25H12C11.59 11.25 11.25 10.91 11.25 10.5C11.25 10.09 11.59 9.75 12 9.75H18C18.41 9.75 18.75 10.09 18.75 10.5C18.75 10.91 18.41 11.25 18 11.25Z" fill="white" />
            </svg>

        );
    }
    if (name === Icons.sort_desc) {
        return (
            <svg className={className} width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.5 19.7499C6.31 19.7499 6.12 19.6799 5.97 19.5299L3.47 17.0299C3.18 16.7399 3.18 16.2599 3.47 15.9699C3.76 15.6799 4.24 15.6799 4.53 15.9699L6.5 17.9399L8.47 15.9699C8.76 15.6799 9.24 15.6799 9.53 15.9699C9.82 16.2599 9.82 16.7399 9.53 17.0299L7.03 19.5299C6.88 19.6799 6.69 19.7499 6.5 19.7499Z" fill="white" />
                <path d="M6.5 19.75C6.09 19.75 5.75 19.41 5.75 19V5C5.75 4.59 6.09 4.25 6.5 4.25C6.91 4.25 7.25 4.59 7.25 5V19C7.25 19.41 6.91 19.75 6.5 19.75Z" fill="white" />
                <path d="M20 17.25H12C11.59 17.25 11.25 16.91 11.25 16.5C11.25 16.09 11.59 15.75 12 15.75H20C20.41 15.75 20.75 16.09 20.75 16.5C20.75 16.91 20.41 17.25 20 17.25Z" fill="white" />
                <path d="M16 11.25H12C11.59 11.25 11.25 10.91 11.25 10.5C11.25 10.09 11.59 9.75 12 9.75H16C16.41 9.75 16.75 10.09 16.75 10.5C16.75 10.91 16.41 11.25 16 11.25Z" fill="white" />
                <path d="M14 8.25H12C11.59 8.25 11.25 7.91 11.25 7.5C11.25 7.09 11.59 6.75 12 6.75H14C14.41 6.75 14.75 7.09 14.75 7.5C14.75 7.91 14.41 8.25 14 8.25Z" fill="white" />
                <path d="M18 14.25H12C11.59 14.25 11.25 13.91 11.25 13.5C11.25 13.09 11.59 12.75 12 12.75H18C18.41 12.75 18.75 13.09 18.75 13.5C18.75 13.91 18.41 14.25 18 14.25Z" fill="white" />
            </svg>
        );
    }
    throw new Error(`Icon not found: ${name}`);
};