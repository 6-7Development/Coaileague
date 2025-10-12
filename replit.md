# ShiftSync - Multi-Tenant SaaS Scheduling Platform

## Project Overview
ShiftSync is a comprehensive multi-tenant scheduling and workforce management platform where businesses subscribe to manage employee schedules, track time, and handle client appointments. The platform processes payments from end customers, takes a configurable platform fee, and distributes the remainder to business subscribers (similar to QuickBooks model).

## Architecture
- **Frontend**: React + Vite + TypeScript + Wouter (routing) + TanStack Query + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: Replit Auth (OIDC)
- **Payment Processing**: Stripe Connect (ready for when API keys are provided)
- **Multi-Tenancy**: Workspace-based isolation with strict data scoping

## Key Features Implemented

### Phase 1 - MVP (Completed)
- ✅ Multi-tenant workspace system with subscription tiers
- ✅ Replit Auth integration for secure authentication
- ✅ Drag-and-drop schedule builder with visual timeline
- ✅ Employee management (CRUD with hourly rates, roles, availability)
- ✅ Client management (CRUD with contact info, billing details)
- ✅ Shift scheduling with employee-client assignments
- ✅ Multi-tenant data isolation and security
- ✅ Responsive design with dark mode support

### Phase 2 - Advanced Features (In Progress)
- ✅ **Time Tracking System**
  - Clock-in/clock-out functionality
  - Real-time elapsed timers (updates every 10 seconds)
  - Shift-linked time entries
  - Automatic hourly rate calculation
  - Total amount computation from hours × rate
  
- ✅ **Automated Invoice Generation**
  - Generate invoices from unbilled time entries
  - Multi-client time entry selection
  - Automatic tax and platform fee calculation
  - Invoice line items linked to time entries
  - Status tracking (draft/sent/paid)
  
- ✅ **Analytics Dashboard**
  - Total revenue tracking (after platform fees)
  - Total hours worked across all time entries
  - Active employee and client counts
  - Workspace usage metrics (employee/client capacity)
  - Invoice statistics and payment rates
  - Subscription tier display

- 🚧 **Email Notifications** (Planned)
- 🚧 **SMS Notifications** (Planned)
- 🚧 **Calendar Export/Import** (Planned)
- 🚧 **Advanced Scheduling** (Recurring shifts, shift swaps, templates)

## Database Schema

### Core Tables
- **users**: User accounts (Replit Auth integration)
- **workspaces**: Business tenants with subscription info
- **employees**: Workspace-scoped employee records
- **clients**: Workspace-scoped client records
- **shifts**: Scheduled work periods (employee + client + time)
- **time_entries**: Clock-in/out records with billing calculations
- **invoices**: Client invoices with platform fee tracking
- **invoice_line_items**: Individual invoice items (linked to time entries)

## Multi-Tenant Security

### Data Isolation Strategy
1. All tables include `workspaceId` foreign key
2. Every API route validates workspace ownership via authenticated user
3. Database queries always filter by `workspaceId`
4. Cross-tenant data leakage prevented through joins and filters

### Critical Security Patterns
- Invoice generation filters unbilled time entries with workspace-scoped joins
- Analytics calculations scoped to workspace data only
- Storage layer enforces workspace isolation on all operations

## Payment Architecture

### Stripe Connect Integration (Ready)
- Platform acts as payment facilitator
- End customers pay through platform
- Platform fee (configurable per workspace) deducted automatically
- Remainder transferred to business subscriber
- Structure ready for activation when Stripe API keys are provided

### Fee Calculation
```
Customer Payment → Invoice Total (with tax)
Platform Fee = Total × platformFeePercentage
Business Amount = Total - Platform Fee
```

## Recent Technical Decisions

### Time Tracking
- Time entries must link to shifts via `shiftId`
- Real-time timers use interval-based state updates (every 10 seconds)
- Clock-out calculates `totalHours` and `totalAmount` server-side

### Invoice Generation
- Tax rate stored as percentage (not dollar amount)
- All monetary calculations use `parseFloat()` with NaN guards
- Two-decimal precision enforced with `.toFixed(2)`
- Unbilled entries filtered through workspace-scoped invoice joins

### Analytics
- Revenue calculated from `businessAmount` (post-platform-fee)
- Hours aggregated from completed time entries
- Usage metrics show current vs. tier limits
- String-to-number conversions use `String()` wrapper for safety

## Development Guidelines

### Frontend Patterns
- Use TanStack Query for all API calls (no custom `queryFn`)
- Invalidate cache after mutations using `queryClient.invalidateQueries()`
- Form validation with `react-hook-form` + `zod` + shadcn Form components
- Add `data-testid` to all interactive elements

### Backend Patterns
- Validate request bodies with Zod schemas
- Always verify workspace ownership in routes
- Use storage interface methods (never raw DB queries in routes)
- Return 404 for missing workspace, 400 for validation errors

### Styling
- Follow `design_guidelines.md` for colors and spacing
- Use shadcn components (Button, Card, Badge) for consistency
- Leverage `hover-elevate` and `active-elevate-2` utility classes
- Never implement custom hover states on shadcn components

## Current State
- All core scheduling and time tracking features complete
- Invoice generation from time entries working
- Analytics dashboard displaying comprehensive metrics
- Multi-tenant isolation verified and secure
- Ready for notification systems and calendar integrations

## Next Priorities
1. Email notification system (shift assignments, reminders, invoices)
2. SMS notifications via Twilio integration
3. Calendar export (iCal) and Google Calendar sync
4. Advanced scheduling (recurring shifts, shift swaps, availability)
5. Comprehensive end-to-end testing
6. Production deployment preparation
