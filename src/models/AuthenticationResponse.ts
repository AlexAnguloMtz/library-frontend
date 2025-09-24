export type AuthenticationResponse = {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
    accessToken: string;
}