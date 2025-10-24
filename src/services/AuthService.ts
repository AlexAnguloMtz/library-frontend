import type { AuthenticationResponse } from "../models/AuthenticationResponse";
import type { LoginRequest } from "../models/LoginRequest";
import apiClient from "./ApiClient";

class AuthService {
  async login(loginRequest: LoginRequest): Promise<AuthenticationResponse> {
    return apiClient.post<AuthenticationResponse>(`/api/v1/auth/login`, loginRequest);
  }
}

export default new AuthService();
