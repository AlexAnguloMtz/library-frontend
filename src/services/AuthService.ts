import type { AuthenticationResponse } from "../models/AuthenticationResponse";
import apiClient from "./ApiClient";

export interface LoginRequest {
  email: string;
  password: string;
}

class AuthService {
  async login(loginRequest: LoginRequest): Promise<AuthenticationResponse> {
    return Promise.resolve({
      fullName: 'My Name',
      role: 'ADMIN',
      permissions: ['books:read', 'reports:read'],
      userId: '123',
      email: loginRequest.email,
      profilePictureUrl: '',
      accessToken: 'my-secret-token'
    });
    // return apiClient.post<AuthenticationResponse>(`/api/v1/auth/login`, loginRequest);
  }
}

export default new AuthService();
