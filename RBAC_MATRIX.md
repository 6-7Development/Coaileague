# WorkforceOS - Role-Based Access Control (RBAC) Matrix

## 🔐 **Role Hierarchy Overview**

### **Workspace Roles** (Organization-Level)
| Role | Authority Level | Description |
|------|----------------|-------------|
| **Owner** | Full Control | Workspace creator, has complete administrative access to their organization |
| **Manager** | Team Management | Can manage team members, approve time/PTO, review reports, limited analytics |
| **Employee** | Personal Access | Limited access - own time tracking, schedule viewing, report submission |

### **Platform Roles** (System-Level)
| Role | Authority Level | Description |
|------|----------------|-------------|
| **platform_admin** | Supreme | Full platform-wide access, can manage all workspaces and users |
| **deputy_admin** | Deputy Admin | Assists platform administrator, elevated permissions |
| **deputy_assistant** | Support Lead | Assists deputy administrator, support operations |
| **sysop** | Support Staff | System operators, customer support across organizations |
| **none** | Regular User | Standard subscriber without platform privileges |

---

## 📊 **Complete Permission Matrix**

### **Core Features**

| Feature | Owner | Manager | Employee | Platform Staff | Notes |
|---------|-------|---------|----------|---------------|-------|
| **Dashboard** | ✅ Full | ✅ Limited | ✅ Personal | ✅ View All | Analytics vary by role |
| **Scheduling** | ✅ Create/Edit/Delete | ✅ Team View/Edit | ❌ View Only | ✅ View All | Drag-drop scheduling |
| **Time Tracking** | ✅ All Users | ✅ Team Approval | ✅ Self Only | ✅ View All | GPS clock-in/out |
| **Invoicing** | ✅ Full Access | ❌ No Access | ❌ No Access | ✅ View All | Auto-generation, client billing |
| **Clients** | ✅ Manage | ✅ View | ❌ No Access | ✅ View All | Client database management |
| **Employees** | ✅ Full CRUD | ✅ View Team | ❌ View Self | ✅ View All | Employee management |
| **Analytics** | ✅ Full Reports | ✅ Team Metrics | ❌ No Access | ✅ Platform Analytics | Revenue, hours, KPIs |
| **Reports (RMS)** | ✅ Manage Templates | ✅ Review/Approve | ✅ Submit | ✅ View All | Compliance reporting |

### **HR Management Suite**

| Feature | Owner | Manager | Employee | Platform Staff | Notes |
|---------|-------|---------|----------|---------------|-------|
| **Benefits Management** | ✅ Configure/Manage | ✅ View Team | ✅ View Self | ✅ View All | Health, 401k, PTO accruals |
| **Performance Reviews** | ✅ All Reviews | ✅ Conduct Reviews | ✅ View Own | ✅ View All | Rating system, goals, salary adjustments |
| **PTO Requests** | ✅ Manage All | ✅ Approve Team | ✅ Submit Own | ✅ View All | Vacation/sick leave workflows |
| **Terminations** | ✅ Process | ✅ Limited | ❌ No Access | ✅ View All | Offboarding, exit interviews |
| **Employee Onboarding** | ✅ Manage | ✅ View Progress | ✅ Complete Own | ✅ View All | Multi-step onboarding |

### **Advanced Features**

| Feature | Owner | Manager | Employee | Platform Staff | Notes |
|---------|-------|---------|----------|---------------|-------|
| **Shift Orders/Post Orders** | ✅ Create/Edit | ✅ Create/Edit | ✅ Acknowledge | ✅ View All | Special instructions |
| **White-Label Settings** | ✅ Configure | ❌ No Access | ❌ No Access | ✅ Manage | Branding customization |
| **Billing/Subscription** | ✅ Manage | ❌ No Access | ❌ No Access | ✅ View/Modify | Tier upgrades, payments |

### **Portal Access**

| Portal | Who Can Access | Purpose |
|--------|---------------|---------|
| **Main Dashboard** | Owner, Manager, Employee | Primary workspace interface |
| **Employee Portal** | Employees | Self-service portal (time, schedule, PTO) |
| **Auditor/Bookkeeper Portal** | External Auditors (read-only) | Financial data review |
| **Client/Subscriber Portal** | Clients | View reports, invoices, schedules |

### **Platform Administration** (Platform Roles Only)

