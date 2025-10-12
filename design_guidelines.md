# Design Guidelines: Multi-Tenant SaaS Scheduling Portal

## Design Approach: Design System with Linear & Material Design Inspiration

**Selected Approach**: Hybrid Design System combining Linear's modern SaaS aesthetic with Material Design's enterprise-grade components

**Justification**: This is a utility-focused productivity tool requiring information density, clear hierarchy, and efficient workflows. The scheduling interface demands precision, clarity, and reliability over visual experimentation. Linear's clean, purposeful design paired with Material Design's robust patterns creates professional credibility essential for B2B SaaS.

**Key Design Principles**:
- Clarity over decoration: Every element serves a functional purpose
- Consistent information hierarchy across all views
- Efficient workflows with minimal clicks to core actions
- Professional, trustworthy aesthetic that businesses rely on daily

---

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary)**:
- Background Base: 217 20% 12%
- Surface Elevated: 217 18% 16%
- Surface Raised: 217 16% 20%
- Border Subtle: 217 15% 28%
- Text Primary: 217 10% 95%
- Text Secondary: 217 10% 65%
- Brand Primary: 220 85% 58% (vibrant blue for CTAs, active states)
- Brand Secondary: 220 75% 48% (hover states, borders)
- Success: 142 65% 48% (confirmed schedules, active employees)
- Warning: 38 92% 58% (conflicts, pending approvals)
- Error: 0 72% 58% (scheduling conflicts, errors)

**Light Mode**:
- Background Base: 0 0% 100%
- Surface Elevated: 217 25% 98%
- Surface Raised: 217 20% 95%
- Border Subtle: 217 15% 88%
- Text Primary: 217 25% 15%
- Text Secondary: 217 15% 45%
- Brand colors remain consistent with dark mode for recognition

### B. Typography

**Font Families**:
- Primary: 'Inter' (via Google Fonts) - body text, UI elements, tables
- Display: 'Inter' with tighter tracking - headings, dashboard titles
- Monospace: 'JetBrains Mono' - time displays, numerical data, invoice numbers

**Scale & Hierarchy**:
- Hero/Dashboard Title: text-4xl font-semibold tracking-tight
- Section Headers: text-2xl font-semibold
- Card Titles: text-lg font-medium
- Body Text: text-sm (14px base) font-normal
- Captions/Meta: text-xs font-medium text-secondary
- Button Text: text-sm font-medium
- Table Headers: text-xs font-semibold uppercase tracking-wide

### C. Layout System

**Spacing Primitives**: Use Tailwind units of 1, 2, 4, 6, 8, 12, 16, 24
- Micro spacing (form fields, buttons): p-2, gap-1
- Component internal: p-4, gap-4
- Section spacing: p-6 to p-8
- Page margins: p-8 to p-12
- Large section breaks: mt-16, mb-24

**Grid System**:
- Dashboard: 12-column grid with 4-unit gaps
- Sidebar: Fixed 280px (desktop), collapsible to 64px icon-only
- Main content: flex-1 with max-w-7xl container
- Calendar views: CSS Grid with auto-fit columns for time slots

### D. Component Library

**Navigation**:
- Top Bar: Fixed header (h-16) with workspace switcher, quick actions, user menu
- Sidebar: Collapsible navigation with icons and labels, grouped by context (Schedule, Employees, Clients, Billing)
- Breadcrumbs: Below header for deep navigation paths

**Calendars & Scheduling**:
- Week View: Primary scheduling interface with drag-and-drop time blocks
- Time slots: 30min or 1hr increments with subtle grid lines (border-subtle)
- Shift blocks: Rounded (rounded-lg), color-coded by employee/status with employee avatar
- Drop zones: Dashed borders with hover state highlighting

**Data Display**:
- Tables: Sticky headers, alternating row backgrounds (surface-elevated), hover states
- Employee Cards: Grid layout with avatar, name, role, availability status indicator
- Client Cards: Compact with contact info, recent appointment count, next scheduled
- Dashboard Widgets: Elevated cards with metric value (text-3xl), label, and trend indicator

