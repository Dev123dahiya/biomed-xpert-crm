# Testing

This guide describes how to exercise BIOMED XPERT end to end and how to check the API directly.

## Prerequisites

Start the stack and seed the sample data. With Docker:

```
docker compose up --build -d
docker compose exec api npm run seed
```

Without Docker, start the API and web client as described in the root README, then run `npm run seed` in `backend/`.

## Manual walkthrough

1. Sign in. Open the web client and sign in with the sales account. A wrong password shows an inline error. A correct one lands on the dashboard.
2. Dashboard. Confirm the stat cards, the pipeline spine, the stage bars with counts, the funnel, the monthly revenue area, and the recent activity list all render with seeded data.
3. Add a customer. Go to Customers, add a doctor or hospital, and confirm it appears in the table. Search by name, company, or GSTIN.
4. Add a product. Go to Products and add a piece of equipment with a make, model, and unit price. A duplicate name, make, and model is rejected.
5. Create a lead. On the pipeline, add a lead, pick the customer and source, add a few products from the autocomplete, and set a priority. Choosing the Others source requires a description. Choosing a stage of Contacted or later enables the follow-up fields.
6. Move the lead. Open the lead, move it forward one stage, and confirm the timeline records the change. Backward moves are not offered.
7. Follow-ups. From the Contacted stage onward, add a follow-up and toggle it complete.
8. Win the deal. Mark the lead won with a final value and invoice number. Confirm the lead becomes terminal, the won section shows the equipment lines, and the customer total value increases by the final value.
9. Lose a deal. On another lead, mark it lost with a reason and confirm it becomes terminal.
10. Reports. On Reports, export each report to Excel, CSV, and PDF, and use targeted extraction to pull a single customer, a single lead, and a whole stage into Excel.
11. Settings and profile. As admin, change a setting and save. On Profile, change your password, sign out, and sign back in with the new password.

## API smoke test

Log in and capture the access token:

```
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@biomedxpert.com","password":"Admin@123"}' \
  | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')

curl -s http://localhost:4000/api/v1/dashboard -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:4000/api/v1/customers -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:4000/api/v1/leads/board -H "Authorization: Bearer $TOKEN"
```

Download a report as Excel:

```
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/v1/reports/leads?format=xlsx" -o leads.xlsx
```

## What to watch for

- A customer with leads cannot be deleted, and a product used by a lead cannot be deleted. Both return a clear conflict message.
- A lead accepts at most 15 products.
- Won and Lost are terminal. Attempting to change the status of a closed lead is rejected.
- Money values are whole rupees and stay exact through win and edit cycles.
- The customer total value always equals the sum of its won final values.

## Type checks

Both packages type check as part of their build:

```
cd backend && npm run typecheck
cd frontend && npm run build
```
