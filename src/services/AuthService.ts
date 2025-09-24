import { appConfig } from "../config/AppConfig";
import type { AuthenticationResponse } from "../models/AuthenticationResponse";

export interface LoginRequest {
  email: string;
  password: string;
}

class AuthService {

  async login(loginRequest: LoginRequest): Promise<AuthenticationResponse> {
    const url = `${appConfig.apiUrl}/api/v1/auth/login`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al iniciar sesión: ${response.statusText}`);
    }

    const data: AuthenticationResponse = await response.json();
    
    return data;
  }
}

export default new AuthService();
