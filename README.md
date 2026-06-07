# Gupta Traders — Inventory & Purchase Management System

A secure, responsive **Inventory, Purchase & Tender Management System** for construction/engineering procurement businesses. Built as a MERN monorepo with role-based access control.

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Frontend** (`apps/web`): React 18, Vite, TypeScript, TanStack Query, TailwindCSS, Recharts
- **Backend** (`apps/api`): Express, Mongoose, JWT auth, Zod validation
- **Shared** (`packages/shared`): Types, enums, Zod schemas
- **Database**: MongoDB

## Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- MongoDB running locally or a remote connection string

## Setup

```bash
# Install dependencies
pnpm install

# Copy environment files (one per app)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Edit apps/api/.env — MongoDB URI, JWT secrets, CORS_ORIGIN
# Edit apps/web/.env — VITE_API_URL (default /api uses Vite proxy)

# Build shared package
pnpm --filter shared build

# Seed database (creates admin user + sample data)
pnpm seed

# Start dev servers (API on :5000, Web on :5173)
pnpm dev
```

## Login (two separate flows)

**Admin** — credentials in `apps/api/.env` (`ADMIN_LOGIN_ID` / `ADMIN_PASSWORD`):

- Login page → **Admin Login** tab → `POST /api/auth/admin/login`
- Can create team users (data operator / accountant) under **Team & Roles**

**Team** — MongoDB users created by admin:

- Login page → **Team Login** tab → email + password
- After `pnpm seed`: `operator@example.com` / `accountant@example.com` — password `Team@12345`

## Roles

| Role | Access |
|------|--------|
| **admin** | Full access including Team & Activity Logs |
| **data_operator** | Purchases, Tenders, Inventory, Sites, Vendors, Items, Dashboard |
| **accountant** | Same as data_operator |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run API + Web concurrently |
| `pnpm build` | Build all packages |
| `pnpm seed` | Seed MongoDB with sample data |
| `pnpm typecheck` | TypeScript check all packages |

## Project Structure

```
apps/
  api/          Express backend (MongoDB, JWT, modular routes)
  web/          React frontend (Vite, Tailwind, React Query)
packages/
  shared/       Shared types, enums, Zod validation schemas
```

## Features

- Site-wise purchase ledger with GST/freight/labour calculations
- Tender tracking with BG expiry alerts
- Site-wise inventory matrix (editable pivot grid)
- Master data: Sites, Vendors, Items
- Dashboard with KPIs and charts
- Excel/PDF export
- Role-based access control
- Activity audit logs (admin)

## Environment Variables

**API** (`apps/api/.env`):

- `MONGODB_URI` — MongoDB connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — JWT signing keys
- `CORS_ORIGIN` — Frontend URL (default: http://localhost:5173)
- `PORT` — API port (default: 5000)
- `ADMIN_LOGIN_ID` / `ADMIN_PASSWORD` — admin portal (not stored in MongoDB)

**Web** (`apps/web/.env`):

- `VITE_API_URL` — API base URL (`/api` in dev uses the Vite proxy to port 5000)
