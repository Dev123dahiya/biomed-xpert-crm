# Deployment

This guide covers running BIOMED XPERT in production. The application has three parts: a PostgreSQL database, the API, and the static web client.

## Environment variables

The API reads these (see `backend/.env.example`):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | signing key for access tokens, set a long random value |
| `JWT_REFRESH_SECRET` | signing key for refresh tokens, set a long random value |
| `JWT_ACCESS_TTL` | access token lifetime, default `15m` |
| `JWT_REFRESH_TTL` | refresh token lifetime, default `7d` |
| `CORS_ORIGIN` | comma separated list of allowed web origins |
| `COOKIE_SECURE` | `true` in production so the refresh cookie is sent over HTTPS only |
| `PORT` | API port, default `4000` |
| `UPLOAD_DIR` | folder for quote PDF uploads |

The web client reads `VITE_API_BASE_URL` at build time. Leave it empty when the web server proxies `/api` to the API on the same origin, which is the recommended setup because the refresh cookie then works without cross site cookie handling.

## Option 1: Docker Compose

The root `docker-compose.yml` builds and runs all three parts.

```
docker compose up --build -d
docker compose exec api npm run seed   # first run only
```

The web client is served on port 8080 and proxies `/api` and `/uploads` to the API container. For a real deployment:

1. Replace the JWT secrets with long random strings.
2. Set `COOKIE_SECURE` to `true` and terminate TLS in front of the web container.
3. Point `CORS_ORIGIN` at your public web origin.
4. Back up the `pgdata` volume.

## Option 2: Separate hosts

Database. Provision a managed PostgreSQL instance and set `DATABASE_URL`.

API. Build and run the backend:

```
cd backend
npm ci
npm run prisma:generate
npx prisma migrate deploy   # or: npx prisma db push
npm run build
node dist/server.js
```

Run behind a process manager and a reverse proxy that terminates TLS. Persist the `UPLOAD_DIR` folder or mount object storage.

Web. Build the static client and serve `dist/` from any static host or CDN. If the client and API are on different origins, set `VITE_API_BASE_URL` to the API URL, add that web origin to `CORS_ORIGIN`, and serve both over HTTPS so the `SameSite` cookie is accepted.

```
cd frontend
npm ci
VITE_API_BASE_URL=https://api.example.com npm run build
```

## Database schema and migrations

For a first deployment, `npx prisma db push` creates the schema directly from `backend/prisma/schema.prisma`. For teams that want a migration history, run `npx prisma migrate dev --name init` once in development to generate `backend/prisma/migrations`, commit it, and use `npx prisma migrate deploy` in production.

## Health and logs

The API exposes `GET /health` for readiness checks. Logs are structured JSON in production through pino. Point your log collector at stdout.

## Backups

Schedule regular dumps of the PostgreSQL database and snapshot the uploads folder. Both hold data that cannot be regenerated.
