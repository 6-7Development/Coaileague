# WorkforceOS - Replace Your Entire HR Department

## Overview
WorkforceOS is a Fortune 500-grade operating system for workforce management. It's a complete office work automation platform for any business, featuring time tracking, automated invoice generation, smart hiring, compliance audit trails, and real-time analytics. The platform replaces multiple HR staff positions with one automated system, delivering $130K-$250K in annual cost savings through drag-and-drop scheduling, multi-tenant security, role-based access control, and comprehensive analytics.

**Note**: GPS clock-in and automated payroll have database schemas ready but require UI implementation. Stripe Connect and email notifications are configured but require API key activation.

## Brand Identity
- **Name**: WorkforceOS
- **Tagline**: "Replace Your Entire Workforce Department"
- **Value Proposition**: Fortune 500-grade platform with time tracking, automated invoicing, hiring, and compliance (GPS clock-in and payroll processing schemas ready for implementation)
- **Primary Color**: Indigo (#6366f1 / #4f46e5) - Modern, professional, enterprise-ready
- **Logo**: Gradient "Zap" icon in indigo square
- **Design System**: Modern dark theme with clean organization, mobile-first responsive design, indigo accents, and clear visual hierarchy
- **Target Savings**: $130K-$250K per year by replacing HR staff with automation
- **Recent Update**: Transformed entire platform to modern, organized dark UI (October 2025) with mobile hamburger menu, responsive grids, and consistent design pattern across all pages

## User Preferences
I prefer detailed explanations.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
### UI/UX Decisions
The platform features a CAD-style professional interface with an application frame (menu bar, toolbar, status bar) and a dark mode theme with precision color schemes. It prioritizes a program-like interface for precision and control, rather than a typical website. It includes real-time indicators such as live clocks and connection status.

### Technical Implementations
- **Frontend**: React, Vite, TypeScript, Wouter (routing), TanStack Query, shadcn/ui. Form validation uses `react-hook-form` and `zod`.
- **Backend**: Express.js, TypeScript. Request bodies are validated with Zod schemas.
- **Database**: PostgreSQL (Neon) with Drizzle ORM.
- **Authentication**: Replit Auth (OIDC).
- **Multi-Tenancy**: Workspace-based isolation with `workspaceId` foreign keys on all core tables and strict data scoping enforced at the API and database levels.
- **Role-Based Access Control (RBAC)**: Supports Owner, Manager, and Employee roles with a hybrid workspace resolution strategy. Manager assignments (`manager_assignments` table) define hierarchical relationships. API routes are protected by `requireOwner`, `requireManager`, and `requireEmployee` middleware.
- **Time Tracking**: Clock-in/out functionality with real-time timers, automatic hourly rate calculation, and server-side calculation of total hours and amounts.
- **Invoice Generation**: Automated generation from unbilled time entries, including multi-client selection, tax and platform fee calculation, and status tracking (draft/sent/paid).
- **Analytics Dashboard**: Tracks total revenue (post-platform-fee), total hours worked, active employee/client counts, workspace usage metrics, and invoice statistics.
- **Advanced Scheduling**: Includes shift templates and recurring shifts (daily/weekly).
- **Employee Onboarding System**: Features an email invitation workflow with secure, single-use tokens, a multi-step onboarding flow (personal info, tax classification, availability, document upload, e-signature capture), legal compliance features (W-4/W-9 tracking, contract signatures, SOP acknowledgements), and automatic employee number generation.
- **Demo System**: An interactive demo workspace pre-populated with sample data is available, resetting every 24 hours.

### Feature Specifications
- **Core Features**: Employee management (CRUD), client management (CRUD), shift scheduling, multi-tenant data isolation, responsive design, dark mode, demo system with 24-hour reset.
- **Advanced Features**: Time tracking (clock-in/out, real-time timers, linked to shifts), automated invoice generation (from time entries, tax/fee calculation), comprehensive analytics dashboard, RBAC (Owner, Manager, Employee roles, manager assignments), advanced scheduling (templates, recurring shifts), employee onboarding (invitations, multi-step flow, e-signatures, document upload, tax classification, status tracking), **Report Management System (RMS)** (template management, dynamic submissions, supervisor approval workflows).
- **Implemented but Requires Activation**: Email notifications (Resend integration ready), Stripe Connect payment processing.
- **Database Schema Ready (Needs UI)**: GPS location tracking for clock-ins, automated payroll processing, customer portal for RMS, support ticket system.
- **Planned Features**: SMS notifications, calendar export/import, full GPS tracking UI, payroll processing UI, RMS customer portal, RMS help desk.

### Enterprise Security Roadmap
**Critical Security Enhancements (Fortune-500 Grade):**
1. **Audit Logging & Compliance**:
   - Immutable audit trail for all data mutations (create, update, delete operations)
   - Track user actions, IP addresses, timestamps for SOC2/GDPR compliance
   - Audit log viewer with filtering and export capabilities
   - Data retention policies and automated archival

2. **Authentication & Access Control**:
   - Multi-Factor Authentication (MFA/2FA) for sensitive operations
   - SSO integration for enterprise clients (SAML/OAuth)
   - Session management with token rotation
   - Conditional access policies (IP whitelisting, device trust)

3. **Data Protection**:
   - Encryption at rest for sensitive fields (SSN, bank details, documents)
   - TLS enforcement across all endpoints
   - Tenant-scoped secrets management
   - Secure file upload/storage with virus scanning

4. **API Security**:
   - Rate limiting per workspace/user to prevent abuse
   - API key management for third-party integrations
   - OAuth client management for public API access
   - WAF (Web Application Firewall) integration

5. **Monitoring & Incident Response**:
   - Centralized logging with OpenTelemetry
   - Real-time security alerts and anomaly detection
   - Vulnerability scanning (SAST/DAST)
   - Dependency security audits
   - Disaster recovery dashboard with backup verification

### Monetization Strategy & Feature Tiers
**Pricing Architecture (Cost-Plus Model):**
- **Basic Tier** ($49/month): Core employee/client management, basic scheduling, time tracking
- **Professional Tier** ($149/month): + Invoice generation, analytics dashboard, employee onboarding
- **Premium Tier** ($299/month): + RMS, GPS tracking, advanced RBAC, compliance tools
- **Enterprise Tier** ($599/month): + White-label RMS, custom branding, API access, SSO, dedicated support
- **Add-Ons**: Automated payroll (+$99/month), SMS notifications (+$29/month), Advanced analytics (+$79/month)

**White-Label RMS Capability** (Enterprise Add-On +$199/month):
- Custom branding per workspace (logo, colors, domain)
- Branded report generation with client logos
- Custom email templates for report notifications
- Tenant-specific report templates
- Custom domain with SSL (clientname.workforceos.com or custom CNAME)
- White-label customer portal access

**Feature Flag System**:
- Database-backed feature flags per workspace
- Billing tier integration with Stripe metadata
- Graceful degradation for locked features
- Upgrade prompts with ROI messaging
- Feature usage analytics for monetization insights

## External Dependencies
- **Authentication**: Replit Auth
- **Database**: Neon (PostgreSQL)
- **ORM**: Drizzle ORM
- **Payment Processing**: Stripe Connect (ready for activation with API keys)