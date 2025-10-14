# White-Label Theming System - Clockwork CAD Platform

## Overview
Clockwork's white-label theming system allows Enterprise customers to customize branding while maintaining the professional CAD-style aesthetic that defines the platform.

**Key Principle:** Custom branding enhances the Fortune 500 feel, never compromises it.

---

## Theming Architecture

### 3-Tier Customization System

```
┌─────────────────────────────────────────────────────┐
│ TIER 1: STANDARD                                    │
│ • Default Clockwork branding                        │
│ • Professional CAD dark theme                       │
│ • Clockwork logo in sidebar                         │
│ • Platform watermark on exports                     │
├─────────────────────────────────────────────────────┤
│ TIER 2: PROFESSIONAL (Pro Plan - $999/mo)          │
│ • Custom primary accent color                       │
│ • Company logo upload (sidebar)                     │
│ • Branded email templates                           │
│ • Branded invoice/document exports                  │
│ • Custom workspace name                             │
│ • Clockwork branding remains in UI chrome           │
├─────────────────────────────────────────────────────┤
│ TIER 3: WHITE-LABEL (Enterprise - $2,999+/mo)      │
│ • Complete Clockwork branding removal               │
│ • Custom domain (schedule.yourcompany.com)          │
│ • Full color palette customization (5+ colors)      │
│ • Custom login page with your branding              │
│ • Custom mobile app icons                           │
│ • Custom email domain                               │
│ • API access for deep integrations                  │
│ • CAD aesthetic automatically maintained            │
└─────────────────────────────────────────────────────┘
```

---

## CAD Aesthetic Preservation

### Immutable Design Elements

**These NEVER change, even in white-label:**

1. **Application Frame Structure**
   - Menu bar (top, h-10)
   - Toolbar (below menu, h-12)
   - Status bar (bottom, h-8)
   - Panel-based layout (left-center-right)

2. **Professional Dark Theme**
   - Near-black backgrounds (HSL 215 20% 8%)
   - Subtle panel elevation
   - Precise border system
   - High contrast text

3. **Typography Scale**
   - Dense, technical font sizing
   - Monospace for numbers/timestamps
   - Compact line heights
   - Inter font family (professional sans-serif)

4. **Interaction Patterns**
   - Hover elevations
   - Keyboard shortcuts
   - Context menus
   - Precision click targets

### Customizable Brandable Elements

**Safe to customize while maintaining CAD feel:**

