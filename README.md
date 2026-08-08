# School ERP System - Project Foundation

Enterprise School Management and Information System built with NestJS, PostgreSQL (Prisma ORM), Next.js 14, Tailwind CSS, and JWT Role-Based Access Control (RBAC). Multi-tenant ready architecture.

---

## 🏗️ Project Architecture

```
/
├── backend/                  # NestJS API application
│   ├── prisma/
│   │   ├── schema.prisma    # PostgreSQL Database Schema
│   │   └── seed.ts          # Database seed script (Tenant & Admin user)
│   ├── src/
│   │   ├── auth/            # Auth module (JWT login, refresh, roles guard)
│   │   ├── users/           # Shared user management
│   │   ├── tenants/         # Multi-tenant school accounts
│   │   ├── students/        # Student profiles skeleton
│   │   ├── staff/           # Staff profiles skeleton
│   │   └── classes/         # Classes & streams skeleton
│   └── .env.example
│
├── frontend/                 # Next.js 14 App Router application
│   ├── app/
│   │   ├── login/           # Login page
│   │   └── admin/dashboard/ # Protected Admin Dashboard
│   ├── components/
│   │   ├── layout/          # Sidebar, Topbar matching Design System
│   │   └── ui/              # StatusPill, CodeBadge
│   └── .env.example
│
└── README.md
```

---

## 🎨 Design System

All frontend pages strictly follow the **School ERP Design System**:
- **Sidebar**: `bg-slate-950`, text `text-slate-300`/`text-white`, role portal indicator badge.
- **Top bar**: White background, `border-slate-200`, `font-serif` heading, search, notifications, profile.
- **Typography**: Headings use `font-serif font-semibold` (institutional/academic feel). UI uses default `font-sans`.
- **System Code Badges**: Student IDs, Staff IDs, Admission Numbers use `font-mono` pill badges (`rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-700`).
- **Status Pills**: Color-coded status dots with soft backgrounds (`emerald` active, `amber` pending, `rose` inactive/alert).
- **Primary Buttons**: `bg-slate-900 text-white rounded-lg px-3 py-2 text-xs font-medium hover:bg-slate-800`.
- **Secondary Buttons**: `border border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700`.

---

## 🚀 Quick Setup & Installation

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

Ensure your PostgreSQL database is running and update `DATABASE_URL` in `backend/.env` if necessary.

```bash
# Generate Prisma Client
npm run prisma:generate

# Run Database Migrations (or push schema)
npx prisma db push

# Seed initial Tenant and Admin User
npm run seed
```

#### Seeded Credentials:
- **School Email**: `admin@school.com`
- **Password**: `AdminPass123!`
- **Role**: `ADMIN`
- **School Code**: `SJA001` (St. Jude Academic School)

```bash
# Start Backend Development Server (runs on http://localhost:3001)
npm run start:dev
```

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Start Next.js Development Server (runs on http://localhost:3000)
npm run dev
```

---

## 🔐 Auth Flow & API Endpoints

- `POST /auth/login` — Authenticates email & password, returns JWT `access_token` and `refresh_token` alongside user info.
- `POST /auth/refresh` — Validates refresh token and returns new token pair.
- `GET /auth/me` — Protected endpoint returning current user details from JWT strategy.
- `@Roles(Role.ADMIN)` Guard — Restricts protected routes to users with `ADMIN` role.

---

## 🧪 Verification Steps

1. Start both backend (`http://localhost:3001`) and frontend (`http://localhost:3000`).
2. Open `http://localhost:3000/login` in your browser.
3. Login using `admin@school.com` and `AdminPass123!`.
4. Verify redirection to `/admin/dashboard`.
5. Observe the header **"Welcome, Admin"**, dark `bg-slate-950` sidebar, serif typography, monospace code badges (`ADM-2026-089`, `STD-10A-042`), status pills, and stat cards.
