# WorkforceOS

## Overview
WorkforceOS is a Fortune 500-grade operating system for comprehensive workforce management, designed to automate HR functions for businesses of all sizes. It offers features like time tracking, automated invoice generation, smart hiring, compliance audit trails, and real-time analytics. The platform aims to deliver significant annual cost savings by replacing multiple HR staff positions with a single, integrated automated system. Key capabilities include drag-and-drop scheduling, multi-tenant security, and robust role-based access control.

## User Preferences
I prefer detailed explanations.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
### UI/UX Decisions
The platform features a CAD-style professional interface with a dark mode theme, emphasizing precision and control. It includes an application frame (menu, toolbar, status bar) and real-time indicators. The design is modern, professional, and mobile-first, utilizing indigo accents for brand consistency.

### Technical Implementations
- **Frontend**: React, Vite, TypeScript, Wouter, TanStack Query, shadcn/ui. Form validation with `react-hook-form` and `zod`.
- **Backend**: Express.js, TypeScript, with Zod for request body validation.
- **Database**: PostgreSQL (Neon) with Drizzle ORM.
- **Authentication**: Replit Auth (OIDC).
- **Multi-Tenancy**: Workspace-based data isolation enforced at API and database levels.
- **Role-Based Access Control (RBAC)**: Supports Owner, Manager, and Employee roles with hierarchical management assignments and API route protection middleware.
- **Key Features**:
    - **Time Tracking**: Clock-in/out, real-time timers, automatic hourly rate and total amount calculation.
    - **Invoice Generation**: Automated generation from unbilled time entries, multi-client selection, tax/fee calculation, and status tracking.
    - **Analytics Dashboard**: Tracks revenue, hours worked, active users, and invoice statistics.
    - **Advanced Scheduling System**: Sling-style grid with drag-and-drop, real-time week statistics (hours, labor cost), bulk operations, shift conflict detection, and quick actions.
    - **Employee Onboarding**: Email invitation workflow, multi-step onboarding (personal info, tax, availability, documents, e-signature), legal compliance features, and automatic employee number generation.
    - **Report Management System (RMS)**: Template management, dynamic submissions, supervisor approval, mandatory photo requirements with timestamping for compliance reports.
    - **Industry-Specific Business Categories**: Vertical SaaS approach providing tailored form templates based on selected business category (e.g., Security, Healthcare, Construction).
    - **Shift Orders/Post Orders**: Special instructions attached to shifts requiring employee acknowledgment.
- **Admin Dashboards**: Admin Usage, Support, and Command Center for platform monitoring, customer management, and system health.
- **Portals**: Employee, Auditor/Bookkeeper (read-only financial), and Client/Subscriber portals for self-service access.
- **Revenue Model**: Transaction-based platform fee (3-10%) on all processed transactions, utilizing Stripe Connect for automated payment splitting.
- **Security & Reliability**: Enterprise audit logging, IP-based rate limiting, global React error boundary, health monitoring endpoint, and comprehensive security documentation.

### Feature Specifications
- **Core**: Employee/client management, scheduling, multi-tenancy, responsive design, dark mode, 24-hour resetting demo system.
- **Advanced**: Time tracking, automated invoicing, analytics, RBAC, advanced scheduling, employee onboarding, RMS with photo requirements, industry-specific forms, shift orders.
- **Implemented but Requires Activation**: Email notifications (Resend), Stripe Connect payment processing.
- **Database Schema Ready (Needs UI)**: GPS clock-in, automated payroll processing.

### Monetization Strategy
The platform offers Professional, Enterprise, and Fortune 500 tiers with increasing features and cost savings. Additional offerings include a White-Label RMS capability for custom branding and a database-backed feature flag system for granular control over feature availability based on billing tiers.

## External Dependencies
- **Authentication**: Replit Auth
- **Database**: Neon (PostgreSQL)
- **ORM**: Drizzle ORM
- **Payment Processing**: Stripe Connect (ready for activation)