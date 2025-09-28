import { appConfig } from "../config/AppConfig";
import type { AuthenticationResponse } from "../models/AuthenticationResponse";
import { ProblemDetailError, unknownErrorProblemDetail } from "../models/ProblemDetail";

export interface LoginRequest {
  email: string;
  password: string;
}

class AuthService {

  async login(loginRequest: LoginRequest): Promise<AuthenticationResponse> {
    try {
      const url = `${appConfig.apiUrl}/api/v1/auth/login`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginRequest),
      });

      if (!response.ok) {
        const problemDetail = await response.json();
        throw new ProblemDetailError(problemDetail);
      }

      const data: AuthenticationResponse = await response.json();
      
      return data;
    } catch (error) {
      if (error instanceof ProblemDetailError) {
        throw error;
      }
      throw unknownErrorProblemDetail();
    }
  }
}

export default new AuthService();