| Feature | platform_admin | deputy_admin | deputy_assistant | sysop | Notes |
|---------|---------------|--------------|-----------------|-------|-------|
| **Platform Admin Dashboard** | ✅ | ✅ | ✅ | ✅ | Platform-wide overview |
| **User Management** | ✅ | ✅ | ✅ | ✅ | Manage all platform users |
| **Workspace Admin** | ✅ Full Control | ✅ Full Control | ✅ Read/Modify | ✅ Read-Only | Manage customer workspaces |
| **Custom Forms Builder** | ✅ | ✅ | ✅ | ❌ | Create org-specific forms |
| **Support Commands** | ✅ All | ✅ All | ✅ Most | ✅ Support Only | Customer assistance tools |
| **Sales Portal** | ✅ | ✅ | ✅ | ❌ | Lead management, email campaigns |
| **Command Center** | ✅ | ✅ | ✅ | ✅ | System health, monitoring |

---

## 🛡️ **API Route Protection Summary**

### **Authentication Middleware Usage:**
- **32 protected endpoints** using `requireAuth`, `requireOwner`, `requireManager`, `requireEmployee`
- **21+ platform endpoints** using `requirePlatformStaff` or `requirePlatformAdmin`

### **Critical Protected Routes:**

#### **Workspace Routes (Require Workspace Role)**
```
/api/employees/* → requireOwner or requireManager
/api/clients/* → requireOwner or requireManager
/api/invoices/* → requireOwner
/api/schedule/* → requireManager (create/edit), requireEmployee (view)
/api/time-tracking/* → requireEmployee (own), requireManager (team)
/api/analytics/* → requireOwner (full), requireManager (team)
/api/hr/benefits/* → requireOwner
/api/hr/reviews/* → requireOwner or requireManager
/api/hr/pto/* → requireEmployee (request), requireManager (approve)
/api/hr/terminations/* → requireOwner
```

#### **Platform Routes (Require Platform Role)**
```
/api/admin/support/* → requirePlatformStaff
/api/admin/workspace/:id → requirePlatformStaff
/api/platform/* → requirePlatformStaff
/api/admin/custom-forms/* (POST/PATCH/DELETE) → requirePlatformStaff
/api/sales/* → requirePlatformStaff
```

---

## 🔄 **Role Assignment & Promotion**

### **Workspace Roles:**
- **Owner**: Automatically assigned to workspace creator
- **Manager**: Owner can promote employees to manager
- **Employee**: Default role for new hires

### **Platform Roles:**
- **platform_admin**: Manually assigned in database (supreme authority)
- **deputy_admin/deputy_assistant/sysop**: Assigned by platform_admin
- **Revocation**: Platform roles can be revoked (sets `revokedAt` timestamp)

---

## 🚨 **Security Enforcement**

### **Multi-Tenant Isolation:**
- ✅ All workspace queries filter by `workspaceId`
- ✅ Cross-tenant access blocked via RBAC middleware
- ✅ Platform staff can access all workspaces for support

### **Account Control States:**
| State | Effect | Who Can Apply |
|-------|--------|--------------|
| **Suspended** | Login blocked, workspace frozen | Platform Staff |
| **Frozen** | Read-only access (non-payment) | Platform Staff |
| **Locked** | Emergency lockout | Platform Staff |

### **Password Security:**
- ✅ Bcrypt hashing
- ✅ Account locking after failed attempts
- ✅ Password reset tokens with expiry
- ✅ Email verification for new accounts

---

## 📋 **Support Staff Capabilities**

### **What Platform Staff Can Do:**

#### **For Customers (requirePlatformStaff):**
1. **Search & View** - Find any customer/workspace by email, organization ID, etc.
2. **Workspace Management** - View/modify workspace settings, subscription tiers
3. **User Assistance** - Reset passwords, unlock accounts, adjust limits
4. **Billing Support** - View subscription status, process refunds, adjust fees
5. **Technical Support** - Run diagnostics, view logs, troubleshoot issues
6. **Custom Forms** - Create industry-specific forms for organizations
7. **Sales Operations** - Manage leads, send campaigns, track conversions

#### **Support Command Examples:**
```
✅ Find customer by email
✅ View workspace details
✅ Unlock suspended account
✅ Adjust employee/client limits
✅ Grant/revoke platform roles
✅ Run Stripe diagnostics
✅ View support chat history
✅ Send email campaigns
```

#### **What Platform Staff CANNOT Do:**
❌ Delete customer data (without admin approval)
❌ Modify pricing without authorization
❌ Access production database directly
❌ Bypass audit logging

---

## ✅ **Quick Reference: Who Can Do What**

