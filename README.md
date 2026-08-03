# BIOMED XPERT Lead Tracker Dashboard

A lead and sales tracker for a biomedical equipment business. Customers are the doctors and hospitals the team sells to. Leads move through a six stage pipeline, and a won deal captures the equipment sold, the final value, and the invoice. Reports and targeted extractions export to Excel, CSV, and PDF.

This repository holds a full stack application: a TypeScript API and a React web client, plus Docker orchestration and deployment and testing guides.

## What it does

- Track customers with contact details, GSTIN, balance, and total business to date.
- Move leads across New, Contacted, Qualified, Quote Shared, and the terminal Won and Lost stages, with a timeline of every change.
- Attach equipment products to a lead (up to 15), share quotes, and schedule follow-ups from the Contacted stage onward.
- Record a won deal with its final value and equipment lines, or a lost deal with a reason and competitor.
- See pipeline health on a dashboard: stage counts, funnel, monthly revenue, conversion, and win to loss ratio.
- Export any report or pull a single customer, a single lead, or a whole stage into Excel.

## Architecture

```
biomed-xpert-crm/
  backend/     Node.js, Express, TypeScript, Prisma, PostgreSQL
  frontend/    React, TypeScript, Vite, Tailwind, TanStack Query
  docs/        DEPLOYMENT.md, TESTING.md
  docker-compose.yml   full stack: database, API, and web
```

The API follows clean architecture with a repository layer for the aggregate roots, Zod validation, JWT auth with role based access, and an Excel first export layer. The web client is a single page app with a medical blue design system, silent token refresh, and query caching. Full detail lives in each package README.

## Quick start with Docker

```
docker compose up --build
```

This starts PostgreSQL, builds and runs the API on port 4000, and serves the web client on port 8080. On first boot the API pushes the schema to the database. Seed the sample data once:

```
docker compose exec api npm run seed
```

Open http://localhost:8080 and sign in.

## Quick start without Docker

Run the API:

```
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npx prisma db push
npm run seed
npm run dev
```

Run the web client in a second terminal:

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## Seeded accounts

| Role  | Email                   | Password   |
|-------|-------------------------|------------|
| Admin | admin@biomedxpert.com   | Admin@***  |
| Sales | sales@biomedxpert.com   | Sales@***  |

## Notes

- Money is stored as `Decimal(14,2)` and shown in whole rupees.
- `Customer.totalValue` is recomputed automatically from won deals. `balance` is manual.
- Passwords use bcryptjs, so there is no native build step.
- The API was assembled in an environment that could not reach Prisma's engine host, so the generated client is not bundled. Run `npm run prisma:generate` in `backend/` before starting the API. Docker builds do this automatically.

See `docs/DEPLOYMENT.md` for hosting and `docs/TESTING.md` for how to exercise the app end to end.
