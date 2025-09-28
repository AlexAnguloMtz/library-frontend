export type AuthenticationResponse = {
    userId: string;
    profilePictureUrl: string;
    fullName: string;
    email: string;
    role: string;
    permissions: string[];
    accessToken: string;
}