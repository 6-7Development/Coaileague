# Design Guidelines: Fortune 500 CAD-Style Application

## Design Philosophy

**Approach**: Professional CAD/Engineering Application Interface (like AutoCAD, SolidWorks, Adobe Creative Suite)

**Core Principle**: This is a **program**, not a website. Every element reinforces that this is a professional, desktop-grade workforce management system.

### Key Characteristics
- **Dense Information Display**: Maximize data per screen, minimize whitespace
- **Application Frame**: Menu bar, toolbars, panels, status bar (like desktop software)
- **Keyboard-First**: Hotkeys for everything, power user focused
- **Dockable Panels**: Resizable, rearrangeable workspace panels
- **Professional Dark Theme**: CAD-grade dark interface with accent colors for status
- **Context-Aware**: Toolbars and panels change based on selection
- **Precision**: Exact measurements, timestamps, numerical accuracy

---

## Application Frame Structure

### Top Menu Bar (h-10, ultra-compact)
```
┌─ File ─ Edit ─ View ─ Schedule ─ Tools ─ Help ──────────────────────┐ [Clock] [User]
```
- **File**: New Workspace, Open, Save Layout, Export, Print, Exit
- **Edit**: Undo, Redo, Preferences, Keyboard Shortcuts
- **View**: Panels (toggle), Zoom, Layout Presets, Full Screen
- **Schedule**: New Shift, Templates, Recurring, Conflicts
- **Tools**: Time Clock, Invoice Generator, Reports, Analytics
- **Help**: Docs, Shortcuts, Support, About

### Toolbar (h-12, icon-dense)
Context-aware toolbar changes based on active panel/selection:
- **Schedule Mode**: New Shift, Template, Copy, Paste, Delete, Publish
- **Employee Mode**: Add, Edit, Assign Manager, Set Rate, Deactivate
- **Invoice Mode**: Generate, Preview, Send, Mark Paid, Export PDF

### Status Bar (h-8, always visible at bottom)
```
└─ [Workspace: Acme Corp] [Active: 5] [Clocked In: 3] [Conflicts: 0] [Server: Connected] [12:45:30 PM] ─┘
```
- Left: Workspace info, active users, current status
- Center: Warnings, conflicts, notifications
- Right: System status, clock

### Panel System
- **Left Panel**: Navigator (Employees, Clients, Schedule Tree)
- **Center**: Main workspace (Schedule, Reports, Forms)
- **Right Panel**: Properties (Selected item details, actions)
- **Bottom Panel**: Console/Logs (optional, for debugging)

---

## Color System - CAD Professional Dark

### Base Colors (Very Dark, Like AutoCAD)
```css
--cad-background: 215 20% 8%;        /* Near black background */
--cad-surface: 215 18% 11%;          /* Panels, cards */
--cad-surface-elevated: 215 16% 14%; /* Dialogs, popovers */
--cad-border: 215 12% 22%;           /* Subtle borders */
--cad-border-strong: 215 12% 32%;    /* Panel dividers */
```

### UI Chrome (Menu/Toolbar/Status)
```css
--cad-chrome: 215 15% 13%;           /* Menu bar, toolbar background */
--cad-chrome-hover: 215 15% 18%;     /* Hover states */
--cad-chrome-active: 215 15% 24%;    /* Active/pressed */
```

### Text Hierarchy
```css
--cad-text-primary: 215 8% 92%;      /* Primary text */
--cad-text-secondary: 215 8% 68%;    /* Secondary text */
--cad-text-tertiary: 215 8% 48%;     /* Disabled, meta */
--cad-text-inverted: 215 20% 12%;    /* On bright backgrounds */
```

### Accent Colors (Status Indicators)
```css
--cad-blue: 210 100% 58%;            /* Primary actions, links */
--cad-green: 142 76% 48%;            /* Success, confirmed */
--cad-orange: 38 92% 58%;            /* Warnings, pending */
--cad-red: 0 84% 58%;                /* Errors, conflicts */
--cad-purple: 271 76% 60%;           /* Info, templates */
--cad-cyan: 188 94% 54%;             /* Active timers, clocked in */
```

### Semantic Colors
```css
--cad-primary: var(--cad-blue);
--cad-success: var(--cad-green);
--cad-warning: var(--cad-orange);
--cad-danger: var(--cad-red);
--cad-info: var(--cad-purple);
```

---

## Typography - Dense & Technical

### Font Stack
```css
--font-ui: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
--font-display: 'Inter', sans-serif; /* Tight tracking */
```

### Type Scale (Smaller than web defaults)
- **Menu Items**: text-xs (12px) font-medium
- **Toolbar Labels**: text-xs (12px) font-normal
- **Panel Headers**: text-sm (14px) font-semibold uppercase tracking-wide
- **Body Content**: text-sm (14px) font-normal
- **Table Data**: text-xs (12px) font-normal (for dense tables)
- **Timestamps**: text-xs (12px) font-mono
- **Numbers**: text-sm font-mono (for precision)
- **Status Bar**: text-xs (12px) font-medium

