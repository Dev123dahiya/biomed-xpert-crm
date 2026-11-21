# Changelog

## 2.1.0 (November 2026)

### Interface redesign
- New visual language modelled on Linear, Attio and shadcn/ui: a dim sidebar with search and an account menu, and pages in an inset rounded panel with a slim header and breadcrumbs.
- Warm neutral palette with a single blue accent, near-black primary buttons, and Inter with display-size headings.
- Dashboard KPI cards with trend pills and sparklines, plus quieter charts and thinner funnel bars.
- Calmer pipeline board, soft avatars, and refined tables, chips, tabs and segmented controls.
- New split sign-in page with a live product preview, a new logo, favicon and social preview image.
- Collapse the sidebar with Ctrl or Cmd plus backslash.

## 2.0.0 (November 2026)

### Security and publishing
- Removed a live database connection string and JWT secrets from `backend/.env.example`. **Rotate the Neon password and JWT secrets if they were ever deployed.**
- The login page no longer pre-fills a working account.
- New `COOKIE_SAMESITE` setting so sessions survive a reload when the web and API are on different domains. `TRUST_PROXY` is supported for correct rate limiting behind a proxy.
- Seed passwords can be set with `SEED_ADMIN_PASSWORD` and `SEED_SALES_PASSWORD`.
- Only admins can delete leads. Deleting a won lead now recalculates the customer's total business.
- `vercel.json` adds SPA rewrites, security headers and asset caching. The font is now self-hosted.

### New features
- Redesigned interface with light and dark themes, a collapsible sidebar, mobile navigation, a command menu (Ctrl+K), notifications and an account menu.
- Dashboard: period comparison, 12-month trend, monthly target meter, stage values, funnel conversion, lead sources, top customers, lost reasons, team performance, and an agenda of overdue and upcoming follow-ups.
- Pipeline: drag and drop with floating Won and Lost targets, a list view with sorting, and URL-based filters.
- Lead workspace: stage tracker, notes on stage changes, editable equipment, quote PDF upload, follow-ups, owner reassignment, editable won and lost records, contact shortcuts and Excel export.
- Customer profiles, CSV import with de-duplication, and Excel export.
- Follow-ups agenda page.
- Settings: organisation details, monthly target, team management, lead sources and appearance.
- Reports: date-range presets including the Indian financial year, and searchable pickers for detailed extracts.

### API additions (no schema changes)
- `GET /api/v1/followups`: cross-lead agenda with overdue, today and upcoming counts.
- `GET /api/v1/team`: active-teammate directory for owner pickers.
- `POST /api/v1/customers/import`: bulk create with duplicate detection.
- `GET /api/v1/products/categories`.
- `GET /api/v1/dashboard`: adds `compareFrom`/`compareTo`, period comparison, trend, sources, top customers, lost reasons, team and target.
- Leads: `ownerId` on create and update, `stage=open|closed` filter, richer board and list rows.
- Search now covers products and matches by phone, GSTIN, city and notes.
- Notifications are created for wins, losses, stage changes and assignments.
- Settings: `monthlyTarget`, `orgPhone`, `orgEmail`, `orgAddress`, `orgGstin`.
