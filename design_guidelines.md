# WorkforceOS Design System
## Fortune 500 Professional Dashboard Design - ASMR Interactive Experience

### Company Brand Colors (Indigo/Purple Gradient Theme)

#### Primary Indigo Gradient
- **Primary**: `#6366f1` (Indigo 500) - Main brand color
- **Primary Dark**: `#4f46e5` (Indigo 600) - Hover states, emphasis
- **Primary Light**: `#a5b4fc` (Indigo 300) - Text accents, highlights
- **Primary Muted**: `#c7d2fe` (Indigo 200) - Subtle accents

#### Background Layers
- **Base Background**: `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)` (Slate 900→800)
- **Card Background**: `rgba(15, 23, 42, 0.8)` (Semi-transparent slate)
- **Sidebar**: `rgba(15, 23, 42, 0.95)` (Darker, semi-transparent)
- **Elevated**: `rgba(99, 102, 241, 0.15)` (Indigo overlay)

#### Text Hierarchy
- **Primary Text**: `#e2e8f0` (Slate 200) - Main content
- **Accent Text**: `#a5b4fc` (Indigo 300) - Headings, emphasis
- **Secondary Text**: `#94a3b8` (Slate 400) - Descriptions
- **Muted Text**: `#cbd5e1` (Slate 300) - Less important

#### Status Colors
- **Success**: `#10b981` (Emerald 500) - Active, completed
- **Warning**: `#f59e0b` (Amber 500) - Pending, caution
- **Error**: `#ef4444` (Red 500) - Critical, failed
- **Info**: `#6366f1` (Indigo 500) - Information

### **Component Design Patterns**

#### Stat Cards (Gradient Text Effect)
```css
.stat-value {
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #a5b4fc, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

#### Interactive Cards
```css
background: rgba(15, 23, 42, 0.8);
border: 1px solid rgba(99, 102, 241, 0.2);
border-radius: 12px;
padding: 25px;
transition: all 0.3s ease;
```

**Hover State:**
```css
transform: translateY(-3px);
border-color: rgba(99, 102, 241, 0.5);
box-shadow: 0 10px 30px rgba(99, 102, 241, 0.2);
```

#### Primary Buttons (Gradient)
```css
background: linear-gradient(135deg, #6366f1, #4f46e5);
color: white;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
transition: all 0.3s ease;
```

**Hover:** `transform: scale(1.05); box-shadow: 0 5px 15px rgba(99, 102, 241, 0.4);`

#### Secondary Buttons (Outline)
```css
background: transparent;
border: 2px solid #6366f1;
color: #a5b4fc;
padding: 10px 22px;
border-radius: 8px;
```

### **Feature Gating & Upselling System**

#### Locked Feature Card
```css
.locked-feature {
  background: rgba(99, 102, 241, 0.08);
  border: 2px dashed rgba(99, 102, 241, 0.3);
  border-radius: 12px;
  padding: 25px;
  position: relative;
  opacity: 0.7;
  cursor: not-allowed;
}
```

#### Lock Badge Overlay
```css
.lock-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}
```

#### Upgrade Prompt (In-Card)
```tsx
<div className="locked-feature">
  <div className="lock-badge">
     Professional Plan
  </div>
  <div className="feature-preview">
    <h3>Advanced Analytics</h3>
    <p>Unlock predictive scheduling, labor cost optimization, and forecasting</p>
  </div>
  <button className="upgrade-button">
    Upgrade to Professional - $399/mo
  </button>
