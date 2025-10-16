# WorkforceOS Enterprise Design System
## Professional Workforce Management Platform

### Design Approach
**System**: IBM Carbon Design System + Enterprise SaaS Best Practices (Workday, ADP, BambooHR)
**Principles**: Data clarity, hierarchical organization, trust through consistency, professional minimalism

### Core Color Palette

#### Primary Corporate Navy
- **Primary Navy**: 217 91% 20% - Main brand, headers, primary actions
- **Navy Hover**: 217 91% 25% - Interactive states
- **Navy Light**: 217 91% 92% - Subtle backgrounds, borders
- **Navy Muted**: 217 91% 85% - Secondary backgrounds

#### Neutral Foundation
- **Background Base**: 220 13% 18% - Main dark background
- **Card Background**: 220 13% 21% - Elevated surfaces
- **Border Subtle**: 217 20% 30% - Dividers, card borders
- **Border Emphasis**: 217 30% 40% - Active borders, focus states

#### Text Hierarchy
- **Heading Text**: 210 20% 98% - Page titles, section headers
- **Body Text**: 214 15% 91% - Primary content
- **Secondary Text**: 215 15% 70% - Labels, descriptions
- **Muted Text**: 215 15% 55% - Timestamps, auxiliary info

#### System Status Colors
- **Success Green**: 152 69% 31% - Completed, active
- **Warning Amber**: 38 92% 50% - Pending, caution
- **Error Red**: 0 72% 51% - Critical, failed
- **Info Blue**: 199 89% 48% - Information, neutral

### Typography System

#### Font Stack
- **Primary**: 'Inter', system-ui, -apple-system, sans-serif
- **Data/Mono**: 'IBM Plex Mono', 'Courier New', monospace

#### Type Scale
- **Display (Dashboards)**: 32px/700 - Page titles
- **Heading 1**: 24px/600 - Section headers
- **Heading 2**: 18px/600 - Card titles, subsections
- **Body Large**: 15px/500 - Primary content, table data
- **Body**: 14px/400 - Standard text, descriptions
- **Caption**: 12px/400 - Labels, metadata
- **Micro**: 11px/600 uppercase - Badges, status tags

### Layout System

**Spacing Units**: Use Tailwind multiples of 4 (p-4, p-6, p-8, gap-6, space-y-8)
**Core Measurements**:
- Section padding: py-8 (mobile) to py-12 (desktop)
- Card padding: p-6
- Component gaps: gap-6 for grids, space-y-4 for stacks
- Container max-width: max-w-7xl

### Component Library

#### Dashboard Cards
- **Base**: Navy-light background (220 13% 21%), 1px border (217 20% 30%)
- **Elevated**: Subtle shadow, 2px border on hover (217 30% 40%)
- **Rounding**: 8px standard
- **Hover**: Translate-y -2px, enhanced border color, shadow

#### Stat Cards (Data-Focused)
- **Number Display**: 36px/700, heading text color
- **Label**: 12px/600 uppercase, secondary text, letter-spacing 0.5px
- **Trend Indicator**: Small arrow icon, success/error color
- **Layout**: Number top, label bottom, minimal decoration

#### Navigation Sidebar
- **Width**: 280px (desktop), collapsible to icon-only 80px
- **Background**: Slightly darker than base (220 13% 16%)
- **Active State**: Navy primary background with left 4px border accent
- **Hover**: Subtle background lift (220 13% 20%)
- **Icons**: Heroicons outline, 20px

#### Top Navigation Bar
- **Height**: 64px
- **Background**: Card background with bottom border
- **Search**: Centered, 400px wide, subtle border input
- **Profile/Actions**: Right-aligned, icon buttons

#### Data Tables
- **Header**: Navy-light background, uppercase 11px/600 text, 2px bottom border
- **Rows**: Alternating subtle backgrounds, 1px dividers
- **Hover**: Row highlight with navy-light tint
- **Cell Padding**: px-4 py-3
- **Sticky Headers**: On scroll for long tables

#### Buttons
- **Primary**: Navy primary background, white text, 600 weight, 8px radius, px-6 py-2.5
- **Secondary**: Transparent with 2px navy border, navy text
- **Ghost**: No border, navy text, hover background
- **Destructive**: Error red background, white text
- **Icon Buttons**: 40px square, icon-only, subtle hover background

#### Form Inputs
- **Background**: Darker than card (220 13% 18%)
- **Border**: 1px subtle, 2px on focus with navy primary
- **Height**: 40px standard
- **Label**: 12px/600, secondary text, mb-2
- **Validation**: Inline error/success messages with icon

