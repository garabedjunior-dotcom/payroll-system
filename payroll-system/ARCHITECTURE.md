# 🏛️ Architecture Documentation

## System Overview

The Underground Construction Payroll System is a full-stack web application built with modern serverless architecture, emphasizing security, scalability, and cost-effectiveness.

---

## 🎯 Architecture Goals

1. **Security First**: Row-level security (RLS) at database level, RBAC at application level
2. **Cost Efficient**: Serverless architecture with generous free tier
3. **Scalable**: Auto-scaling to handle 50-200 workers
4. **Maintainable**: Clean separation of concerns, typed interfaces
5. **Compliant**: FLSA 7-year data retention, immutable audit logs

---

## 📊 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Browser   │  │  Mobile    │  │  Tablet    │            │
│  │  Desktop   │  │  Safari    │  │  Chrome    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTPS / WSS
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│                      Next.js 15 App                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React Components (shadcn/ui + Tailwind)            │   │
│  │  ├─ Dashboard (Recharts)                            │   │
│  │  ├─ Forms (React Hook Form + Zod)                   │   │
│  │  ├─ Tables (TanStack Table)                         │   │
│  │  └─ Reports (PDF/Excel generation)                  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  State Management (Zustand)                         │   │
│  │  ├─ Auth State                                      │   │
│  │  ├─ UI State (modals, toasts)                       │   │
│  │  └─ Cache (dashboard metrics)                       │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬─────────────────────────────────────┘
                         │ REST API + WebSocket
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│                  Next.js API Routes                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Business Logic                                      │   │
│  │  ├─ PayrollCalculator (lib/payroll/calculator.ts)   │   │
│  │  ├─ ApprovalStateMachine (lib/workflow/)            │   │
│  │  ├─ QuickBooksExporter (lib/export/)                │   │
│  │  └─ NotificationService (lib/notifications/)        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Middleware                                          │   │
│  │  ├─ Auth Middleware (JWT validation)                │   │
│  │  ├─ RBAC Middleware (role checks)                   │   │
│  │  └─ Error Handler                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬─────────────────────────────────────┘
                         │ Supabase Client SDK
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                     DATA ACCESS LAYER                        │
│                    Supabase Platform                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Authentication & Authorization                      │   │
│  │  ├─ Supabase Auth (JWT)                             │   │
│  │  ├─ Row Level Security (RLS)                        │   │
│  │  └─ Role-Based Policies                             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostgreSQL 15 Database                             │   │
│  │  ├─ Tables (users, workers, entries, payroll)       │   │
│  │  ├─ Functions (business logic, triggers)            │   │
│  │  ├─ Indexes (optimized queries)                     │   │
│  │  └─ Audit Logs (immutable trail)                    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Real-time Subscriptions                            │   │
│  │  └─ WebSocket (dashboard updates, notifications)    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Storage                                             │   │
│  │  └─ File Storage (QuickBooks exports, reports)      │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Resend      │  │  Vercel      │  │  QuickBooks  │      │
│  │  (Email)     │  │  (Analytics) │  │  (Import)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Architecture

### Defense in Depth Strategy

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Network Security                              │
│ ├─ HTTPS/TLS 1.3 (Vercel Edge)                        │
│ ├─ CORS policies                                       │
│ └─ Rate limiting (Supabase Edge Functions)            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Application Security                          │
│ ├─ JWT authentication (15min expiry)                   │
│ ├─ Refresh tokens (7 days, HTTP-only cookies)         │
│ ├─ CSRF protection (token-based)                       │
│ └─ Input validation (Zod schemas)                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Authorization                                 │
│ ├─ RBAC (3 roles: owner, manager, supervisor)         │
│ ├─ RLS policies (database level)                       │
│ └─ API middleware (role checks on every request)       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Data Security                                 │
│ ├─ Encryption at rest (Supabase TDE)                   │
│ ├─ Parameterized queries (SQL injection prevention)    │
│ ├─ XSS prevention (sanitize outputs)                   │
│ └─ Audit logging (immutable, 7-year retention)         │
└─────────────────────────────────────────────────────────┘
```

### Row Level Security (RLS) Examples

```sql
-- Supervisors can only see their own submissions
CREATE POLICY "Supervisors can view own submissions"
  ON time_entries FOR SELECT
  USING (submitted_by = auth.uid() OR is_manager_or_owner());

