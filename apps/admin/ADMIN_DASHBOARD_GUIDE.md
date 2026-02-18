# Admin Dashboard Guide

This document explains what is included in the BarterDash admin dashboard, how each module works, and which backend APIs power each screen.

## Stack

- Frontend: React + Vite + TypeScript
- UI: Tailwind + shadcn-style components
- Server state: TanStack Query
- Local state: Zustand
- Auth: Supabase session + backend role validation

## Access Model

1. Admin signs in through Supabase on `/login`.
2. Frontend sends Supabase bearer token to backend APIs.
3. Backend resolves role from `profiles.is_admin` in auth middleware.
4. If user is not admin, dashboard blocks access.

## Routes In Dashboard

- `/` Overview
- `/analytics` Platform analytics
- `/applications` Seller application review
- `/disputes` Claims and escrow dispute resolution
- `/reports` Report moderation
- `/refunds` Refund operations
- `/users` User management
- `/activity` Admin activity timeline

## Module Details

### 1. Overview

Purpose:
- Entry point for operations.
- Quick links to all admin modules.
- Recent admin activity summary.

Data source:
- `GET /api/v1/admin/activity`

### 2. Analytics

Purpose:
- Platform health and KPI visibility for admins.

Includes:
- User/seller/admin counts
- Pending moderation and risk queues
- Financial snapshots (delivered revenue, held/disputed/refunded escrow)
- Lookback trend (7/30/90 days)
- KPI charts:
  - Moderation backlog bar chart
  - Trend volume bar chart
  - Financial composition pie chart
- Breakdown tables for user/report/refund/dispute statuses
- Export actions:
  - CSV export of snapshot, financial, trend, and breakdown metrics
  - PDF export for analytics reporting

Data source:
- `GET /api/v1/admin/analytics/overview?lookback_days=7|30|90`

### 3. Seller Applications

Purpose:
- Review seller onboarding and verification outcomes.

Includes:
- Paginated queue with status filter
- Manual approve/reject/mock approve actions
- Identity status lookup by application ID

Data sources:
- `GET /api/v1/sellers/applications`
- `GET /api/v1/sellers/applications/:id/identity`
- `POST /api/v1/sellers/applications/:id/approve`
- `POST /api/v1/sellers/applications/:id/reject`
- `POST /api/v1/sellers/applications/:id/mock-approve`

### 4. Claims & Disputes

Purpose:
- Resolve escrow claims/disputes.

Includes:
- Dispute queue with status filters
- Admin resolution action:
  - `release` (release escrow to seller)
  - `refund` (refund escrow to buyer)

Data sources:
- `GET /api/v1/admin/disputes`
- `POST /api/v1/admin/disputes/:escrowId/resolve`

Resolution behavior:
- `release` calls escrow release flow.
- `refund` calls escrow refund flow.
- Backend validates status before resolving.

### 5. Reports

Purpose:
- Moderation workflow for user/stream/product reports.

Includes:
- Paginated reports table with status filters
- Resolve/dismiss action with notes

Data sources:
- `GET /api/v1/reports`
- `GET /api/v1/reports/:id`
- `PATCH /api/v1/reports/:id/resolve`

### 6. Refunds

Purpose:
- Refund operation queue and processing.

Includes:
- Paginated refund table with status filters
- Fetch by refund ID or order ID
- Process approve/reject decisions

Data sources:
- `GET /api/v1/refunds`
- `GET /api/v1/refunds/:id`
- `GET /api/v1/refunds/order/:orderId`
- `PATCH /api/v1/refunds/:id/process`

### 7. User Management

Purpose:
- Admin control of account moderation and access.

Includes:
- Paginated user list
- Search by username/full name
- Filter by role/status
- Update:
  - `account_status`
  - `is_admin`
  - `is_seller`

Data sources:
- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/:id`

Safety rule:
- Backend blocks self-demotion from admin (`is_admin=false` for own account).

### 8. Activity Timeline

Purpose:
- Audit-style timeline for admin actions.

Includes:
- Combined feed for applications/reports/refunds
- Filter by area
- Pagination

Data source:
- `GET /api/v1/admin/activity`

## Pagination Pattern

All queue screens follow the same response shape:

```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNextPage": true
  }
}
```

## Environment Requirements (Admin App)

Set in `apps/admin/.env`:

- `VITE_API_URL` - Backend API base (`.../api/v1`)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key

## Operational Notes

- Backend is the source of truth for authorization.
- Frontend guards are UX-only; security is enforced server-side.
- Mutating admin actions write to backend and are reflected in activity feed.
- Claims/disputes are escrow-based in this implementation.

## Extension Backlog (Recommended)

- Add server-side sorting for all list endpoints.
- Add export/download for non-analytics queue views.
- Add richer audit events (include user-management and disputes directly in activity source).
- Add row detail pages (`/users/:id`, `/disputes/:id`, etc.).
