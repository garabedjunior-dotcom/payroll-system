# 🏗️ Underground Construction Payroll System

A comprehensive, responsive web application for managing productivity-based payroll for underground construction companies. Built with **Next.js 15**, **Supabase**, and **TypeScript**.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Database Schema](#-database-schema)
- [Business Logic](#-business-logic)
- [QuickBooks Integration](#-quickbooks-integration)
- [User Roles](#-user-roles)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Security](#-security)

---

## ✨ Features

### Priority 1: Approval Workflow System ⭐
- ✅ Multi-step approval process (Pending → Approved/Rejected → Locked)
- ✅ Role-based permissions (Supervisor → Manager → Owner)
- ✅ Batch approval capability
- ✅ Mandatory comments on rejection
- ✅ Email notifications on status change
- ✅ Complete audit trail with timestamps
- ✅ Immutable locked entries (post-payroll)

### Priority 2: Real-Time Dashboard 📊
- ✅ Role-based metrics display
- ✅ Auto-refresh every 30 seconds
- ✅ KPI widgets: Total Payroll, Hours, Production, Top Earners, Pending Approvals, OT Hours
- ✅ Drill-down capability (click-through to details)
- ✅ Date range and crew filters
- ✅ Export dashboard as PDF

### Priority 3: QuickBooks Export 💼
- ✅ **IIF format** for QuickBooks Desktop (2018-2024 compatible)
- ✅ **CSV format** for QuickBooks Online
- ✅ Separate W2 employees from 1099 contractors
- ✅ Validation before export (required fields, totals check)
- ✅ Preview export before download
- ✅ Prevent duplicate exports (period locking)

### Priority 4: Notifications & Alerts 🔔
- ✅ Email notifications (via Resend)
- ✅ In-app notification center
- ✅ Triggers: Timesheet submitted, Production approved/rejected, Payroll finalized
- ✅ Configurable alert rules
- ✅ Notification preferences per user

### Priority 5: Custom Reports 📈
- ✅ Worker Summary Report
- ✅ Crew Performance Report
- ✅ Pay Item Analysis
- ✅ Period Comparison (week-over-week)
- ✅ Export formats: PDF, Excel, CSV
- ✅ Scheduled reports (weekly/monthly email delivery)

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.3+
- **UI Components**: shadcn/ui + Tailwind CSS
- **State Management**: Zustand (3KB)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Tables**: TanStack Table v8

### Backend
- **Platform**: Supabase (PostgreSQL 15)
- **Authentication**: Supabase Auth (JWT + RLS)
- **API**: Next.js API Routes (serverless)
- **Real-time**: Supabase Realtime (WebSocket)
- **Storage**: Supabase Storage

### DevOps
- **Hosting**: Vercel (frontend) + Supabase (backend)
- **CI/CD**: GitHub Actions
- **Monitoring**: Vercel Analytics + Supabase Logs
- **Email**: Resend (5000 emails/month free)

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Next.js Frontend                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │Dashboard │  │Forms     │  │Reports   │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└───────────────────┬─────────────────────────────────────┘
                    │ API Calls (REST)
                    ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase (Backend)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │PostgreSQL 15 │  │Auth + RLS    │  │Storage       │ │
│  │(Database)    │  │(Security)    │  │(File Export) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│          Business Logic (TypeScript)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │Payroll Calc  │  │Workflow SM   │  │QB Exporter   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (LTS)
- npm or yarn or pnpm
- Supabase account (free tier works)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/payroll-system.git
cd payroll-system
```

2. **Install dependencies**
```bash
npm install
# or
pnpm install
```

3. **Setup Supabase**

Create a new Supabase project at [supabase.com](https://supabase.com)

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. **Run database migrations**

Install Supabase CLI:
```bash
npm install -g supabase
```

Link to your project:
```bash
supabase link --project-ref your-project-ref
```

Run migrations:
```bash
supabase db push
```

Seed database with demo data:
```bash
supabase db seed
```

5. **Start development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Accounts

```
Owner:
  Email: owner@undergroundcorp.com
  Password: Password123!

Manager:
  Email: manager@undergroundcorp.com
  Password: Password123!

Supervisor:
  Email: supervisor@undergroundcorp.com
  Password: Password123!
```

---

## 🗄️ Database Schema

### Core Tables

**users** - Authentication and role management
- `id` (UUID, PK)
- `email` (VARCHAR, UNIQUE)
- `role` (ENUM: owner, manager, supervisor)
- `full_name` (VARCHAR)
- `active` (BOOLEAN)

**workers** - Worker profiles and compensation settings
- `id` (UUID, PK)
- `worker_code` (VARCHAR, UNIQUE)
- `employee_type` (ENUM: W2, 1099)
- `base_hourly_rate` (DECIMAL)
- `ot_multiplier` (DECIMAL)
- `min_hourly_guarantee` (BOOLEAN)
- `piece_rate_enabled` (BOOLEAN)
- `crew` (VARCHAR)

**time_entries** - Daily time tracking
- `id` (UUID, PK)
- `worker_id` (UUID, FK)
- `entry_date` (DATE)
- `clock_in` / `clock_out` (TIME)
- `break_minutes` (INTEGER)
- `total_hours` (DECIMAL, COMPUTED)
- `status` (ENUM: pending, approved, rejected, locked)

**production_entries** - Daily production quantities
- `id` (UUID, PK)
- `worker_id` (UUID, FK)
- `pay_item_id` (UUID, FK)
- `quantity` (DECIMAL)
- `status` (ENUM: pending, approved, rejected, locked)

**payroll_calculations** - Calculated payroll results
- `id` (UUID, PK)
- `worker_id` (UUID, FK)
- `period_start` / `period_end` (DATE)
- `regular_hours` / `ot_hours` (DECIMAL)
- `piece_earnings` / `hourly_earnings` / `ot_premium` (DECIMAL)
- `total_pay` (DECIMAL)

See full schema: [supabase/migrations/001_initial_schema.sql](supabase/migrations/001_initial_schema.sql)

---

## 💼 Business Logic

### Payroll Calculation Formulas

Implemented in `lib/payroll/calculator.ts`, matching Excel formulas exactly:

```typescript
// Step 1: Calculate total hours
total_hours = SUM(approved_time_entries.total_hours)

// Step 2: Split regular vs overtime
regular_hours = MIN(total_hours, 40)
ot_hours = MAX(total_hours - 40, 0)

// Step 3: Calculate piece earnings
piece_earnings = SUM(approved_production.quantity × rate)

// Step 4: Calculate hourly earnings
hourly_earnings = regular_hours × base_hourly_rate

// Step 5: Calculate OT premium
// For W2 (1.5x): premium is 0.5x per OT hour
// For 1099 (1.0x): no premium
ot_premium = ot_hours × base_rate × (ot_multiplier - 1)

// Step 6: Apply minimum guarantee
guaranteed_pay = MAX(piece_earnings, hourly_earnings)

// Step 7: Final total
total_pay = guaranteed_pay + ot_premium
```

### Approval Workflow State Machine

Implemented in `lib/workflow/approval-state-machine.ts`:

```
pending → approved (by Manager/Owner)
pending → rejected (by Manager/Owner, requires comments)
approved → locked (by Owner, during payroll run)
rejected → pending (by Supervisor, resubmission)
locked → [terminal state, no transitions]
```

---

## 📤 QuickBooks Integration

### IIF Format (QuickBooks Desktop)

```
!TIMEACT	DATE	JOB	EMP	ITEM	PITEM	DURATION	NOTE
TIMEACT	01/27/2026		John Silva	Regular Pay		9.0	Regular hours
TIMEACT	01/27/2026		John Silva	Piece Rate - HDD_FT		450	HDD: 450 FT @ $0.85
```

### CSV Format (QuickBooks Online)

```csv
Employee,Date,Service Item,Quantity/Hours,Rate,Amount,Customer,Billable,Memo
John Silva,01/27/2026,Hourly Labor,9.00,18.00,162.00,,No,Regular hours
John Silva,01/27/2026,HDD Installation,450.00,0.85,382.50,,No,HDD: 450 FT
```

### Export Validation

- ✅ All required fields present
- ✅ Date format: MM/DD/YYYY
- ✅ Employee names sanitized
- ✅ Amounts positive
- ✅ Total matches payroll calculation (±$0.01 tolerance)
- ✅ W2 vs 1099 separation

---

## 👥 User Roles

### Owner (Full Access)
- Run payroll calculations
- Export to QuickBooks
- Manage pay items and rates
- View all financial reports
- Manage user accounts
- Access audit logs
- Lock entries after payroll

### Manager (Approval Authority)
- Approve/reject timesheets
- Approve/reject production entries
- View real-time dashboards
- Generate reports
- Manage worker profiles
- View crew performance

### Supervisor (Data Entry)
- Enter time data (clock in/out)
- Enter production quantities
- View own crew performance
- Submit entries for approval
- Resubmit rejected entries

---

## 🚢 Deployment

### Vercel (Frontend)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

### Supabase (Backend)

Already deployed when you create a Supabase project!

### Production Checklist

- [ ] Enable SSL/HTTPS (Vercel does this automatically)
- [ ] Setup daily database backups (Supabase Pro)
- [ ] Configure email service (Resend)
- [ ] Setup monitoring (Vercel Analytics)
- [ ] Enable Row Level Security (RLS) - already in migrations
- [ ] Test QuickBooks import with real QB Desktop/Online
- [ ] Setup domain name (optional)
- [ ] Configure CORS (Supabase dashboard)
- [ ] Enable rate limiting (Supabase Edge Functions)

---

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
Target: 80% code coverage

Critical paths tested:
- ✅ Payroll calculation engine
- ✅ Approval workflow state machine
- ✅ QuickBooks export generators
- ✅ Authentication and authorization

---

## 🔒 Security

### Authentication
- JWT access tokens (15 min expiry)
- Refresh tokens (7 day expiry)
- Secure HTTP-only cookies

### Authorization
- Row Level Security (RLS) enforced at database level
- Role-based access control (RBAC)
- API middleware checks on every protected route

### Data Protection
- Encryption at rest (Supabase TDE)
- Encryption in transit (TLS 1.3)
- Password hashing (bcrypt, 10 rounds)
- Audit logging for all financial transactions

### Input Validation
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitize all inputs)
- CSRF protection (token-based)

### Compliance
- FLSA: 7-year data retention (audit logs)
- SOX: Immutable audit trail
- GDPR: User data export/deletion (on request)

---

## 📞 Support

For issues, questions, or feature requests:
- GitHub Issues: [github.com/your-org/payroll-system/issues](https://github.com/your-org/payroll-system/issues)
- Email: support@undergroundcorp.com

---

## 📝 License

Proprietary - All Rights Reserved

---

## 🙏 Credits

Built with:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
