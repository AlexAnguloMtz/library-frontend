import type { AuthenticationResponse } from "../models/AuthenticationResponse";

class AuthenticationHelper {

    private readonly AUTHENTICATION_KEY = 'authentication';

    getAuthentication(): AuthenticationResponse | null {
        const authentication = localStorage.getItem(this.AUTHENTICATION_KEY);
        return authentication ? JSON.parse(authentication) : null;
    }

    setAuthentication(authentication: AuthenticationResponse): void {
        localStorage.setItem(this.AUTHENTICATION_KEY, JSON.stringify(authentication));
    }

    logout() {
        localStorage.removeItem(this.AUTHENTICATION_KEY);
    }

    hasAnyPermission(auth: AuthenticationResponse, permissions: string[]): boolean {
        if (!auth || !auth.permissions) {
            return false;
        }
        return permissions.some(permission => auth.permissions!.includes(permission));
    }
}

export default new AuthenticationHelper();