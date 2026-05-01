# WorkforceOS Architecture Reorganization Proposal

## 🎯 Goal
Organize all features into **4 Parent OS Systems** (with ™ branding) that contain child features. Each feature can be toggled on/off and is controlled by organization subscription level.

---

## 📁 Proposed Organization Structure

### 1. **OperationsOS™** (Parent System)
**Purpose**: Day-to-day workforce operations and coordination

**Child Features**:
- ✅ **TrackOS** - Time tracking & attendance
- ✅ **ScheduleOS** - Shift scheduling & calendar management
- ✅ **AssetOS** - Equipment & resource allocation
- ✅ **TaskOS** - Task assignment & project tracking
- ✅ **ReportOS** - Operational reporting & documentation
- ✅ **SupportOS** - Live HelpDesk (dc360/dc360.5 chat systems)

**Access Level**: Basic subscription tier and above

---

### 2. **TalentOS™** (Parent System)
**Purpose**: Employee lifecycle management from hire to retire

**Child Features**:
- ✅ **HireOS** - Smart hiring & applicant tracking
- ✅ **OnboardOS** - Employee onboarding workflows
- ✅ **EngagementOS** - Surveys, feedback, recognition
- ✅ **PerformanceOS** - Reviews & goal tracking
- ✅ **TrainingOS** - Learning & development
- ✅ **OffboardOS** - Exit interviews & offboarding

**Access Level**: Professional subscription tier and above

---

### 3. **FinanceOS™** (Parent System)
**Purpose**: Financial operations, payroll, and billing automation

**Child Features**:
- ✅ **BillOS** - Automated invoice generation
- ✅ **PayrollOS** - Payroll processing & calculations
- ✅ **ExpenseOS** - Expense tracking & reimbursements
- ✅ **BudgetOS** - Budget planning & forecasting
- ✅ **ComplianceOS** - Tax & regulatory compliance

**Access Level**: Professional subscription tier and above

---

### 4. **IntelligenceOS™** (Parent System)
**Purpose**: AI-powered analytics, predictions, and automation

**Child Features**:
- ✅ **AnalyticsOS** - Real-time workforce analytics & dashboards
- ✅ **PredictionOS** - AI workforce predictions (turnover, capacity, etc.)
- ✅ **KnowledgeOS** - AI-powered knowledge base (OpenAI integration)
- ✅ **AutomationOS** - Workflow automation & custom logic builder
- ✅ **InsightOS** - Business intelligence & recommendations
- ✅ **AuditOS** - Comprehensive audit logging & compliance tracking

**Access Level**: Enterprise subscription tier only

---

## 🔐 License-Based Access Control

### Subscription Tiers
```typescript
type SubscriptionTier = 'free' | 'basic' | 'professional' | 'enterprise';

interface OrganizationLicense {
  organizationId: string;
  serialNumber: string; // Unique license key
  tier: SubscriptionTier;
  enabledFeatures: string[]; // e.g., ['TrackOS', 'ScheduleOS', 'BillOS']
  expiresAt: Date;
  maxUsers: number;
}
```

### Feature Access Matrix
| Parent OS | Free | Basic | Professional | Enterprise |
|-----------|------|-------|--------------|------------|
| **OperationsOS™** | ⚠️ Limited | ✅ Full | ✅ Full | ✅ Full |
| **TalentOS™** | ❌ None | ⚠️ Limited | ✅ Full | ✅ Full |
| **FinanceOS™** | ❌ None | ❌ None | ✅ Full | ✅ Full |
| **IntelligenceOS™** | ❌ None | ❌ None | ⚠️ Limited | ✅ Full |

---

## 📱 Desktop vs Mobile Separation

### dc360 (Desktop Version)
**Location**: `client/src/pages/desktop/` and `client/src/components/desktop/`

**Features**:
- Full-featured chat with right-click context menus
- Multi-panel layouts with sidebars
- Advanced data tables with sorting/filtering
- Keyboard shortcuts
- Complex forms with multi-step wizards

**Components**:
- `DesktopChatLayout.tsx` - Full IRC-style chat
- `DesktopDashboard.tsx` - Analytics dashboards
- `DesktopScheduler.tsx` - Drag-drop scheduling
- Desktop-optimized forms and workflows

---

### dc360.5 (Mobile Version)
**Location**: `client/src/pages/mobile/` and `client/src/components/mobile/`

**Features**:
- Touch-optimized chat with bottom sheets
- Single-column mobile-first layouts
- Swipe gestures and tap actions
- Simplified forms with mobile keyboards
- Bottom navigation bars

