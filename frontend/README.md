# BIOMED XPERT Lead Tracker Web

React front end for the BIOMED XPERT Lead Tracker Dashboard. Vite, TypeScript, Tailwind, React Router, TanStack Query, React Hook Form, Axios, and Recharts.

## Setup

```
cp .env.example .env   # optional, leave VITE_API_BASE_URL empty to use the dev proxy
npm install
npm run dev            # http://localhost:5173
```

The dev server proxies `/api` and `/uploads` to `http://localhost:4000`, so run the API first. To point at a different API, set `VITE_API_BASE_URL` (for example `http://localhost:4000`).

```
npm run build          # type check then production build into dist/
npm run preview        # preview the production build
```

## Structure

```
src/
  lib/          api client (axios + token refresh), formatting, theme, query client, downloads
  types/        shared API types
  auth/         AuthContext, ProtectedRoute
  components/
    layout/     Sidebar, Topbar, AppLayout
    ui/         Field, SlideOver, ConfirmDialog, Badges, Pagination, Toast, States, Spinner
    charts/     PipelineSpine, ProportionBar, StageBars, Funnel, RevenueArea
  hooks/        TanStack Query hooks per resource
  features/
    auth        LoginPage
    dashboard   DashboardPage
    customers   CustomersPage, CustomerForm
    leads       LeadsBoardPage, LeadDetailPage, LeadForm, WonLostForms
    products    ProductsPage, ProductForm
    reports     ReportsPage
    settings    SettingsPage
    profile     ProfilePage
  App.tsx       routes
  main.tsx      providers and mount
```

## Design

Medical blue palette with light and dark themes driven by CSS variables on the `html.dark` class. Display type is IBM Plex Sans, body is Inter, and figures use IBM Plex Mono. The six stage pipeline spine is the signature element and appears on the dashboard and the board.

## Auth

The access token is held in memory and attached to every request. A silent refresh runs on load and on any 401 using the httpOnly refresh cookie, so a page reload keeps the session without storing tokens in the browser.