---

## Layout System - Panel-Based

### Grid Structure
```
┌─────────────────────────────────────────────────────┐
│ Menu Bar (h-10)                          [User]     │
├─────────────────────────────────────────────────────┤
│ Toolbar (h-12)                                      │
├───────┬─────────────────────────────────┬───────────┤
│       │                                 │           │
│ Left  │   Main Workspace                │   Right   │
│ Panel │   (flex-1)                      │   Panel   │
│       │                                 │           │
│(w-64) │                                 │  (w-80)   │
│       │                                 │           │
├───────┴─────────────────────────────────┴───────────┤
│ Status Bar (h-8)                                    │
└─────────────────────────────────────────────────────┘
```

### Spacing - Compact
- **Micro**: gap-1 (4px) - Between icons, inline items
- **Small**: gap-2 (8px) - Form fields, button groups
- **Medium**: gap-4 (16px) - Panel sections
- **Large**: gap-6 (24px) - Major sections

### Panel Sizes
- **Sidebar Left**: w-64 (256px), collapsible to w-12 (48px icon-only)
- **Properties Right**: w-80 (320px), resizable
- **Main Content**: flex-1 (fluid)

---

## Component Specifications

### Menu Bar
- **Height**: h-10 (40px) - compact like desktop apps
- **Background**: bg-cad-chrome with subtle border-b
- **Items**: Horizontal menu with dropdowns
- **Hover**: bg-cad-chrome-hover, no border/outline
- **Typography**: text-xs font-medium

### Toolbar
- **Height**: h-12 (48px)
- **Layout**: Icon buttons with optional labels
- **Grouping**: Separator lines between logical groups
- **Tooltips**: Keyboard shortcuts shown in tooltips
- **States**: Disabled, active, pressed

### Panels
- **Header**: h-10 with title, collapse button, context menu
- **Content**: Dense scrollable content
- **Resize**: Draggable borders between panels
- **Background**: bg-cad-surface with border

### Status Bar
- **Height**: h-8 (32px) - very compact
- **Sections**: Left (workspace info), Center (status), Right (system)
- **Typography**: text-xs font-medium
- **Indicators**: Colored dots for status (green/yellow/red)

### Data Tables
- **Row Height**: h-8 (32px) - very dense
- **Headers**: Sticky, sortable, uppercase text-xs
- **Alternating**: Subtle stripe pattern (bg-cad-surface-elevated)
- **Selection**: Checkbox column, multi-select support
- **Hover**: Subtle highlight

### Forms
- **Input Height**: h-9 (36px) - slightly larger than menu
- **Labels**: text-xs font-medium text-cad-text-secondary
- **Inline**: Side-by-side labels for space efficiency
- **Groups**: Minimal padding, maximum density

---

## Keyboard Shortcuts

### Global
- `Ctrl+N`: New (context-aware)
- `Ctrl+S`: Save/Publish
- `Ctrl+P`: Print/Export
- `Ctrl+K`: Command Palette
- `Ctrl+/`: Show all shortcuts
- `F11`: Full screen
- `Esc`: Close dialog/deselect

### Navigation
- `Ctrl+1-9`: Switch panels/views
- `Ctrl+Tab`: Cycle open tabs
- `Ctrl+B`: Toggle left sidebar
- `Ctrl+Shift+B`: Toggle right sidebar

### Schedule
- `S`: New shift
- `T`: From template
- `R`: Recurring
- `C`: Copy selected
- `V`: Paste
- `Del`: Delete selected
- `Ctrl+D`: Duplicate

### Time Tracking
- `Space`: Clock in/out (when employee selected)
- `Ctrl+T`: New time entry

---

## Interactions

### Hover States
- Menu items: bg-cad-chrome-hover (subtle)
- Buttons: Slight brightness increase
- Rows: bg-cad-chrome-hover (very subtle)
- Panels: No hover effects (too noisy)

### Selection
- Single: Click to select (blue border)
- Multi: Ctrl+Click, Shift+Click
- Range: Click-drag in tables

### Drag & Drop
- Visual feedback: Ghost image + drop target highlight
- Snap to grid: When dragging shifts
- Cancel: Esc key

### Context Menus
- Right-click on items
- Dark popover with dense menu items
- Keyboard shortcuts shown on right

---

## No Website Elements

### Remove/Replace
- ❌ Marketing hero sections
- ❌ Landing page CTAs
- ❌ Large whitespace
- ❌ Centered layouts
- ❌ Decorative elements
- ✅ Dense toolbars
- ✅ Nested panels
- ✅ Data-first views
- ✅ Keyboard shortcuts everywhere
- ✅ Status indicators

---

## Accessibility

- High contrast mode: Optional lighter dark theme
- Keyboard navigation: Full keyboard control
- Screen readers: Proper ARIA labels
- Focus indicators: Visible blue outline
- Zoom: Support 100%-200% zoom levels