1. **Accent Colors** (must maintain contrast ratios)
   - Primary action color (default: CAD Blue #3B9EFF)
   - Success indicators (default: CAD Green #47D764)
   - Warning states (default: CAD Orange #FF9947)
   - Error states (default: CAD Red #FF4747)

2. **Logo Placement**
   - Sidebar header (max 180×40px)
   - Login page hero (max 400×100px)
   - Email headers (max 600×120px)
   - PDF exports (max 300×60px)

3. **Typography**
   - Custom font family (must be legible at 12px)
   - Must support tabular numbers
   - Recommended: Inter, Roboto, Open Sans, IBM Plex

4. **Workspace Naming**
   - Custom workspace titles
   - Custom domain branding
   - Custom loading screen messages

---

## Color Customization System

### Smart Color Adaptation

Clockwork automatically adjusts custom colors to maintain CAD professionalism:

```typescript
interface WorkspaceTheme {
  // Primary brand color (user-provided)
  brandPrimary: string; // e.g., "#FF6B35" (company orange)
  
  // Clockwork auto-generates these:
  brandPrimaryDark: string;    // Darkened for borders
  brandPrimaryLight: string;   // Lightened for hovers
  brandPrimaryMuted: string;   // Desaturated for subtle accents
  brandOnPrimary: string;      // Contrast text color
  
  // Optional secondary colors
  brandSecondary?: string;
  brandTertiary?: string;
  
  // Logo assets
  logoUrl: string;             // Sidebar logo
  logoUrlInverted?: string;    // For light backgrounds
  faviconUrl?: string;
  
  // Domain settings (Enterprise only)
  customDomain?: string;
  customEmailDomain?: string;
}
```

### Automatic Contrast Protection

```typescript
// Clockwork ensures WCAG AAA compliance
function ensureContrast(colorA: string, colorB: string): string {
  const contrastRatio = calculateContrast(colorA, colorB);
  
  if (contrastRatio < 7) {
    // Auto-adjust lightness until contrast is safe
    return adjustLightness(colorA, targetContrast: 7);
  }
  
  return colorA;
}
```

**Example:** If a company uploads bright yellow (#FFFF00) as their primary color:
- Clockwork darkens it to #B8B800 for readability on dark backgrounds
- Uses original #FFFF00 only for large UI elements
- Generates muted variant #C4C46E for subtle accents

---

## Implementation Example

### CSS Variable Overrides

```css
/* Standard Clockwork Theme (Tier 1) */
:root.dark {
  --cad-primary: 210 100% 58%;  /* Clockwork Blue */
}

/* Custom Branded Theme (Tier 2 & 3) */
:root.dark[data-workspace="acme-corp"] {
  /* User's brand color: #FF6B35 (orange) */
  --cad-primary: 16 100% 60%;           /* Primary orange */
  --cad-primary-dark: 16 100% 45%;      /* Border orange */
  --cad-primary-light: 16 100% 70%;     /* Hover orange */
  --cad-primary-muted: 16 40% 50%;      /* Subtle orange */
  
  /* All other CAD colors remain unchanged */
  --cad-background: 215 20% 8%;         /* Same dark bg */
  --cad-surface: 215 18% 11%;           /* Same panels */
  --cad-text-primary: 215 8% 92%;       /* Same text */
  /* ... */
}
```

### Logo Injection

```tsx
// Sidebar with dynamic branding
function AppSidebar() {
  const workspace = useWorkspace();
  const logo = workspace.theme?.logoUrl || '/clockwork-logo.svg';
  
  return (
    <Sidebar>
      <SidebarHeader className="h-16 flex items-center px-4">
        <img 
          src={logo} 
          alt={workspace.name}
          className="h-8 w-auto object-contain"
        />
      </SidebarHeader>
      {/* Rest of sidebar */}
    </Sidebar>
  );
}
```

---

## White-Label Feature Matrix

| Feature | Standard | Professional | White-Label |
|---------|----------|--------------|-------------|
| **Branding** |
| Clockwork logo in sidebar | ✅ | Custom logo | Custom logo |
| Clockwork menu bar | ✅ | ✅ | Removed |
| "Powered by Clockwork" footer | ✅ | ✅ | Removed |
| Custom primary color | ❌ | ✅ | ✅ Full palette |
| Custom fonts | ❌ | ❌ | ✅ |
| **Domain** |
| app.clockwork.com | ✅ | ✅ | Custom domain |
| Custom login page | ❌ | ❌ | ✅ |
| **Documents** |
| Clockwork watermark on PDFs | ✅ | Removed | Removed |
| Branded email templates | ❌ | ✅ | ✅ |
| Custom invoice design | ❌ | ❌ | ✅ |
| **API & Integration** |
| Clockwork API branding | ✅ | ✅ | White-labeled |
| Webhook branding | ✅ | ✅ | Custom |
| Mobile app | Clockwork | Clockwork | Custom |

---

## Design Guidelines for Custom Themes

### ✅ DO:
- Use professional, corporate color palettes
- Test colors on both light and dark backgrounds
- Maintain high contrast ratios (7:1 minimum)
- Use vector logos (SVG) for crisp rendering
- Keep logos simple and recognizable at small sizes
- Use system fonts or web-safe fonts for performance

### ❌ DON'T:
- Use low-contrast pastels (will be auto-darkened)
- Upload pixelated/low-res logos
- Use more than 3 brand colors (visual clutter)
- Override CAD structural elements (menus, panels)
- Change interaction patterns or keyboard shortcuts
- Use decorative/script fonts for UI elements

---

## Pricing Justification

### Why White-Label Costs $2,999/month

**Technical Implementation:**
- Custom subdomain setup & SSL certificate management
- Database schema extension for per-workspace theming
- CDN distribution for custom assets
- Email server configuration (DKIM, SPF, DMARC)
- iOS/Android app rebranding and resubmission
- API namespace isolation

**Business Value:**
- Appear as in-house software to end users
- Full control over customer experience
- No competitor branding in your workflow
- Professional appearance for Fortune 500 clients
- Charge your own markup on resold services

**ROI Example:**
- Staffing agency charges clients $50/employee/month
- Clockwork white-label cost: $2,999/month
- Break-even: 60 employees
- With 200 employees: $10,000 revenue - $2,999 cost = $7,001 profit/month
- Annual profit: $84,012

---

## Technical Architecture

### Database Schema

```typescript
export const workspaceThemes = pgTable("workspace_themes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").references(() => workspaces.id),
  
  // Tier level
  tier: varchar("tier").default("standard"), // standard, professional, white_label
  
  // Colors (HSL format for dynamic manipulation)
  primaryColor: varchar("primary_color"), // e.g., "16 100% 60%"
  secondaryColor: varchar("secondary_color"),
  successColor: varchar("success_color"),
  warningColor: varchar("warning_color"),
  errorColor: varchar("error_color"),
  
  // Assets
  logoUrl: text("logo_url"),
  logoUrlInverted: text("logo_url_inverted"),
  faviconUrl: text("favicon_url"),
  loginBackgroundUrl: text("login_background_url"),
  
  // Typography
  fontFamily: varchar("font_family"), // e.g., "Inter, sans-serif"
  
  // Domain (Enterprise only)
  customDomain: varchar("custom_domain"),
  customEmailDomain: varchar("custom_email_domain"),
  sslCertificateId: varchar("ssl_certificate_id"),
  
  // Branding removals
  removePoweredBy: boolean("remove_powered_by").default(false),
  removeClockworkLogo: boolean("remove_clockwork_logo").default(false),
  removeWatermarks: boolean("remove_watermarks").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Theme Loading Strategy

```typescript
// Load workspace theme on authentication
async function loadWorkspaceTheme(workspaceId: string) {
  const theme = await db
    .select()
    .from(workspaceThemes)
    .where(eq(workspaceThemes.workspaceId, workspaceId));
  
  if (!theme) {
    return DEFAULT_CAD_THEME;
  }
  
  // Apply theme to CSS variables
  document.documentElement.setAttribute('data-workspace', workspaceId);
  document.documentElement.style.setProperty('--cad-primary', theme.primaryColor);
  
  // Inject custom fonts
  if (theme.fontFamily) {
    injectCustomFont(theme.fontFamily);
  }
  
  return theme;
}
```

---

## Future Enhancements

### Planned Features (Q2-Q3 2025)

1. **Theme Marketplace**
   - Pre-designed color palettes
   - Industry-specific themes (Construction, Healthcare, Retail)
   - One-click theme application

2. **Advanced Customization**
   - Custom dashboard layouts
   - Configurable menu items
   - Role-specific color coding

3. **Multi-Brand Support**
   - Different themes per client/location
   - Franchise-specific branding
   - Department-level customization

4. **Design Tokens API**
   - Export theme as JSON
   - Import from Figma/Sketch
   - Programmatic theme updates

---

## Testing Checklist

Before launching white-label theme:

- [ ] Test primary color contrast on all backgrounds
- [ ] Verify logo renders correctly at all sizes (16px to 400px)
- [ ] Check email templates in Gmail, Outlook, Apple Mail
- [ ] Test PDF exports with custom branding
- [ ] Verify mobile app icon meets App Store guidelines
- [ ] Test custom domain SSL certificate
- [ ] Verify all "Powered by Clockwork" removed
- [ ] Check keyboard shortcuts still work
- [ ] Test dark mode color variations
- [ ] Verify CAD aesthetic maintained

---

**The Result:** A perfectly branded workforce management platform that looks like it was built in-house, while maintaining the professional CAD-style precision that Fortune 500 companies demand.