**Components**:
- `MobileChatLayout.tsx` - Touch-optimized chat
- `MobileDashboard.tsx` - Card-based mobile views
- `MobileScheduler.tsx` - Swipe-based scheduling
- Mobile-optimized action sheets

---

### Shared Components
**Location**: `client/src/components/shared/`

Components used by both desktop and mobile:
- UI primitives (Button, Card, Input, etc.)
- Hooks (useAuth, useChatroomWebSocket, etc.)
- Utilities and helpers
- Shared layouts (headers, footers)

---

## 🎛️ Feature Toggle System

### Database Schema
```typescript
// New table: feature_toggles
export const featureToggles = pgTable('feature_toggles', {
  id: serial('id').primaryKey(),
  organizationId: varchar('organization_id').notNull(),
  featureName: varchar('feature_name').notNull(), // e.g., 'TrackOS', 'BillOS'
  parentSystem: varchar('parent_system').notNull(), // e.g., 'OperationsOS', 'FinanceOS'
  isEnabled: boolean('is_enabled').default(false),
  enabledBy: varchar('enabled_by'), // User ID who toggled it
  enabledAt: timestamp('enabled_at'),
  disabledAt: timestamp('disabled_at'),
  reason: text('reason'), // Why it was toggled
});
```

### API Endpoints
```typescript
// Check if feature is enabled
GET /api/features/:featureName/enabled

// Enable a feature (root/admin only)
POST /api/features/:featureName/enable

// Disable a feature (root/admin only)  
POST /api/features/:featureName/disable

// Get all features for organization
GET /api/features
```

### Frontend Hook
```typescript
// Usage in components
const { isEnabled, isLoading } = useFeature('TrackOS');

if (!isEnabled) {
  return <FeatureDisabledMessage feature="TrackOS" />;
}

return <TimeTrackingDashboard />;
```

---

## 📂 Proposed File Structure

```
client/src/
├── pages/
│   ├── desktop/                    # dc360 - Desktop-only pages
│   │   ├── HelpDeskCab.tsx        # Desktop chat (current)
│   │   ├── DesktopDashboard.tsx   # Analytics dashboard
│   │   └── ...
│   ├── mobile/                     # dc360.5 - Mobile-only pages
│   │   ├── MobileChat.tsx         # Mobile chat
│   │   ├── MobileDashboard.tsx    # Mobile dashboard
│   │   └── ...
│   └── shared/                     # Pages used by both
│       ├── Login.tsx
│       ├── Settings.tsx
│       └── ...
├── components/
│   ├── desktop/                    # Desktop-specific components
│   ├── mobile/                     # Mobile-specific components
│   └── shared/                     # Shared components (current ui/ folder)
├── features/                       # NEW: Organized by Parent OS
│   ├── OperationsOS/
│   │   ├── TrackOS/
│   │   │   ├── TimeTracker.tsx
│   │   │   ├── AttendanceLog.tsx
│   │   │   └── api.ts
│   │   ├── ScheduleOS/
│   │   │   ├── ShiftScheduler.tsx
│   │   │   ├── Calendar.tsx
│   │   │   └── api.ts
│   │   └── SupportOS/
│   │       ├── ChatSystem/
│   │       └── TicketSystem/
│   ├── TalentOS/
│   │   ├── HireOS/
│   │   ├── OnboardOS/
│   │   └── EngagementOS/
│   ├── FinanceOS/
│   │   ├── BillOS/
│   │   ├── PayrollOS/
│   │   └── ExpenseOS/
│   └── IntelligenceOS/
│       ├── AnalyticsOS/
│       ├── PredictionOS/
│       ├── KnowledgeOS/
│       └── AuditOS/
└── ...

server/
├── features/                       # NEW: Backend organized by Parent OS
│   ├── OperationsOS/
│   │   ├── TrackOS/
│   │   │   ├── routes.ts
│   │   │   ├── service.ts
│   │   │   └── storage.ts
│   │   └── ScheduleOS/
│   ├── TalentOS/
│   ├── FinanceOS/
│   └── IntelligenceOS/
└── ...
```

---

## 🚀 Migration Plan

### Phase 1: Add Feature Toggle System (Week 1)
1. Create `feature_toggles` database table
2. Add API endpoints for feature management
3. Create `useFeature()` hook
4. Add feature gates to existing components

### Phase 2: Reorganize Frontend (Week 2-3)
1. Create `client/src/features/` folder structure
2. Move existing OS components into parent folders
3. Separate desktop/mobile components
4. Update imports across codebase

### Phase 3: Reorganize Backend (Week 3-4)
1. Create `server/features/` folder structure
2. Move routes, services, storage into feature folders
3. Update route registrations
4. Test all API endpoints