**Forms & Inputs**:
- Input Fields: Consistent h-10, rounded-md, border focus states with brand primary
- Date Pickers: Inline calendar view for scheduling
- Dropdowns: Searchable with keyboard navigation for employee/client selection
- Time Pickers: Clock interface with 15min increments

**Modals & Overlays**:
- Scheduling Modal: Center-screen (max-w-2xl) for creating/editing shifts
- Quick Actions: Slide-over panel (w-96) from right for rapid employee/client add
- Confirmations: Small centered modal (max-w-md) for destructive actions
- Invoice Preview: Full-screen overlay with print-friendly layout

**Buttons & Actions**:
- Primary: bg-brand-primary with hover lift effect (hover:brightness-110)
- Secondary: border with subtle background on hover
- Ghost: Text-only with hover background
- Icon Buttons: rounded-md p-2 with icon-only actions

**Status Indicators**:
- Availability: Dot indicator (h-2 w-2) in green/yellow/red
- Schedule Status: Badge with background tint (Confirmed, Pending, Conflict)
- Subscription Tier: Pill-shaped badge next to workspace name

### E. Animations & Interactions

**Use Sparingly**:
- Sidebar collapse: transition-width duration-200
- Calendar drag-and-drop: Smooth transform with shadow lift
- Modal entry: fade-in with subtle scale (scale-95 to scale-100)
- Hover states: brightness or background shifts (duration-150)
- Loading states: Skeleton screens, not spinners, for data-heavy views

**Avoid**: Decorative animations, scroll-triggered effects, unnecessary transitions

---

## Page-Specific Treatments

**Landing/Marketing Page**:
- Hero: Full-width with calendar preview screenshot, centered headline emphasizing "Multi-tenant scheduling that scales"
- Features: 3-column grid showcasing drag-and-drop, multi-tenant, billing automation
- Social Proof: Centered testimonial carousel with company logos
- Pricing: Tiered cards with feature comparison table
- Demo CTA: Sticky bottom bar with "Start Free Trial" button

**Dashboard (Business Owner)**:
- Top metrics row: Revenue this month, active employees, scheduled hours, pending invoices
- Quick actions: Add employee, Create schedule, Generate invoice
- Calendar preview: Current week with today highlighted
- Recent activity feed: Latest schedules, time entries, invoice status

**Schedule View (Drag-and-Drop)**:
- Left sidebar: Employee list with availability filters and drag sources
- Main canvas: Week/day grid with time slots and drop zones
- Right panel: Selected shift details with edit controls
- Bottom toolbar: View toggles (Day/Week/Month), conflict warnings, publish button

**Employee/Client Management**:
- List view with search, filters, and bulk actions in toolbar
- Card grid for visual browsing with quick actions on hover
- Detail panels slide from right for editing

**Billing & Invoicing**:
- Invoice list with status badges, due dates, amounts
- Invoice builder: Template-based with company branding customization
- Payment tracking: Visual timeline showing collection flow

**Onboarding Flow**:
- Multi-step wizard with progress indicator
- Company info → Team setup → Payment method → First schedule
- Encouraging micro-copy and inline help tooltips

---

## Images & Visual Assets

**Hero Image**: Large calendar interface screenshot showing drag-and-drop in action with multiple employees scheduled across a week view (1200x800px, positioned right side of hero with 60/40 text-to-image split)

**Feature Illustrations**: 
- Multi-tenant workspace switcher visual (300x200px cards)
- Employee scheduling flow diagram (600x400px)
- Invoice generation mockup (500x600px)

**Avatars**: Use initials-based generated avatars with brand color backgrounds for employees/clients

**Icons**: Heroicons for all UI elements - outline style for navigation, solid for active states

---

**Accessibility Notes**: 
- Maintain WCAG AA contrast ratios across dark/light modes
- Calendar grid keyboard navigable with arrow keys
- Screen reader labels for all drag-and-drop interactions
- Focus indicators visible on all interactive elements
- Time entries and schedules must be perceivable without color alone (use patterns/labels)