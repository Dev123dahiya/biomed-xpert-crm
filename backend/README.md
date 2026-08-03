# BIOMED XPERT Lead Tracker API

Backend for the BIOMED XPERT Lead Tracker Dashboard. Node.js, Express, TypeScript, Prisma, and PostgreSQL, built with clean architecture, the repository pattern, Zod validation, JWT auth, role based access, structured logging, rate limiting, Helmet, and CORS.

## Stack

Express 4, TypeScript 5, Prisma 5, PostgreSQL, Zod, jsonwebtoken, bcryptjs, pino, ExcelJS, PDFKit, Multer.

## Project layout

```
src/
  config/       env, prisma client, logger
  common/       AppError, response envelope, pagination, asyncHandler, types
  middleware/   authenticate, authorize, validate, errorHandler, rateLimit
  utils/        password (bcryptjs), jwt, money (Decimal helper)
  modules/
    auth        login, refresh, logout, me
    users       admin user management (repository)
    roles       role list and management
    leadSources lead source management
    customers   customers with search, timeline, delete guard (repository)
    products    catalog with autocomplete and duplicate guard (repository)
    leads       leads plus status, timeline, products, quotes, won, lost, follow-ups
    dashboard   overview metrics, funnel, monthly revenue, activity
    reports     report tables with xlsx, csv, pdf export, plus targeted extraction
    notifications
    settings    general settings with admin write
    search      cross entity search
  app.ts        express assembly and route mounts
  server.ts     bootstrap and graceful shutdown
prisma/
  schema.prisma database schema
  seed.ts       seed data (roles, users, sources, products, sample leads)
```

## Setup

1. Copy the environment file and set the secrets.

   ```
   cp .env.example .env
   ```

   Set `DATABASE_URL` to your PostgreSQL instance and set both JWT secrets to long random strings.

2. Install dependencies.

   ```
   npm install
   ```

3. Generate the Prisma client and create the schema.

   ```
   npm run prisma:generate
   npx prisma db push
   ```

   Prefer migration history instead of push? Run `npx prisma migrate dev --name init`.

4. Seed the database.

   ```
   npm run seed
   ```

5. Start the API.

   ```
   npm run dev      # watch mode
   npm run build && npm start   # production build
   ```

The API listens on `http://localhost:4000`. Health check at `GET /health`.

## Seeded accounts

| Role  | Email                   | Password   |
|-------|-------------------------|------------|
| Admin | admin@biomedxpert.com   | Admin@123  |
| Sales | sales@biomedxpert.com   | Sales@123  |

## Docker

```
docker compose up --build
```

This starts PostgreSQL and the API, pushes the schema on boot, and serves on port 4000. Seed once with `docker compose exec api npm run seed`.

## Authentication

`POST /api/v1/auth/login` returns an access token in the body and sets an httpOnly refresh cookie. Send the access token as `Authorization: Bearer <token>` on every protected route. Refresh with `POST /api/v1/auth/refresh`. Admin only routes are the user, role, lead source, and settings write endpoints.

## API surface

All routes are under `/api/v1`.

- `auth`: `POST /login`, `POST /refresh`, `POST /logout`, `GET /me`
- `customers`: list, create, get, update, delete, `GET /:id/timeline`
- `products`: list, `GET /autocomplete`, create, get, update, delete
- `leads`: list, `GET /board`, create, get, update, delete, `PATCH /:id/status`, `GET /:id/timeline`, product lines (`PUT/POST/DELETE /:id/products`), quotes (`GET/POST/DELETE /:id/quotes`), won (`POST/GET/PATCH /:id/won`), lost (`POST/GET/PATCH /:id/lost`), follow-ups (`GET/POST/PATCH/DELETE /:id/followups`)
- `dashboard`: `GET /` overview
- `reports`: `GET /customers`, `/leads`, `/revenue`, `/sales`, `/monthly` with `?format=json|xlsx|csv|pdf`
- `export`: `GET /customers/:id`, `GET /leads/:id`, `GET /leads?stage=` (Excel by default)
- `users`, `roles`, `lead-sources`, `settings`, `notifications`, `search`

## Notes

- Money is stored as `Decimal(14,2)` and serialized to plain numbers in responses.
- `Customer.totalValue` is recomputed automatically as the sum of won final values whenever a deal is won or edited. `Customer.balance` is a manual field.
- A lead holds at most 15 product lines. Follow-ups are available once a lead reaches the Contacted stage. The `Others` source requires the free text description.
- Pipeline transitions through `/status` move forward only across New, Contacted, Qualified, and Quote Shared. Won and Lost are terminal and use their own endpoints.
- Passwords are hashed with bcryptjs, so there is no native build step.
- Report exports support Excel, CSV, and PDF. Excel is the default for targeted extraction.

## A note on the packaged build

This project was assembled and type checked in an environment that could not reach Prisma's engine download host, so the generated Prisma client is not bundled. Run `npm run prisma:generate` (step 3) on your machine to produce it before starting the API.
