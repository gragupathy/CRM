# HM CRM — Phase 1

Generic multi-tenant sales CRM (auth, tenants, users/roles, accounts, contacts, leads, deals, activities, custom fields, reports).

## Run locally

```bash
npm install
npm run db:setup
npm run dev
```

Open http://localhost:3000

**Demo login:** `admin@demo.local` / `demo1234`  
Also: `manager@demo.local` and `sales@demo.local` (same password).

If the database is empty, use `/setup` to create the first company and admin.

**Email:** new teammates are invited; they confirm email by opening the invite link and setting a password. Forgot-password links expire in one hour. Without SMTP, those links are printed in the terminal.

## Hostinger

Use a **VPS**, not shared hosting. Install Node 22+, run `npm run build` then `npm start` behind Nginx. Switch `DATABASE_URL` to PostgreSQL for production (change Prisma `provider` to `postgresql` and run `prisma db push` or migrate).
