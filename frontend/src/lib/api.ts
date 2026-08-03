import axios, { AxiosError, AxiosRequestConfig } from "axios";

const baseURL = (import.meta.env.VITE_API_BASE_URL || "") + "/api/v1";

export const api = axios.create({ baseURL, withCredentials: true });

let accessToken: string | null = null;
export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};
export const getAccessToken = (): string | null => accessToken;

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

const refresh = async (): Promise<string | null> => {
  try {
    const res = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
    const token = res.data?.data?.accessToken ?? null;
    setAccessToken(token);
    return token;
  } catch {
    setAccessToken(null);
    return null;
  }
};

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const url = original?.url ?? "";
    if (status === 401 && !original?._retry && !url.includes("/auth/")) {
      original._retry = true;
      refreshing = refreshing ?? refresh();
      const token = await refreshing;
      refreshing = null;
      if (token) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

export interface ApiError {
  code: string;
  message: string;
  details?: { path?: string; message: string }[];
}

export const apiError = (error: unknown): ApiError => {
  const err = error as AxiosError<{ error?: ApiError }>;
  return err.response?.data?.error ?? { code: "UNKNOWN", message: "Something went wrong" };
};

// Unwrap the { success, data, meta } envelope.
export const unwrap = <T>(payload: { data: T; meta?: unknown }): T => payload.data;

export const attemptRestore = refresh;
