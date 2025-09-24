import type { AuthenticationResponse } from "../models/Authentication";

class AuthenticationHelper {
    private readonly AUTHENTICATION_KEY = 'authentication';
    
    setAuthentication(authentication: AuthenticationResponse): void {
        localStorage.setItem(this.AUTHENTICATION_KEY, JSON.stringify(authentication));
    }

    getAuthentication(): AuthenticationResponse | null {
        const authentication = localStorage.getItem(this.AUTHENTICATION_KEY);
        return authentication ? JSON.parse(authentication) : null;
    }
}

export default new AuthenticationHelper();