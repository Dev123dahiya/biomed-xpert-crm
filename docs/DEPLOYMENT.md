# Deployment

BIOMED XPERT has three parts: a PostgreSQL database, the API (`backend/`) and the static web client (`frontend/`).

## Recommended setup: Vercel (web) + Render or Railway (API) + Neon (database)

### 1. Database
Create a Neon (or any managed PostgreSQL) database and copy its connection string. **Keep it out of git.** If a connection string was ever committed, reset the database password in the provider's console. Removing it from the file is not enough, because it stays in git history.

### 2. API
Deploy `backend/` (it has a Dockerfile, or use `npm ci && npm run build` and `node dist/server.js`). Set these environment variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | your Neon connection string |
| `JWT_ACCESS_SECRET` | a long random string, e.g. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | a different long random string |
| `CORS_ORIGIN` | your web URL, e.g. `https://biomed-xpert-crm.vercel.app` (comma-separate several) |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `none` when the web and API are on different domains (Vercel + Render). Otherwise `lax`. |
| `TRUST_PROXY` | `1` on Render, Railway or Heroku |
| `API_RATE_LIMIT` | optional, requests per 15 minutes per IP (default 1000) |
| `UPLOAD_DIR` | folder for quote PDFs (default `uploads`) |

`COOKIE_SAMESITE=none` matters. Without it, browsers drop the refresh cookie between `vercel.app` and `onrender.com`, and everyone is signed out whenever they reload the page.

Apply the schema once: `npx prisma db push` (or `prisma migrate deploy` if you keep migrations). The new features need **no schema changes**. Monthly targets and organisation details use the existing `Setting` table.

**Uploads:** Render's free disk is wiped on every deploy, so uploaded quote PDFs would disappear. Attach a persistent disk and point `UPLOAD_DIR` at it, or move uploads to object storage.

### 3. Web (Vercel)
- Root directory: `frontend`
- Framework preset: Vite (build `npm run build`, output `dist`)
- Environment variable: `VITE_API_BASE_URL=https://<your-api-host>` (no trailing slash, no `/api/v1`)

`frontend/vercel.json` rewrites every route to `index.html`, so deep links such as `/leads/abc` work on refresh. It also sets security headers and long-term caching for hashed assets. `public/robots.txt` keeps the CRM out of search engines. Remove it if you want the login page indexed.

## Option 2: Docker Compose

```
docker compose up --build -d
docker compose exec api npm run seed   # first run only
```

The web client is served on port 8080 and proxies `/api` and `/uploads` to the API container. Before going live, replace the JWT secrets, set `COOKIE_SECURE=true`, terminate TLS in front of the web container, point `CORS_ORIGIN` at your public origin, and back up the `pgdata` volume.

## Health and logs

`GET /health` is a readiness check. Logs are structured JSON from pino on stdout.

## Backups

Schedule regular database dumps (Neon has point-in-time restore) and snapshot the uploads folder.
