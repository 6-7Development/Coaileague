# WorkforceOS

## Overview
WorkforceOS is a comprehensive workforce management operating system designed to automate HR functions for businesses. It offers features such as time tracking, automated invoice generation, smart hiring, compliance audit trails, and real-time analytics. The platform aims to provide significant cost savings by integrating various HR functions into a single system. Key capabilities include drag-and-drop scheduling, multi-tenant security, and robust role-based access control. The project envisions branded features like BillOS™, PayrollOS™, ScheduleOS™, HireOS™, TrackOS™, ReportOS™, and AnalyticsOS™ to create a unified product identity.

## User Preferences
I prefer detailed explanations.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
### UI/UX Decisions
The platform features a CAD-style professional interface with a dark mode theme, emphasizing precision. It includes an application frame with a menu, toolbar, and status bar, along with real-time indicators. The design is modern, professional, and mobile-first, utilizing corporate blue gradient accents (navy blue #1e3a8a to deep slate). The official logo is a realistic neon-style "W" with glowing "OS" superscript, designed with multi-layer glows, 3D depth, and electric blue highlights. A universal transition system with a branded overlay and animated WorkforceOS logo provides smooth visual feedback during all major actions and navigations.

### Technical Implementations
- **Frontend**: React, Vite, TypeScript, Wouter, TanStack Query, shadcn/ui, `react-hook-form`, `zod`.
- **Backend**: Express.js, TypeScript, with Zod for request body validation.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Custom session-based authentication with bcrypt, account locking, and password reset.
- **Multi-Tenancy**: Workspace-based data isolation enforced at API and database levels.
- **Role-Based Access Control (RBAC)**: Supports Owner, Manager, Employee, and platform-level roles (root, deputy_admin, deputy_assistant, sysop, bot) with hierarchical management and API protection middleware. Granular capabilities for leaders, including viewing reports, managing employees, adjusting schedules, and escalating support. All leader actions are extensively logged for compliance.
- **Key Features**:
    - **Time Tracking**: Clock-in/out, real-time timers, automated calculations.
    - **Invoice Generation**: Automated from unbilled time, multi-client, tax/fee calculation.
    - **Analytics Dashboard**: Tracks revenue, hours, active users, invoice statistics.
    - **Advanced Scheduling System (SmartScheduleOS™)**: Professional Sling-style calendar interface with react-big-calendar, drag-and-drop (with touch support via react-dnd-multi-backend), real-time conflict detection, mobile-responsive design, and optional AI auto-scheduling (GPT-4 powered). Fully unified system combining modern calendar UX with AI scheduling capabilities.
    - **Employee Onboarding (HireOS™)**: Multi-step process including personal info, tax, availability, documents, and e-signature.
    - **Report Management System (ReportOS™)**: Template management, dynamic submissions, supervisor approval, and automated email delivery.
    - **HR Management Suite**: Employee Benefits, Performance Reviews, PTO Management, and Employee Terminations.
    - **Custom Forms System**: Production-ready system for organization-specific forms with e-signature and document upload, including an admin form builder UI.
    - **AI Sales CRM**: AI-powered lead generation (GPT-4), 7-stage sales pipeline tracking, and email campaigns.
    - **PayrollOS™**: Automated payroll processing with intelligent tax calculations (Federal, State, Social Security, Medicare), overtime logic, and data integration from time entries. Includes a QC workflow and employee/manager portals.
    - **Live HelpDesk (SupportOS™)**: IRC/MSN-style instant chat with WebSocket messaging, ticket-based authentication for guests, real-time status indicators, staff toggle controls, audit logging, and a comprehensive slash command system. Features include a mobile-first support drawer, chat notification sounds, and a realistic neon logo.
        - **HelpOS™ AI Queue Management**: Smart support queue with priority-based positioning, automated announcements, and intelligent prioritization based on wait time, subscription tier, and special needs.
        - **Mobile Support Staff Menu**: Hamburger-style mobile command center with live user queue, chat commands, and system dashboard.
        - **Post-Ticket Review System**: Feedback collection, admin review dashboard, and testimonial showcase.
        - **Secure Request Dialog System**: Professional modal dialogs for sensitive information collection including authentication, document upload, photo upload, e-signature, and open info requests, all encrypted and sent via WebSocket.
- **Chat System Routes**: Dedicated routes for Desktop Chat (`/live-chat` - DC360) with a 3-column IRC/MSN-style interface, and Mobile Chat (`/mobile-chat` - DC360.5) with a glassmorphic, livestream-style UI, optimized for touch-first UX.
- **Admin Dashboards**: Usage, Support, and Command Center for platform monitoring.
- **Portals**: Employee, Auditor/Bookkeeper, and Client/Subscriber portals.
- **Billing & Monetization**: Transaction-based platform fee (3-10%) via Stripe Connect, tier-based pricing with feature flags, and a subscriber-pays-all model for AI features.
- **Support & Communication**: Live HelpDesk chatroom with instant WebSocket messaging, ticket verification, staff controls, and email notifications.
- **Security & Reliability**: Enterprise audit logging, IP-based rate limiting, global React error boundary, health monitoring, platform RBAC, workspace isolation, and field whitelisting.
- **Escalation System**: Production-ready structured ticket system for leaders to escalate issues, featuring race-safe ticket generation, state transition enforcement, mandatory resolution, category classification, priority levels, platform staff authorization, comprehensive audit trails, and workspace isolation.
- **Monopolistic Premium Features ($500/month tier)**:
    - **PredictionOS™ (AI Workforce Analytics)**: GPT-4 powered turnover risk prediction and cost variance analysis. Analyzes 12 months of employee data (hours, tardiness, completion rates) to calculate turnover risk scores (0-100%), identify top 3 risk factors, estimate replacement costs, and provide actionable retention recommendations. Includes robust error handling with heuristic fallbacks, API key validation, and token limits for cost control.
    - **Custom Logic Workflow Builder**: Visual drag-and-drop rule engine for automating payroll, scheduling, time tracking, and billing workflows. Supports complex IF/THEN logic with AND/OR condition operators, priority-based execution, action chaining (alerts, rate modifications, blocking), and comprehensive execution logging. Rules stored as JSONB with full audit trails.
    - **Real-Time Geo-Compliance & Audit Trail**: GPS/IP tracking for time entries with mandatory 7-year retention (IRS/DOL compliance). Enforces ≤50m GPS accuracy requirement, flags clock-in/out >250m from job site, detects IP anomalies between clock events, and creates discrepancy records for manager review. Job site locations stored as decimal lat/lng on client records.

## External Dependencies
- **Database**: Neon (PostgreSQL)
- **ORM**: Drizzle ORM
- **Payment Processing**: Stripe Connect
- **Email**: Resend
- **AI**: OpenAI GPT-4