-- Cannot modify locked entries
CREATE POLICY "Locked entries cannot be modified"
  ON time_entries FOR UPDATE
  USING (status != 'locked');

-- Only owners can lock entries
CREATE POLICY "Only owners can lock"
  ON time_entries FOR UPDATE
  USING (is_owner() AND NEW.status = 'locked');
```

---

## 🔄 Data Flow

### 1. Time Entry Submission Flow

```
Supervisor → Submit Time Entry
    ↓
Frontend validates (Zod)
    ↓
API Route: POST /api/time-entries
    ↓
Auth Middleware (check JWT)
    ↓
RBAC Middleware (check role = supervisor)
    ↓
Supabase Client → INSERT time_entries
    ↓
RLS Policy (check submitted_by = auth.uid())
    ↓
Trigger: audit_trigger_function
    ↓
Insert into audit_logs
    ↓
Notification Service → Email Manager
    ↓
Response: 201 Created
```

### 2. Approval Workflow

```
Manager → Approve Entry
    ↓
Frontend: ApprovalStateMachine.validateTransition()
    ↓
API Route: PUT /api/time-entries/:id/approve
    ↓
State Machine: pending → approved
    ↓
Supabase: UPDATE time_entries
    ↓
RLS: is_manager_or_owner() = true
    ↓
Trigger: audit_trigger_function
    ↓
Notification: Email Supervisor
    ↓
Real-time: Broadcast to dashboard (WebSocket)
    ↓
Response: 200 OK
```

### 3. Payroll Calculation Flow

```
Owner → Calculate Payroll (period_start, period_end)
    ↓
API Route: POST /api/payroll/calculate
    ↓
Fetch all approved entries for period
    ↓
PayrollCalculator.calculatePayroll()
    ↓
For each worker:
    ├─ SUM time_entries.total_hours
    ├─ SUM production_entries × rates
    ├─ Apply formulas (regular, OT, piece, guarantee)
    └─ Return PayrollResult
    ↓
Lock all entries (status = 'locked')
    ↓
INSERT payroll_calculations
    ↓
UPDATE pay_periods (status = 'closed')
    ↓
Response: { calculations: [...], total_payroll: 12345.67 }
```

### 4. QuickBooks Export Flow

```
Owner → Export to QuickBooks
    ↓
API Route: GET /api/payroll/export?format=iif&period_id=...
    ↓
Fetch payroll_calculations for period
    ↓
QuickBooksIIFExporter.generateIIF()
    ↓
Validate export (totals, required fields)
    ↓
Generate file content (tab-delimited)
    ↓
Upload to Supabase Storage
    ↓
UPDATE pay_periods (exported_at = NOW())
    ↓
Response: File download (Content-Type: text/plain)
```

---

## 💾 Database Design

### Schema Principles

1. **Normalization**: 3NF to minimize redundancy
2. **Referential Integrity**: Foreign keys with CASCADE/RESTRICT
3. **Computed Columns**: `total_hours` computed from clock times
4. **Versioning**: Rate table with effective_from/effective_to
5. **Soft Deletes**: `active` flag instead of hard deletes
6. **Audit Trail**: Triggers on critical tables

### Key Indexes

```sql
-- Time-based queries (most common)
CREATE INDEX idx_time_worker_date ON time_entries(worker_id, entry_date);
CREATE INDEX idx_prod_worker_date ON production_entries(worker_id, entry_date);
CREATE INDEX idx_payroll_period ON payroll_calculations(period_start, period_end);

-- Status-based queries (approvals)
CREATE INDEX idx_time_status ON time_entries(status);
CREATE INDEX idx_prod_status ON production_entries(status);

