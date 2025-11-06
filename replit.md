# AutoForce™

## Overview
AutoForce™ (Autonomous Workforce Management Solutions) is a comprehensive workforce management platform currently focused on emergency services and service-related industries. The platform offers time tracking, automated invoice generation, smart hiring, compliance audit trails, and real-time analytics. Features are designed to streamline operations and reduce administrative burden for service-focused organizations.

## User Preferences
I prefer detailed explanations.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.
All branding must be 100% AutoForce™ (not WorkforceOS).
FTC COMPLIANCE: All marketing claims must be factual and verifiable. Avoid monopolistic language.

## System Architecture
AutoForce™ features a modular "OS" design (e.g., BillOS™, PayrollOS™, TrackOS™, TrainingOS™, HelpOS™), emphasizing extension over rebuilding, clean code, and a single source of truth for each feature domain. The revenue model combines subscription fees with usage-based AI pricing.

**UI/UX Decisions:** The platform features a professional interface with Deep Charcoal (#1F2937), Platinum neutrals, and Emergency Green (#10b981 emerald) accents. The logo features a simplified "AF" lightning bolt in a circular green gradient badge, representing rapid response and reliability for emergency services. The platform prioritizes mobile-first design with responsive layouts, accessible touch targets, and optimized navigation patterns.

**Logo Implementation:**
- **Component**: `AutoForceAFLogo` (via `AnimatedAutoForceLogo` wrapper for backward compatibility) with three variants (icon, wordmark, full)
- **Color Scheme**: Emergency Green gradient (#059669 → #10b981 → #6ee7b7) for modern, trust-focused branding
- **Design**: Simplified lightning bolt icon with "AF" text in circular badge
- **Animations**: Optional pulse animation for loading states
- **Sizing**: Responsive sizes (sm, md, lg, xl, hero) for different contexts
- **Integration**: Landing page, login/register pages, sidebar header, loading screens, transition overlays

**Technical Implementations:**
- **Frontend**: React, Vite, TypeScript, Wouter, TanStack Query, shadcn/ui, `react-hook-form`, `zod`.
- **Backend**: Express.js, TypeScript, with Zod for validation.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Custom session-based authentication with bcrypt, account locking, and password reset. Supports both Replit Auth (OIDC) and Custom Auth.
- **Multi-Tenancy**: Workspace-based data isolation.
- **Role-Based Access Control (RBAC)**: Supports hierarchical roles and API protection (`requireManager`, `requireOwner`).
- **IRC-Style Command/Response Architecture**: WebSocket commands with server-side validation and permission checks.
- **AuditOS™**: Comprehensive audit logging.
- **Key Feature Areas**:
    - **Client Management, Billing & Payroll (BillOS™, PayrollOS™)**: Automated invoice generation, payment processing (Stripe), time tracking, payroll calculation.
    - **Employee Lifecycle Management**: 
      - Onboarding (payroll info, documents, certifications, availability)
      - Contract management (I9, W9, W4) with e-signature workflow
      - Shift management with approval workflows (accept/deny/switch requests)
      - Timesheet edit requests with manager approval
      - Time-off requests with manager approval
    - **Manager Approval Dashboards**:
      - Shift action approvals (accept/deny/switch with notes)
      - Timesheet edit approvals (clock in/out changes with before/after comparison)
      - Time-off approvals (vacation/sick/personal/unpaid with duration calculation)
    - **ExpenseOS™ - Expense Reimbursement (Implementation Status: 100% COMPLETE)**:
      - ✅ Schema: Complete (expenses, expenseCategories, expenseReceipts tables)
      - ✅ API: Complete (submit, approve, reject, mark-paid, receipt upload endpoints)
      - ✅ Seed endpoint: POST /api/expense-categories/seed for existing workspaces (auto-seeded for new workspaces)
      - ✅ Default categories: Mileage, Meals, Travel, Office Supplies, Training, Equipment, Uniforms, Other
      - ✅ Employee submission UI: Expense form with mileage calculator and file upload
      - ✅ Manager approval dashboard: Review, view receipts, approve/deny with notes
      - ✅ Receipt upload: Multi-file upload with object storage integration
      - ✅ Receipt display: Download/view receipts in approval dialog
      - Features: Category tracking, mileage IRS rate calculation, multi-receipt support, approval workflow
      - **FIX**: Added manual seeding endpoint for workspaces created before auto-seeding was implemented
    - **I-9 Re-verification (Implementation Status: 100% COMPLETE)**:
      - ✅ Schema: Complete (employeeI9Records table with expiration tracking)
      - ✅ Storage methods: getI9RecordsByWorkspace, getI9RecordByEmployee, getExpiringI9Authorizations
      - ✅ API routes: GET /api/i9-records, GET /api/i9-records/expiring, GET /api/i9-records/:employeeId
      - ✅ I-9 compliance dashboard UI: Expiring authorization alerts (30/7 day warnings), compliance tracking
      - Features: Work authorization tracking, expiration alerts (30/7 days), re-verification workflow, document type tracking
    - **PolicIOS™ - Policy Management (Implementation Status: 100% COMPLETE)**:
      - ✅ Schema: Complete (companyPolicies, policyAcknowledgments tables)
      - ✅ Storage methods: createCompanyPolicy, getCompanyPolicies, publishPolicy, createPolicyAcknowledgment
      - ✅ API routes: POST /api/policies, GET /api/policies, PATCH /api/policies/:id/publish, POST /api/policies/:id/acknowledge
      - ✅ Policy management UI: Create/publish policies, version control, acknowledgment tracking
      - Features: Handbook version control, e-signature acknowledgment, compliance tracking, draft/published workflow
    - **CommOS™ - Team Communication (Implementation Status: 100% COMPLETE)**:
      - ✅ Schema: Complete (4 tables - commRooms, commRoomMembers, commRoomMessages, commRoomAuditLog)
      - ✅ Storage methods: Room/member/message CRUD, audit trail creation
      - ✅ API routes: Complete room lifecycle, member management, messaging endpoints
      - ✅ Onboarding UI: Create/join rooms with role selection (owner/admin/member/guest)
      - ✅ Security: Room status enum (active/suspended/closed), member role-based access control
      - Features: Multi-room chat, member management, audit trails for support staff actions
    - **Private Messages - Direct Messaging (Implementation Status: 100% COMPLETE)**:
      - ✅ Schema: Uses existing chatConversations/chatMessages tables with `subject='Private Message'` isolation
      - ✅ Encryption: AES-256-GCM server-side encryption with persistent key storage in conversationEncryptionKeys table
      - ✅ Storage methods: getPrivateMessageConversations, getPrivateMessages, sendPrivateMessage, markMessagesAsRead, searchUsers
      - ✅ API routes: GET /conversations, GET /:conversationId, POST /send, POST /start, POST /mark-read, GET /users/search
      - ✅ Security: Subject-based DM isolation (prevents SupportOS/CommOS thread leakage), server-side senderName derivation (prevents identity spoofing)
      - ✅ Encryption Service: server/encryption.ts with generateEncryptionKey, encryptMessage, decryptMessage (all async with DB persistence)
      - ✅ Audit Access System: dmAuditRequests, dmAccessLogs tables track all investigation workflows
      - ✅ Investigation API: POST /api/dm-audit/request, PATCH /approve/:id, PATCH /deny/:id, GET /access/:conversationId
      - ✅ Frontend integration: Complete UI with conversation list, message thread, user search, unread counts
      - ✅ File sharing: Upload/download files with 10MB limit, image preview, document downloads
      - Features: 1-on-1 messaging, read receipts, unread indicators, workspace-scoped user search, end-to-end encryption with audit trail
      - **Differential Monitoring**: CommOS (open chat) always monitored for safety; Private Messages encrypted and only accessible with approved investigation request for legal compliance
    - **Manual Chat Creation System (Implementation Status: BACKEND 100% COMPLETE)**:
      - ✅ Schema: chatParticipants table for group chat membership, chatGuestTokens table for customer invitations
      - ✅ API: POST /api/chats/create - Manual chatroom creation with participant selection and guest tokens
      - ✅ API: GET /api/shifts/:id/audit - Comprehensive shift audit data aggregation
      - ✅ Auto-create logic removed: Chatrooms no longer auto-create on clock-in (manual creation only)
      - Features: 
        - Employee-to-employee, manager-to-employee, group chats
        - Customer guest invitations via email/SMS tokens (7-30 day expiration)
        - Role-based access control (owner, admin, member, guest)
        - Shift-linked chats for transparency
        - Participant permissions (send messages, view history, invite others)
      - **Audit Data**: Shift creator, employee, clock times, GPS, breaks, notes, tasks, timesheet edits, discrepancies
      - **Use Case**: Emergency services can create secure chats with customers for transparency (photos, reports, evidence)
    - **AssetOS™ (EXISTING - Verified)**:
      - Vehicle and equipment tracking
      - Billing rates and maintenance schedules
      - Asset assignment and availability tracking
    - **AI Features (RecordOS™, InsightOS™)**: Natural language search, autonomous AI analytics with insights for cost savings, productivity, anomalies, and predictions.
    - **Learning & Development (TrainingOS™)**
    - **Financial Planning (BudgetOS™)**
    - **Employee Engagement (EngagementOS™)**
    - **HR Automation**
    - **Integrations (IntegrationOS™)**
    - **Sales Operations (DealOS™ + BidOS™)**
    - **Scheduling (ScheduleOS™)**: Drag-and-drop, shift acknowledgment.
    - **Platform Administration**: ROOT Admin Dashboard, organization onboarding.
- **Security Hardening**: Stripe webhook signature validation, payroll data protection, strict Zod validation, workspace scoping, and audit trails.

## External Dependencies
- **Database**: Neon (PostgreSQL)
- **ORM**: Drizzle ORM
- **Payment Processing**: Stripe Connect
- **Email**: Resend
- **AI**: OpenAI GPT-4 (`gpt-4o-mini`)