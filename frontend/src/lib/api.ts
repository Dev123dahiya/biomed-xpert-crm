import axios, { AxiosError, AxiosRequestConfig } from "axios";

const apiOrigin = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const baseURL = apiOrigin + "/api/v1";

export const api = axios.create({ baseURL, withCredentials: true, timeout: 70_000 });

// Files such as quote PDFs are served by the API, which may live on another origin.
export const assetUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return apiOrigin + path;
};

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
    const res = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true, timeout: 70_000 });
    const token = res.data?.data?.accessToken ?? null;
    setAccessToken(token);
    return token;
  } catch {
    setAccessToken(null);
    return null;
  }
};

// Called when a refresh fails mid-session, so the app can send the user to sign in.
let onSessionExpired: (() => void) | null = null;
export const setSessionExpiredHandler = (fn: (() => void) | null): void => {
  onSessionExpired = fn;
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
      onSessionExpired?.();
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
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.code === "ECONNABORTED") return { code: "TIMEOUT", message: "The server took too long to respond. Try again in a moment." };
  if (err?.isAxiosError && !err.response) return { code: "NETWORK", message: "Can't reach the server. Check your connection and try again." };
  return { code: "UNKNOWN", message: "Something went wrong. Try again." };
};

// Unwrap the { success, data, meta } envelope.
export const unwrap = <T>(payload: { data: T; meta?: unknown }): T => payload.data;

export const attemptRestore = refresh;