### **Subscriber Actions (Owner/Manager/Employee):**
- ✅ Manage their own workspace
- ✅ Use all subscribed features per tier
- ✅ Invite/manage employees within limits
- ✅ Access support chat for help
- ✅ Upgrade/downgrade subscription

### **Platform Staff Actions (Admin/Deputy/Sysop):**
- ✅ Access ALL workspaces for support
- ✅ Manage user accounts across platform
- ✅ Configure custom forms for orgs
- ✅ Run sales/marketing campaigns
- ✅ Monitor system health
- ✅ Provide live chat support
- ✅ Execute support commands

### **Platform Admin Exclusive:**
- ✅ Grant/revoke platform roles
- ✅ Modify platform-wide settings
- ✅ Access financial analytics
- ✅ Emergency system controls

---

## 🎯 **Pre-Launch Verification Checklist**

- [ ] Test all workspace roles can access correct pages
- [ ] Verify owners cannot access other workspaces
- [ ] Confirm managers have limited permissions vs owners
- [ ] Validate employees can only see their own data
- [ ] Test platform staff can access all workspaces
- [ ] Verify platform admin has supreme access
- [ ] Test unauthorized access returns 403
- [ ] Confirm unauthenticated requests return 401
- [ ] Validate role promotion/demotion works
- [ ] Test account suspension/freeze/lock states
- [ ] Verify RBAC middleware on all protected routes
- [ ] Test cross-tenant isolation prevention

---

## 🔧 **Settings Persistence by Role**

| Setting Scope | Table | Read Endpoint | Write Endpoint | Roles Allowed |
|---|---|---|---|---|
| Workspace billing/payroll | `workspaces.billingSettingsBlob` | `GET /api/billing-settings/workspace` | `PATCH /api/billing-settings/workspace` | `requireManager` |
| Per-client billing terms | `clientBillingSettings` | `GET /api/billing-settings/clients/:id` | `PATCH /api/billing-settings/clients/:id` | `requireManager` |
| Seat hard cap | `subscriptions.seat_hard_cap_enabled` | `GET /api/billing-settings/seat-hard-cap` | `PATCH /api/billing-settings/seat-hard-cap` | `org_owner`, `co_owner`, platform staff |
| Auditor preferences | `auditor_settings` (migration 0006) | `GET /api/auditor/settings` | `PATCH /api/auditor/settings` | `requireAuditor` (workspace-scoped writes also require an active audit window) |
| Workspace onboarding progress | `workspaces.onboardingStepsCompleted` / `onboardingCompletionPercent` / `onboardingFullyComplete` | `GET /api/workspace/onboarding/progress` | `POST /api/workspace/onboarding/step`, `POST /api/workspace/onboarding/complete` | `requireAuth` |

### **Sub-Tenant Settings Inheritance**

Workspaces with `parent_workspace_id` set inherit `billingSettingsBlob` from their parent. `GET /api/billing-settings/workspace` merges parent under child (sub-tenant overrides win). The response includes `inheritedFromParent: boolean` and `parentWorkspaceId` so the UI can render an "Inherited" badge.

### **Real-Time Sync Events**

All settings-mutating endpoints fan out a `settings_updated` event via `server/services/settingsSyncBroadcaster.ts` over both:

1. **WebSocket broadcast** to every connected client in the workspace + every sub-tenant whose parent matches.
2. **Platform event bus** (`platformEventBus.publish('settings_updated', ...)`) so server-side services can react.

Client-side, `useSettingsSync` (`client/src/hooks/use-settings-sync.ts`) is mounted globally via `<SettingsSyncListener />` in `App.tsx` and invalidates the matching react-query keys on receipt.

### **Trinity Onboarding Gate**

The middleware `requireOnboardingComplete` (in `server/middleware/workspaceScope.ts`) checks `workspaces.onboardingFullyComplete` and returns `412 ONBOARDING_INCOMPLETE` if the tenant has not finished setup. Applied to:

- `/api/trinity/intake`
- `/api/trinity/self-edit`
- `/api/trinity/swarm`

Chat / session / crisis routes are intentionally NOT gated so trial tenants can still get help while onboarding.

The flag flips when `POST /api/workspace/onboarding/complete` publishes the `onboarding_completed` event, which is consumed by `TrinityOnboardingCompletionHandler` in `server/services/trinityEventSubscriptions.ts`.

---

**Last Updated:** May 1, 2026
**Status:** Production Ready - Security Architect Approved ✅
