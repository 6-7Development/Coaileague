# COAILEAGUE REFACTOR — MASTER HANDOFF
# ONE FILE ONLY. Update in place. Never create new handoff files.
# Last updated: 2026-04-27 by Claude — POST-RECOVERY UPDATE

---

## ACTIVE BRANCH
```
refactor/service-layer  →  tip: f8b1b22de
```
Both agents work here. Never push directly to development without a passing boot test.

## DEVELOPMENT (Railway)
```
origin/development  →  4ab16ec08  (STABLE ✅ GREEN — deployed successfully)
```
Do NOT merge origin/development into refactor/service-layer — histories diverged.
Only merge refactor/service-layer → development (one direction, after passing all checks below).

---

## ⚠️ CRITICAL LESSON — READ BEFORE ANY DELETION ⚠️

**10 Railway build failures occurred after Phase 3 client cleanup.**
Every single one was caused by an incomplete deletion. Here is the exact failure taxonomy
so it never happens again.

---

## THE 6 FAILURE PATTERNS (all discovered the hard way)

### PATTERN 1 — Broken static import
File still has `from './DeletedComponent'` after the component file was removed.
```
notifications-popover.tsx → import { AnimatedNotificationBell } from "./animated-notification-bell"
```
**Why missed:** Scanner only checked if deleted file had callers. Didn't check if callers were also components (not pages).

### PATTERN 2 — Broken dynamic import
`lazy(() => import('./DeletedComponent'))` — Rollup resolves these at build time same as static imports. grep for `from` misses them entirely.
```
SeasonalEffectsLayer.tsx → const SnowfallEngine = lazy(() => import('./SnowfallEngine'))
```
**Why missed:** Scanner used `from './X'` pattern only. Dynamic `import('./X')` is a different syntax.

### PATTERN 3 — Barrel export pointing at deleted file
`index.ts` still had `export { X } from './DeletedFile'` after the file was removed.
```
canvas-hub/index.ts → export { MobileResponsiveSheet } from './MobileResponsiveSheet'  // file deleted
schedule/index.ts   → export { DayTabs } from './DayTabs'  // file deleted
ui/index.ts         → export { hover-card } from './hover-card'  // file deleted
```
**Why missed:** Barrel files weren't scanned as import sources — only as targets.

### PATTERN 4 — Named import from barrel where export was removed
Consumer file imports `{ X }` from a barrel. The barrel's index.ts was cleaned (export removed)
but the consuming file still has the import. Rollup traces the full chain and fails.
```
trinity-chat-modal.tsx  → import { TrinityAgentPanel } from '@/components/trinity'
notifications-popover   → import { MobileResponsiveSheet } from '@/components/canvas-hub'
universal-header.tsx    → import { MobileResponsiveSheet, NavigationSheetSection } from '@/components/canvas-hub'
chatdock/ChatDock.tsx   → import { MobileResponsiveSheet } from '@/components/canvas-hub'
helpai-orchestration    → import { HelpAIIntegrationPanel } from '@/components/helpai'
payroll-dashboard       → import { OrgPlaidBankCard } from '@/components/plaid'
calendar-heatmap        → import { ScrollAreaViewport } from '@/components/ui/scroll-area'
```
**Why missed:** Previous scanner only checked relative imports (`./X`), not `@/` aliased barrel imports. Rollup fully resolves both.

### PATTERN 5 — Orphaned JSX body (import removed, JSX tag left behind)
Import line deleted but `<Component prop={x} />` still in the render body.
```
notifications-popover  → <AnimatedNotificationBell notificationCount={...} onClick={...} />
universal-header.tsx   → <MobileResponsiveSheet subtitle="..." side="right" className="...">
ProgressiveHeader.tsx  → <NavigationOverlay isOpen={...} animationState={...} />
BroadcastCard.tsx      → open={showFeedbackForm} onOpenChange={...} broadcastId={...} />
```
**Why missed:** Scanner checked import lines only. JSX usage in render bodies is a separate grep.

