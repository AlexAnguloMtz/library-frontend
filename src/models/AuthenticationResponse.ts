export type AuthenticationResponse = {
    userId: string;
    email: string;
    role: string;
    permissions: string[];
    accessToken: string;
}