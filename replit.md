# AutoForce™

## Overview
AutoForce™ (Autonomous Workforce Management Solutions) is a comprehensive workforce management operating system designed to automate HR functions for businesses. It offers features such as time tracking, automated invoice generation, smart hiring, compliance audit trails, and real-time analytics. The platform aims to provide significant cost savings by integrating various HR functions into a single system, providing complete employee lifecycle management, granular role-based access control, and platform-level troubleshooting.

## User Preferences
I prefer detailed explanations.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.
All branding must be 100% AutoForce™ (not WorkforceOS).

## System Architecture
AutoForce™ features a modular "OS" design (e.g., BillOS™, PayrollOS™, TrackOS™, TrainingOS™, HelpOS™), emphasizing extension over rebuilding, clean code, and a single source of truth for each feature domain. The platform's revenue model combines subscription fees with usage-based AI pricing in a customer-pays model, ensuring transparent pricing as the platform scales.

**UI/UX Decisions:** The platform features a CAD-style professional interface with a dark mode theme, corporate blue gradient accents, and a neon-style "W" with glowing "OS" logo. It prioritizes mobile-first design with responsive layouts, accessible touch targets, and optimized navigation patterns. Specific UI components include tab-based navigation, collapsible sections, enhanced empty states, and a universal transition system. Navigation is designed to be intuitive, with clear back/home buttons and a Sling-style mobile dashboard layout for quick access. The sidebar is branded, scrollable, and features a clear typography hierarchy.

**Technical Implementations:**
- **Frontend**: React, Vite, TypeScript, Wouter, TanStack Query, shadcn/ui, `react-hook-form`, `zod`.
- **Backend**: Express.js, TypeScript, with Zod for validation.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Custom session-based authentication with bcrypt, account locking, and password reset (8+ characters, uppercase, lowercase, number, special character).
- **Multi-Tenancy**: Workspace-based data isolation.
- **Role-Based Access Control (RBAC)**: Supports hierarchical roles and API protection.
- **IRC-Style Command/Response Architecture**: WebSocket commands with server-side validation, permission checks, and broadcasting.
- **AuditOS™**: Comprehensive audit logging for compliance.
- **Key Feature Areas**: Client Management, Billing & Payroll (PayrollOS™, PTO), Time & Expense Tracking, Learning & Development (TrainingOS™), Financial Planning (BudgetOS™), Employee Engagement (EngagementOS™), HR Automation, Integrations (IntegrationOS™), Sales Operations (DealOS™ + BidOS™ with AI RFP summarization), Scheduling (ScheduleOS™ with drag-and-drop, shift acknowledgment), and Platform Administration (ROOT Admin Dashboard).

## External Dependencies
- **Database**: Neon (PostgreSQL)
- **ORM**: Drizzle ORM
- **Payment Processing**: Stripe Connect
- **Email**: Resend
- **AI**: OpenAI GPT-4 (`gpt-4o-mini`)

## Recent Changes (November 2025)
### Mobile Responsive Updates
- **Grid Layouts**: Implemented mobile-first responsive grids across all major pages using pattern `grid-cols-2 sm:grid-cols-3 md:grid-cols-6`
  - Root Admin Portal: Stats grid responsive
  - Employee/Auditor Portals: Grid layouts optimized for mobile
  - Integration Marketplace: Tabs and cards responsive
- **Navigation**: Desktop chat sidebar (w-64) hidden on mobile with `hidden md:flex`
- **Pricing Page**: AI token usage pricing detailed with customer-pays model, fully responsive with no overflow
- **Known Issue**: Landing page hero section has horizontal overflow on small mobile viewports (scrollWidth ~536px on 375px viewport) - requires deeper investigation into responsive CSS utilities. All other pages display correctly.