### Phase 4: Clean Up (Week 4)
1. Remove unused code and components
2. Update documentation
3. Create feature access documentation
4. Test subscription tier restrictions

---

## 💡 Benefits

1. **Clear Organization** - Every feature has a clear parent system
2. **Easy APK Packaging** - Clean separation makes mobile builds simpler
3. **License Control** - Features tied to subscription tiers
4. **Independent Updates** - Fix/update individual features without affecting others
5. **No Code Mixing** - Desktop (dc360) and Mobile (dc360.5) are separate
6. **Scalability** - Easy to add new child features under existing parents
7. **Clean Codebase** - Remove unused code, easier maintenance

---

## ❓ Questions for You

1. **Do these 4 Parent OS systems make sense?** (OperationsOS™, TalentOS™, FinanceOS™, IntelligenceOS™)
2. **Are the child features organized correctly under each parent?**
3. **Should we proceed with this migration plan?**
4. **Any features I missed that need to be categorized?**
5. **Which phase should we start with first?**

Let me know if this organizational structure aligns with your vision, and I'll begin the implementation!

---

## Role Inventory & Trinity Unlock Matrix (May 2026)

### Workspace roles (14)

| Role | Tier | Landing page | Settings persistence | Trinity gates |
|---|---|---|---|---|
| `org_owner` | Owner | `/dashboard` | `workspaces.billingSettingsBlob` (write) | All |
| `co_owner` | Owner | `/dashboard` | `workspaces.billingSettingsBlob` (write) | All |
| `org_admin` | Admin | `/dashboard` | `workspaces.billingSettingsBlob` (requireManager) | All |
| `org_manager` | Admin | `/dashboard` | `workspaces.billingSettingsBlob` (requireManager) | All |
| `manager` | Manager | `/leaders-hub` | `workspaces.billingSettingsBlob` (requireManager) | All |
| `department_manager` | Manager | `/leaders-hub` | Inherits parent `billingSettingsBlob` (sub-tenant) | All |
| `supervisor` | Supervisor | `/leaders-hub` | Read-only | All |
| `employee` | Worker | `/schedule` | Read-only | chat / session / crisis only |
| `staff` | Worker | `/schedule` | Read-only | chat / session / crisis only |
| `contractor` | External worker | `/schedule` | Read-only | chat / session / crisis only |
| `vendor` | External counterparty | `/client-portal` | Read-only | chat / session / crisis only |
| `client` | External customer | `/client-portal` | Read-only | chat / session / crisis only |
| `auditor` | Regulatory | `/auditor/portal` | `auditor_settings` (own) | Read-only audit trails |
| `co_auditor` | Regulatory | `/co-auditor/dashboard` | `auditor_settings` (own) | Read-only audit trails |

### Trinity feature gating

`requireOnboardingComplete` (`server/middleware/workspaceScope.ts`) returns
`412 ONBOARDING_INCOMPLETE` until `workspaces.onboardingFullyComplete=true`.
The flag flips when `POST /api/workspace/onboarding/complete` publishes
`onboarding_completed`, consumed by `TrinityOnboardingCompletionHandler` in
`server/services/trinityEventSubscriptions.ts`. Platform staff bypass.

| Surface | Gated | Reason |
|---|---|---|
| `/api/trinity/intake` | YES | Production intake flows need a configured workspace |
| `/api/trinity/self-edit` | YES | Customizing Trinity needs a configured workspace |
| `/api/trinity/swarm` | YES | Multi-agent orchestration needs a configured workspace |
| `/api/trinity/chat` | NO | Trial / mid-onboarding tenants need conversational help |
| `/api/trinity/session` | NO | Session management must always work |
| `/api/trinity/crisis` | NO | Emergency response must always work |

### Onboarding signal flow (canonical)

```
Wizard step done
      │
      ▼
POST /api/workspace/onboarding/step  →  workspaces.onboardingStepsCompleted +
                                         onboardingCompletionPercent + audit_log
      │
      │ (when all required keys = true)
      ▼
POST /api/workspace/onboarding/complete  →  platformEventBus.publish('onboarding_completed')
                                                 │
                                                 ▼
                            TrinityOnboardingCompletionHandler
                              · flip workspaces.onboardingFullyComplete = true
                              · seed thalamic_log
                              · insert in-app notification
                              · broadcastToWorkspace('onboarding_completed')
                                                 │
                                                 ▼
                  <OnboardingProgressBanner /> morphs into celebration card
                  and /api/trinity/{intake,self-edit,swarm} unlock.
```