### PATTERN 6 — Orphaned JSX props block (opening tag removed, props+close left)
Opening `<Component` tag removed but the props and closing `/>` remain as free-floating text.
Creates invalid syntax because JSX attributes outside a component are not valid.
```
universal-header.tsx line 379:  </Button>}
                                  subtitle="Navigate the platform"   ← orphaned props
                                  side="right"
                                  className="px-3 py-3 pb-6"
                                >
ProgressiveHeader.tsx:  const { isOpen, ... onOpen: () => { ... }, onClose: () => { ... } });
                        ← entire hook destructure with no RHS (hook call removed, destructure left)
ChatDock.tsx line 199:  return (
                        );   ← entire JSX return body was deleted, empty return remained
```
**Why missed:** These require reading the surrounding context, not just line-by-line pattern matching.

---

## MANDATORY PRE-COMMIT CHECKLIST (client file deletions)

**Step 1 — Run the verification script. No exceptions.**
```bash
python3 scripts/verify-client-deletions.py
# Must print: ✅ ZERO issues — platform clean, build will pass
```

**Step 2 — After deleting any component file, manually check:**
```bash
COMPONENT="DeletedComponentName"

# a) Static callers
grep -rn "from.*${COMPONENT}\|import.*${COMPONENT}" client/src --include="*.tsx" --include="*.ts"

# b) Dynamic callers
grep -rn "import(.*${COMPONENT})" client/src --include="*.tsx" --include="*.ts"

# c) JSX usage (even if import line is gone)
grep -rn "<${COMPONENT}[\s/>]" client/src --include="*.tsx"

# d) Barrel file in same directory
grep -n "${COMPONENT}" client/src/components/SUBDIR/index.ts

# e) Named imports from barrel in consuming files
grep -rn "from '@/components/SUBDIR'" client/src --include="*.tsx" --include="*.ts"
# Then verify every named import in those files still exists in the barrel
```

**Step 3 — esbuild check on every file you touched:**
```bash
node_modules/.bin/esbuild PATH/TO/MODIFIED_FILE.tsx --bundle=false 2>&1 | grep "✘"
# Must return nothing
```

**Step 4 — Boot test before pushing to development:**
```bash
export DATABASE_URL="postgresql://postgres:MmUbhSxdkRGFLhBGGXGaWQeBceaqNmlj@metro.proxy.rlwy.net:40051/railway"
export SESSION_SECRET="coaileague-dev-test-session-secret-32chars"
node build.mjs
node dist/index.js > /tmp/boot.txt 2>&1 &
sleep 18
curl -s http://localhost:5000/api/workspace/health   # must → {"message":"Unauthorized"}
grep -cE "ReferenceError|is not defined|CRITICAL.*Failed" /tmp/boot.txt  # must → 0
kill %1
```

---

## SCANNER UPGRADE — verify-client-deletions.py

Script: `scripts/verify-client-deletions.py`
Catches: all 6 patterns above including named barrel imports and esbuild syntax.
Run: before EVERY client commit that involves deletions.

**Known false positives** (safe to ignore, confirmed commented-out code):
- `getPricingTier`, `getTierFeatures`, `isFeatureInTier` in `useConfig.ts` — commented import
- `CHART_PALETTE` in `designSystem.ts` — appears in JSDoc comment only

---

## BRANCH RULES (permanent)

- Jack audits on `refactor/service-layer`, Claude executes and merges to `development`
- Never push directly to `development` without passing all 4 checklist steps
- Never merge `origin/development` INTO `refactor/service-layer` — it will restore deleted files
- Only direction: `refactor/service-layer` → `development`
- Claude runs the verification script before every merge. Jack runs it before every audit commit.

---

## CURRENT STATUS

**Phase 1 (routes):** ✅ Complete — ~24,335L removed
**Phase 2 (services):** ✅ Complete — ~22,931L removed
**Phase 3 (client):** ✅ Complete — ~43,663L removed
**Total removed:** ~90,929L

**Platform:** GREEN ✅ on `4ab16ec08`

---

## NEXT TARGETS

Jack's next audit pass: `client/src/store/` and `client/src/types/`

Same methodology — but now with the upgraded scanner and all 6 patterns in mind.
Jack: do NOT delete anything without running `python3 scripts/verify-client-deletions.py` first.
If unsure about wiring — flag it for Claude to verify before deletion.

---

## PROCESS RULES

- Read this file at the start of every turn
- Update it at the end of every turn
- Never create separate handoff files
- One file, updated in place

