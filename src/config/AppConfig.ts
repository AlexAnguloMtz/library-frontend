type AppConfig = {
    apiUrl: string;
}

function getEnvVarOrFail(key: string): string {
    const value = import.meta.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export const appConfig: AppConfig = {
    apiUrl: getEnvVarOrFail("VITE_API_URL"),
};  