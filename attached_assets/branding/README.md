# WorkforceOS Branding Assets

This directory contains all official WorkforceOS logo and branding files.

## Logo Files

### Primary Logo
**File:** `workforceos-logo-primary.svg`
- **Use:** Main logo for light backgrounds (website, documents, presentations)
- **Colors:** Blue gradient (#3b82f6 to #1d4ed8) with dark text
- **Features:** Neon-style "W" with "OS" superscript, full wordmark, tagline

### Icon Logo
**File:** `workforceos-logo-icon.svg`
- **Use:** Favicons, app icons, social media profile pictures, mobile apps
- **Size:** 80x80px square
- **Features:** Neon "W" with "OS" on dark circular background

### White Logo
**File:** `workforceos-logo-white.svg`
- **Use:** Dark backgrounds, hero sections, footer, dark mode
- **Colors:** Light blue gradient (#60a5fa to #3b82f6) with white text
- **Features:** Same as primary logo but optimized for dark backgrounds

### Wordmark
**File:** `workforceos-wordmark.svg`
- **Use:** Horizontal layouts, headers, navigation bars
- **Features:** Text-only logo without icon

## Brand Colors

### Primary Colors
- **Primary Blue:** `#3b82f6` (blue-500)
- **Dark Blue:** `#1d4ed8` (blue-700)
- **Light Blue:** `#60a5fa` (blue-400)

### Neutral Colors
- **Dark Slate:** `#1e293b` (slate-800)
- **Medium Gray:** `#64748b` (slate-500)
- **Light Gray:** `#cbd5e1` (slate-300)

## Usage Guidelines

### Do's ✅
- Use the primary logo on light backgrounds
- Use the white logo on dark backgrounds
- Maintain minimum clear space around the logo (equal to the height of "OS")
- Use the icon logo for square formats (favicons, app icons)
- Scale proportionally - never distort

### Don'ts ❌
- Don't change logo colors
- Don't add effects or filters
- Don't rotate or skew the logo
- Don't place logo on busy backgrounds without contrast
- Don't recreate or modify the logo

## Logo Variations by Context

| Context | Recommended File |
|---------|-----------------|
| Website Header (Light) | `workforceos-logo-primary.svg` |
| Website Footer (Dark) | `workforceos-logo-white.svg` |
| Favicon | `workforceos-logo-icon.svg` |
| Email Signature | `workforceos-wordmark.svg` |
| Social Media Profile | `workforceos-logo-icon.svg` |
| Print Materials | `workforceos-logo-primary.svg` |
| Mobile App Icon | `workforceos-logo-icon.svg` |
| Loading Screen | `workforceos-logo-icon.svg` |

## File Formats

All logos are provided in **SVG** (Scalable Vector Graphics) format for:
- ✅ Infinite scalability without quality loss
- ✅ Small file sizes
- ✅ Crisp rendering on all displays (retina, 4K, etc.)
- ✅ Easy color customization if needed
- ✅ Web-ready and print-ready

## Importing Logos in Code

### React/TypeScript (Vite)
```typescript
import LogoPrimary from "@assets/branding/workforceos-logo-primary.svg";
import LogoIcon from "@assets/branding/workforceos-logo-icon.svg";
import LogoWhite from "@assets/branding/workforceos-logo-white.svg";
import Wordmark from "@assets/branding/workforceos-wordmark.svg";

// Usage
<img src={LogoPrimary} alt="WorkforceOS" className="h-12" />
```

### HTML
```html
<img src="/attached_assets/branding/workforceos-logo-primary.svg" 
     alt="WorkforceOS" 
     width="240" 
     height="80">
```

### CSS Background
```css
.logo {
  background-image: url('/attached_assets/branding/workforceos-logo-primary.svg');
  background-size: contain;
  background-repeat: no-repeat;
}
```

## Design Philosophy

The WorkforceOS logo embodies:
- **Professional:** Clean, modern typography suitable for Fortune 500 clients
- **Technological:** Neon glow effect suggests innovation and digital transformation
- **Trustworthy:** Blue color palette conveys reliability and corporate professionalism
- **Distinctive:** Unique "W" lettermark creates memorable brand identity
- **Scalable:** OS™ superscript system allows for branded sub-products (ScheduleOS™, PayrollOS™, etc.)

## Questions?

For brand guidelines, logo usage permissions, or custom logo variations, contact your WorkforceOS design team or refer to the full Brand Guidelines document.