#### Badges & Status Tags
- **Pill Shape**: 16px radius, px-3 py-1
- **Active**: Success green background 20% opacity, full color text
- **Pending**: Amber background 20% opacity, amber text
- **Inactive**: Muted background, muted text
- **Priority/Urgent**: Error red treatment

### Feature Gating System

#### Locked Feature Pattern
- **Container**: Dashed 2px border (217 30% 40%), reduced opacity 0.6
- **Lock Badge**: Top-right corner, amber background, white text, "Professional" or tier name
- **Preview Content**: Visible but muted (grayscale filter 50%)
- **CTA Button**: "Upgrade to [Tier] - $X/mo", primary navy button
- **Overlay**: Subtle gradient overlay from bottom

#### Tier Access Levels
- **Free**: Basic dashboard, limited reports
- **Starter ($99/mo)**: GPS tracking, advanced scheduling
- **Professional ($399/mo)**: Analytics, automation, API access
- **Enterprise ($999/mo)**: White-label, multi-location, predictive AI

### Role-Specific Dashboards

#### Executive/Owner View
**Hero Metrics**: 4-column grid (Revenue, Headcount, Productivity, Compliance)
**Sections**: Financial overview, workforce analytics, approval queue, system health
**Locked Features**: Predictive analytics (Enterprise), white-label (Enterprise)

#### HR Manager View
**Hero Metrics**: Open positions, pending approvals, time-off requests, onboarding status
**Sections**: Employee directory table, compliance alerts, hiring pipeline, performance reviews
**Locked Features**: Automated workflows (Professional), advanced reporting (Professional)

#### Team Manager View
**Hero Metrics**: Team size, hours logged, shift coverage, pending requests
**Sections**: Team schedule calendar, timesheet approvals, performance dashboard
**Locked Features**: Team analytics (Professional), automated scheduling (Professional)

#### Employee View
**Hero Metrics**: Hours this week, upcoming shifts, PTO balance, earnings YTD
**Sections**: Personal schedule, time clock, requests/approvals, benefits info
**Locked Features**: Mobile app (Starter), shift swaps (Professional)

### Micro-Interactions (Minimal & Professional)

- **Hover States**: 0.2s ease transitions, subtle elevation/border changes
- **Loading States**: Navy primary spinner, skeleton screens for data
- **Success Feedback**: Green checkmark animation (0.3s), brief toast notification
- **Form Validation**: Instant inline messages, no page shifts
- **Table Sorting**: Arrow icon rotation, smooth re-ordering
- **No Gratuitous Animations**: Focus on data clarity over effects

### Data Visualization

#### Charts & Graphs
- **Color Palette**: Navy primary, success green, amber, info blue (4-color max)
- **Grid Lines**: Subtle gray, 1px
- **Labels**: 12px, secondary text
- **Tooltips**: Dark card background, white text, 8px radius
- **Library**: Recharts with custom theming

#### Progress Indicators
- **Linear**: 8px height, rounded ends, navy primary fill
- **Circular**: 4px stroke, navy primary, percentage centered
- **Step Indicators**: Numbered circles, connecting lines

### Images

**Hero Image**: No large hero image. This is a data-first enterprise dashboard - lead immediately with metrics and actionable data.

**Supplementary Images**:
- **Empty States**: Simple illustrations for no-data scenarios (team illustrations, clipboard icons)
- **Onboarding Flows**: Screenshot mockups showing features (professional, clean captures)
- **Help/Documentation**: Inline screenshots for complex workflows
- **Team Directory**: Professional headshot placeholders (circular, 48px)

**Image Treatment**: All images should have subtle borders, 8px radius, fit within the navy/slate color scheme (no vibrant colors that clash)

### Responsive Behavior

- **Desktop (1280px+)**: Full sidebar, 4-column stat grids, expanded tables
- **Tablet (768-1279px)**: Collapsible sidebar, 2-column grids, horizontal scroll tables
- **Mobile (<768px)**: Bottom nav, 1-column stacks, card-based table rows

### Accessibility Standards

- **Color Contrast**: WCAG AAA (7:1 minimum for text)
- **Focus Indicators**: 3px navy ring on all interactive elements
- **Keyboard Navigation**: Full support, logical tab order
- **Screen Readers**: ARIA labels on all data visualizations, status badges
- **Dark Mode Only**: Optimized for extended dashboard viewing

### Enterprise Trust Signals

- **Security Badges**: SSL, SOC 2, GDPR compliance indicators in footer
- **Uptime Status**: Real-time system status indicator (green dot "All systems operational")
- **Support Access**: Prominent help icon with instant search
- **Data Export**: Download buttons on all tables/reports (CSV, PDF)
- **Audit Logs**: Visible activity tracking for compliance