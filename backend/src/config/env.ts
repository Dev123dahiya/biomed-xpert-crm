import dotenv from "dotenv";

dotenv.config();

const required = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/biomedxpert?schema=public"),
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET", "dev-access-secret-change-me"),
    refreshSecret: required("JWT_REFRESH_SECRET", "dev-refresh-secret-change-me"),
    accessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL ?? "7d",
  },
  corsOrigin: (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(","),
  cookieSecure: process.env.COOKIE_SECURE === "true",
  // "none" is required when the web app and the API live on different sites
  // (for example Vercel for the web and Render for the API). It needs HTTPS.
  cookieSameSite: (["lax", "strict", "none"].includes(String(process.env.COOKIE_SAMESITE).toLowerCase())
    ? String(process.env.COOKIE_SAMESITE).toLowerCase()
    : "lax") as "lax" | "strict" | "none",
  // Number of reverse proxies in front of the API (Render, Railway, Nginx).
  // Needed so rate limiting sees the real client IP instead of the proxy.
  trustProxy: Number(process.env.TRUST_PROXY ?? (process.env.NODE_ENV === "production" ? 1 : 0)),
  apiRateLimit: Number(process.env.API_RATE_LIMIT ?? 1000),
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024),
} as const;

export const isProd = env.nodeEnv === "production";
