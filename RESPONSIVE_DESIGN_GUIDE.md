# AutoForce™ Responsive Design System

## 🎯 Quick Start

Your site now automatically adapts images, text, and layouts for mobile/tablet/desktop!

## ✅ What's Fixed

1. **Auto-Resizing Images** - No more overflow
2. **Responsive Text** - Perfect sizing on all screens
3. **Mobile/Desktop Detection** - Smart rendering
4. **Hero Sections** - Adapt automatically
5. **Fixed Menus** - Work on all devices
6. **No Horizontal Scroll** - Layout overflow prevented

## 📱 How To Use

### **Responsive CSS Classes** (Use These Everywhere)

```tsx
// Containers (auto padding & max-width)
<div className="responsive-container">...</div>

// Typography (auto-scales to screen size)
<h1 className="responsive-h1">Headline</h1>
<h2 className="responsive-h2">Section Title</h2>
<p className="responsive-body">Body text</p>
<span className="responsive-small">Small text</span>

// Images (auto-fit to screen)
<img src="/hero.jpg" className="responsive-img-hero" />
<img src="/image.jpg" className="responsive-img" />

// Spacing (adapts to screen size)
<section className="responsive-spacing-section">...</section>

// Grids (1 col mobile, 2-3 col desktop)
<div className="responsive-card-grid-3">
  <Card />
  <Card />
  <Card />
</div>
```

### **Responsive Image Component**

```tsx
import { ResponsiveImage, HeroImage } from '@/components/responsive-image';

<ResponsiveImage src="/product.jpg" alt="Product" aspectRatio="video" />
<HeroImage src="/hero.jpg" alt="Hero" />
```

### **Device Detection Hook**

```tsx
import { useDeviceDetection } from '@/hooks/use-device-detection';

function MyComponent() {
  const { isMobile, isTablet, isDesktop } = useDeviceDetection();

  if (isMobile) return <MobileLayout />;
  return <DesktopLayout />;
}
```

## 🚀 Common Fixes

### **Fix: Images overflow on mobile**
```tsx
// ❌ Before
<img src="/image.jpg" />

// ✅ After
<img src="/image.jpg" className="responsive-img" />
```

### **Fix: Text too large on mobile**
```tsx
// ❌ Before
<h1 className="text-6xl">Headline</h1>

// ✅ After
<h1 className="responsive-h1">Headline</h1>
```

### **Fix: Horizontal scrolling**
```tsx
// ❌ Before
<div className="w-[1200px]">Content</div>

// ✅ After
<div className="responsive-container fix-overflow">Content</div>
```

## 📐 Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1023px
- **Desktop**: ≥ 1024px

## ✅ Quick Reference

| Class | Purpose |
|-------|---------|
| `responsive-container` | Auto padding & max-width |
| `responsive-h1/h2/h3` | Responsive headings |
| `responsive-body` | Responsive body text |
| `responsive-img` | Auto-fit images |
| `responsive-img-hero` | Hero section images |
| `responsive-card-grid-3` | 3-column grid (adapts) |
| `fix-overflow` | Prevent horizontal scroll |
| `text-wrap-auto` | Proper text wrapping |
| `mobile-only` | Show only on mobile |
| `desktop-only` | Show only on desktop |

## 📝 Examples

See working examples in:
- `client/src/pages/landing.tsx` - Homepage
- `client/src/components/responsive-image.tsx` - Images
- `client/src/hooks/use-device-detection.tsx` - Device detection

**Everything works automatically - just use the classes!** 🎉