</div>
```

### **ASMR Animations & Micro-interactions**

#### Pulse Animation (Status Dots)
```css
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}
.status-dot {
  animation: pulse 2s infinite;
}
```

#### Slide In (Notifications)
```css
@keyframes slideIn {
  from { transform: translateX(400px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

#### Smooth Transitions (All Interactive Elements)
```css
transition: all 0.3s ease;
```

### **Role-Specific Dashboard Layouts**

#### Owner Dashboard
**Access Level**: Full platform (tier-gated)
**Key Metrics**:
- Revenue analytics (MRR, ARR)
- Team productivity
- Client satisfaction
- Platform fees collected

**Locked Features** (show based on tier):
- Free: Analytics, Automation, Reports
- Starter: Automation, White-label, API
- Professional: White-label, API, Multi-location
- Enterprise: All unlocked

#### Manager Dashboard
**Access Level**: Assigned team only
**Key Metrics**:
- Team hours worked
- Shift coverage %
- Pending approvals
- Team performance

**Locked Features**:
- Advanced team analytics (Professional+)
- Automated scheduling (Professional+)
- Predictive insights (Enterprise)

#### Employee Dashboard
**Access Level**: Personal data only
**Key Metrics**:
- Hours this week
- Upcoming shifts
- Earnings to date
- Available PTO

**Locked Features**:
- GPS clock-in (Starter+)
- Shift swap requests (Professional+)
- Mobile app access (Professional+)

#### Support Staff Dashboard
**Access Level**: All customer workspaces (read-only)
**Key Metrics**:
- Open tickets
- SLA compliance
- Avg response time
- Customer satisfaction

**All Features Unlocked** (internal use)

#### Client Dashboard (External)
**Access Level**: Their invoices & reports only
**Key Metrics**:
- Outstanding balance
- Payment history
- Service reports
- Usage statistics

**Locked Features**:
- Detailed analytics (if customer has Professional+)
- Custom reports (if customer has Enterprise)

### **Top Bar Design**
```css
.top-bar {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  height: 70px;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}
```

**Search Bar in Top Bar:**
```css
background: rgba(255, 255, 255, 0.2);
border: 1px solid rgba(255, 255, 255, 0.3);
border-radius: 8px;
padding: 10px 20px;
color: white;
```

### 🧭 **Sidebar Navigation**
```css
.sidebar {
  width: 280px;
  background: rgba(15, 23, 42, 0.95);
  border-right: 1px solid rgba(99, 102, 241, 0.2);
}

.nav-item.active {
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.2), transparent);
  color: #a5b4fc;
  border-left: 3px solid #6366f1;
  font-weight: 600;
}

.nav-item:hover {
  background: rgba(99, 102, 241, 0.1);
  color: #a5b4fc;
}
```

### 📈 **Data Tables**
```css
.data-table {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 15px;
}

thead {
  background: rgba(99, 102, 241, 0.1);
}

th {
  color: #a5b4fc;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid rgba(99, 102, 241, 0.2);
}

tbody tr:hover {
  background: rgba(99, 102, 241, 0.08);
}
```

###  **Badges (Status Indicators)**
```css
.badge.active { 
  background: rgba(16, 185, 129, 0.2); 
  color: #10b981; 
}
.badge.pending { 
  background: rgba(245, 158, 11, 0.2); 
  color: #f59e0b; 
}
.badge.critical { 
  background: rgba(239, 68, 68, 0.2); 
  color: #ef4444; 
}
.badge.resolved { 
  background: rgba(99, 102, 241, 0.2); 
  color: #a5b4fc; 
}
```

### **Tier-Based Feature Visibility Rules**

#### Implementation Pattern:
```tsx
import { hasFeature, getUpgradeMessage } from '@/lib/featureFlags';

function AnalyticsSection({ tier }: { tier: string }) {
  const canAccess = hasFeature(tier, 'analytics');
  
  if (!canAccess) {
    return (
      <div className="locked-feature">
        <div className="lock-badge"> Professional</div>
        <h3>Advanced Analytics</h3>
        <p>Predictive scheduling & labor cost optimization</p>
        <button onClick={() => navigate('/upgrade')}>
          {getUpgradeMessage(tier, 'analytics')}
        </button>
      </div>
    );
  }
  
  return <AnalyticsComponent />; // Full feature
}
```

### **Automatic Feature Unlocking**

When subscription tier upgrades:
1. **Backend updates** workspace `subscriptionTier` 
2. **Frontend refetches** workspace data
3. **Feature flags recompute** automatically
4. **Locked cards animate** from dashed to solid border
5. **Content fades in** with smooth transition
6. **Success notification** shows: " Features Unlocked!"

### **Responsive Grid Systems**
```css
/* Stats Grid */
grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));

/* Command Grid */
grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));

/* Quick Actions */
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
```

### **Command/Action Buttons**
```css
.quick-action-btn {
  background: rgba(99, 102, 241, 0.1);
  border: 2px solid rgba(99, 102, 241, 0.3);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.quick-action-btn:hover {
  background: rgba(99, 102, 241, 0.2);
  border-color: #6366f1;
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}
```

### **Notification System**
```css
.notification {
  position: fixed;
  top: 90px;
  right: 30px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 15px 25px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
  animation: slideIn 0.3s ease;
  z-index: 1001;
}
```

### **Spacing Standards**
- **Section Gap**: 30px
- **Card Padding**: 25px
- **Button Padding**: 12px 24px (primary), 10px 22px (secondary)
- **Border Radius**: 8px (buttons), 12px (cards), 15px (sections)

### **Page Title Styling**
```css
.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #a5b4fc;
  margin-bottom: 8px;
}

.page-subtitle {
  color: #94a3b8;
  font-size: 15px;
}
```

### **Terminal/Code Sections** (For Admin Tools)
```css
.terminal-section {
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 15px;
  font-family: 'Courier New', monospace;
}

.terminal-line.success { color: #10b981; }
.terminal-line.error { color: #ef4444; }
.terminal-line.warning { color: #f59e0b; }
```

### **Implementation Checklist**

#### Every Dashboard Must Have:
- ✅ Indigo/purple gradient top bar
- ✅ Dark slate background with gradient
- ✅ Sidebar with active state indicator
- ✅ Role-specific metrics in stat cards
- ✅ Tier-gated features with lock badges
- ✅ Upgrade CTAs with pricing
- ✅ Smooth hover animations (0.3s ease)
- ✅ Gradient text on key numbers
- ✅ Professional table styling
- ✅ Status badges with color coding

#### Feature Gating Requirements:
- ✅ Check `hasFeature(tier, featureName)` before rendering
- ✅ Show locked UI with dashed border for unavailable features
- ✅ Display lock badge with required tier
- ✅ Include upgrade button with exact pricing
- ✅ Auto-refresh when tier changes
- ✅ Smooth unlock animation

This design system ensures every user sees a beautiful, cohesive, ASMR-quality interface tailored to their role and subscription tier, with clear upselling opportunities that automatically disappear when they upgrade. 
