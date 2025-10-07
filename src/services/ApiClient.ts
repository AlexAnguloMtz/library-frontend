import { appConfig } from "../config/AppConfig";
import authenticationHelper from "../util/AuthenticationHelper";
import { ProblemDetailError } from "../models/ProblemDetail";
import { unknownErrorProblemDetail } from "../models/ProblemDetail";

class ApiClient {
    private baseUrl: string;
    private authHelper: typeof authenticationHelper;

    constructor(baseUrl: string, authHelper: typeof authenticationHelper) {
        this.baseUrl = baseUrl;
        this.authHelper = authHelper;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        try {
            const token = this.authHelper.getAuthentication()?.accessToken;

            const headers: HeadersInit = {
                ...options.headers,
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            };

            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers,
            });

            if (!response.ok) {
                const problemDetail = await response.json().catch(() => ({}));
                throw new ProblemDetailError(problemDetail);
            }

            if (response.status === 204) {
                return undefined as T;
            }

            const contentType = response.headers.get('content-type') ?? '';
            if (contentType.includes('application/json')) {
                return await response.json() as T;
            }

            return response as unknown as T;
        } catch (error) {
            if (error instanceof ProblemDetailError) {
                throw error;
            }
            throw unknownErrorProblemDetail();
        }
    }

    public get<T>(endpoint: string, options?: RequestInit): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    public post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body),
            headers: {
                ...options?.headers,
                ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            },
        });
    }

    public put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: body instanceof FormData ? body : JSON.stringify(body),
            headers: {
                ...options?.headers,
                ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            },
        });
    }

    public patch<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: body instanceof FormData ? body : JSON.stringify(body),
            headers: {
                ...options?.headers,
                ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            },
        });
    }

    public delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }
}

export default new ApiClient(appConfig.apiUrl, authenticationHelper);