-- Audit queries
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
```

---

## 🚀 Performance Optimizations

### Frontend

- **Code Splitting**: Next.js automatic code splitting per route
- **Image Optimization**: Next.js Image component (WebP, lazy load)
- **Bundle Size**: Zustand (3KB) instead of Redux (30KB+)
- **Memoization**: React.memo on expensive components
- **Debouncing**: Search inputs debounced (300ms)

### Backend

- **Query Optimization**: Indexed columns, avoid N+1 queries
- **Caching**: Dashboard metrics cached (5 min TTL)
- **Batch Operations**: Batch approval endpoint
- **Connection Pooling**: Supabase handles automatically
- **Real-time**: WebSocket for live updates (avoid polling)

### Database

- **Partial Indexes**: `WHERE status != 'locked'` for faster queries
- **Materialized Views**: Dashboard metrics (refreshed hourly)
- **Partitioning**: Consider for audit_logs (by year)
- **VACUUM**: Auto-vacuum enabled

---

## 📈 Scalability

### Current Capacity

- **Workers**: 50-200 (tested)
- **Entries/week**: 500+ (tested)
- **Concurrent Users**: 5-10
- **Dashboard Load**: <2s

### Scaling Strategy

**Vertical Scaling (Supabase)**:
- Free tier → Pro ($25/mo) → Team ($599/mo)
- More compute, RAM, storage

**Horizontal Scaling (if needed)**:
- Read replicas for reports (Supabase Fly Postgres)
- CDN for static assets (Vercel Edge)
- Edge Functions for compute-heavy tasks

**Future Optimizations**:
- ElasticSearch for full-text search
- Redis for session caching
- Message queue (BullMQ) for background jobs

---

## 🧪 Testing Strategy

### Unit Tests (80% coverage target)
- **Business Logic**: Payroll calculator, workflow state machine
- **Utilities**: Date formatters, validators, exporters
- **Isolated**: No database, mocked dependencies

### Integration Tests
- **API Endpoints**: Full request/response cycle
- **Database**: Real Supabase connection (test schema)
- **Auth**: JWT generation, RLS policies

### E2E Tests
- **Critical Paths**:
  - Login → Dashboard → Approve Entry
  - Login → Calculate Payroll → Export QB
- **Browsers**: Chrome, Safari, Firefox
- **Mobile**: iOS Safari, Android Chrome

---

## 🔧 Deployment Architecture

```
┌──────────────────────┐
│   GitHub Repository  │
│   (main branch)      │
└──────────┬───────────┘
           │ git push
           ▼
┌──────────────────────┐
│   GitHub Actions     │
│   (CI/CD Pipeline)   │
│  ├─ Lint & Type     │
│  ├─ Run Tests       │
│  ├─ Build Next.js   │
│  └─ Deploy          │
└──────────┬───────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐  ┌─────────┐
│ Vercel  │  │Supabase │
│ (Edge)  │  │(Database│
│         │  │& Backend│
└─────────┘  └─────────┘
```

### Environments

- **Development**: localhost + Supabase local
- **Staging**: Vercel preview + Supabase staging
- **Production**: Vercel production + Supabase production

---

## 📊 Monitoring & Observability

### Metrics to Track

- **Performance**: Page load time, API response time
- **Errors**: Error rate, exception types
- **Usage**: Active users, peak hours, feature usage
- **Business**: Total payroll, approval times, export frequency

### Tools

- **Vercel Analytics**: Real User Monitoring (RUM)
- **Supabase Logs**: Database queries, errors
- **Sentry** (optional): Error tracking
- **PostHog** (optional): Product analytics

---

## 🔮 Future Enhancements

### Phase 2 Features

1. **Mobile App** (React Native)
2. **SMS Notifications** (Twilio)
3. **Advanced Analytics** (predictive costing)
4. **Multi-language** (i18n)
5. **Document Management** (W-4, I-9 uploads)

### Technical Debt

- Migrate to React Server Components (RSC)
- Add GraphQL layer (optional)
- Implement caching strategy (Redis)
- Setup automated performance testing

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-20  
**Author**: Super Prompt Engineer
