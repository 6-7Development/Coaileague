# WorkforceOS

## 🎉 MVP COMPLETE - ALL REVENUE-GENERATING FEATURES PRODUCTION READY (October 27, 2025)

**Status**: All 6 core MVP features are architect-approved and ready for production deployment!

### ✅ Completed MVP Features (BillOS™, PayrollOS™, TrackOS™)

1. **Client Onboarding** - Easy form with hourly rates, billing cycles, and client addresses ✓
2. **Invoice Review UI** - 2-step generation with review screen before submission ✓
3. **Billing Cycle Automation** - Auto-generate invoices at end of billing periods ✓
4. **Email Notifications** - Resend integration for automated invoice delivery ✓
5. **Time Tracker Integration** - Correctly excludes billed time from payroll calculations ✓
6. **Client Portal** - Secure invoice viewing with PDF downloads ✓

### 🔒 Security Architecture
- **Workspace Isolation**: All APIs enforce strict workspace boundaries
- **Per-Invoice Authorization**: Client portal verifies user is workspace owner OR specific client on invoice
- **403 Forbidden**: Returns authorization errors for unauthorized access attempts
- **Fixed Critical Vulnerability**: Changed from workspace-wide to per-invoice data fetching

### 📋 Testing Status
- **Automated E2E Testing**: Blocked by missing Stripe testing secrets (TESTING_STRIPE_SECRET_KEY)
- **Individual Features**: All architect-approved and production-ready
- **Recommendation**: Manual testing of complete invoice and payroll flows
- **Ready for Deployment**: MVP can be deployed pending manual verification

### 🚀 Next Steps
1. Manual testing of end-to-end invoice flow
2. Manual testing of end-to-end payroll flow
3. Deploy to production (Render or similar)
4. Set up production Stripe keys and Resend API keys
5. Monitor for any issues in production environment

## Overview
WorkforceOS is a comprehensive workforce management operating system designed to automate HR functions for businesses. It offers features such as time tracking, automated invoice generation, smart hiring, compliance audit trails, and real-time analytics. The platform aims to provide significant cost savings by integrating various HR functions into a single system, envisioning branded features like BillOS™, PayrollOS™, ScheduleOS™, HireOS™, TrackOS™, ReportOS™, and AnalyticsOS™ for a unified product identity. The project also focuses on monopolistic features to provide complete employee lifecycle management, granular role-based access control, and platform-level troubleshooting, justifying a premium pricing model.

## User Preferences
I prefer detailed explanations.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
### Organization Principles
- **Modular OS Design**: Features are organized into branded "OS" modules.
- **Extend, Don't Rebuild**: Emphasizes building on existing systems.
- **Clean Code**: Code is organized by category/version for independent upgrades.
- **Single Source of Truth**: Each feature domain has a single authoritative system.

### UI/UX Decisions
The platform features a CAD-style professional interface with a dark mode theme, emphasizing precision. It includes an application frame with a menu, toolbar, and status bar. The design is modern, professional, mobile-first, and utilizes corporate blue gradient accents. The official logo is a realistic neon-style "W" with glowing "OS" superscript. A universal transition system provides smooth visual feedback. Key UI components include tab-based navigation, collapsible sections, and mobile-optimized design elements like touch-optimized buttons and fluid layouts. All acceptance forms (terms, agreements, contracts) now have BOTH accept and decline options to prevent users from getting stuck in mandatory flows.

**Branding & Visual Identity**: WorkforceOS features a comprehensive brand identity including a professional logo with specific color schemes (Teal, Navy) and animations for loading states (rotating gear, pulsing shield, alive brain, glowing head, floating AI brain icon). The logo is saved in `attached_assets/workforceos-logo-full.png` and has animated and static versions.

**Mobile-First Optimization**: WorkforceOS follows a strict mobile-first philosophy, optimized primarily for 360px-420px screens before scaling to desktop. This includes viewport configuration, touch targets, collapsible navigation, responsive dialogs, fluid layouts, safe area support, responsive grids, text scaling, branded mobile loading states, touch gestures, and optimized pages.

### Technical Implementations
- **Frontend**: React, Vite, TypeScript, Wouter, TanStack Query, shadcn/ui, `react-hook-form`, `zod`.
- **Backend**: Express.js, TypeScript, with Zod for request body validation.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Custom session-based authentication with bcrypt, account locking, and password reset.
- **Multi-Tenancy**: Workspace-based data isolation.
- **Role-Based Access Control (RBAC)**: Supports various roles with hierarchical management and API protection, ensuring granular control (e.g., Client Portal APIs verify requester is workspace owner OR specific client on invoice).
- **IRC-Style Command/Response Architecture**: WebSocket commands use unique command IDs for request/response matching, with server-side validation, permission checks, and broadcasting.
- **AuditOS™**: Comprehensive audit logging system tracking all actions for compliance and abuse detection.
- **Key Feature Areas**:
    - **Financial & Time Management**: Time Tracking, Automated Invoice Generation (BillOS™), PayrollOS™, and Analytics Dashboard.
    - **Workforce Planning**: Advanced Scheduling System (SmartScheduleOS™), Employee Onboarding (HireOS™), and TalentOS™.
    - **HR & Compliance**: Report Management System (ReportOS™), HR Management Suite, Custom Forms System, Real-Time Geo-Compliance & Audit Trail, and Employee Self-Service (ESS).
    - **Communication & Engagement**: Live HelpDesk (SupportOS™) with modern mobile chat, EngagementOS™ (Bidirectional Employee-Employer Intelligence), CommunicationOS™, and a Private Messaging System.
    - **AI & Analytics**: AI Sales CRM, PredictionOS™ (AI Workforce Analytics), and features within EngagementOS™ for turnover risk prediction and employer benchmarking, KnowledgeOS™ for AI-powered knowledge base retrieval.
    - **Intelligent Automation**: Predictive Scheduling Alerts and Automated Status Reports.
    - **Asset Management**: AssetOS™ for physical resource allocation and billing.
    - **Platform & Security**: Admin Dashboards, various Portals (Employee, Auditor, Client), Billing & Monetization, Security & Reliability features (audit logging, rate limiting, error handling), and an Escalation System.
    - **Workflow Automation**: Custom Logic Workflow Builder.
    - **Integrated Modules**: CommunicationOS™, QueryOS™ (diagnostics panel), Private Messaging System, TrainingOS™ (LMS), BudgetOS™ (UI-only for planning), and IntegrationOS™ (external service ecosystem).

## External Dependencies
- **Database**: Neon (PostgreSQL)
- **ORM**: Drizzle ORM
- **Payment Processing**: Stripe Connect
- **Email**: Resend
- **AI**: OpenAI GPT-4