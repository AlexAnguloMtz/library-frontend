import type { AuthenticationResponse } from "../models/AuthenticationResponse";
import apiClient from "./ApiClient";

export interface LoginRequest {
  email: string;
  password: string;
}

class AuthService {
  async login(loginRequest: LoginRequest): Promise<AuthenticationResponse> {
    return apiClient.post<AuthenticationResponse>(`/api/v1/auth/login`, loginRequest);
  }
}

export default new AuthService();
