# Jack/GPT Handoff — Phase 3 Component Subdirectory Audit

Branch: `refactor/service-layer`
Date: 2026-04-26

## Active branch verified

Jack checked the active branch before this audit.

Current active branch:

```text
refactor/service-layer
```

Latest observed tip before this handoff:

```text
f3d6ef2acc239695bdd951bfa9c71c6ffd1a1abd
refactor: Phase 3 lib cleanup — -1,297L
```

Claude's current Phase 3 status:

```text
Phase 3 hooks: 24 deleted
Phase 3 top-level components: 112 deleted
Phase 3 lib cleanup: 8 deleted
Phase 3 total: ~43,586L
Grand total: ~90,852L
```

## What Jack verified this turn

Jack did **not** use stale `refactor/client-cleanup`. That branch is ignored.

Jack focused on Claude's requested next Phase 3 target:

```text
client/src/components/admin/
client/src/components/ai-brain/
client/src/components/workboard/
client/src/components/scheduling/
client/src/components/payroll/
client/src/components/chat/
client/src/components/mascot/
```

Skip areas already completed:

```text
client/src/hooks/
client/src/pages/
client/src/components/ top-level .tsx files
client/src/lib/ files already handled in f3d6ef2a
```

## Connector findings

GitHub connector searches for direct import paths returned no live caller evidence for:

```text
components/admin/
components/ai-brain/
components/workboard/
components/scheduling/
components/payroll/
components/chat/
components/mascot/
```

Search examples used:

```text
"components/admin/" "from"
"components/ai-brain/" "from"
"components/workboard/" "from"
"components/scheduling/" "from"
"components/payroll/" "from"
"components/chat/" "from"
"components/mascot/" "from"
```

Most non-empty hits were docs/assets, not live imports.

## Docs index is stale

Jack fetched:

```text
docs/COMPONENT_INDEX.md
```

It lists older component paths such as:

```text
client/src/components/ai-brain/FastModeToggle.tsx
client/src/components/chat/MessageBubble.tsx
```

But fetching those files on `refactor/service-layer` returned 404. Therefore `docs/COMPONENT_INDEX.md` must not be treated as source of truth.

Source of truth must be local filesystem:

```bash
find client/src/components/<subdir> -type f
```

## Important correction

Because GitHub search cannot reliably list all current files in a directory, Jack did **not** delete files through the connector.

Claude should execute locally with `find` + file-path grep + Vite.

---

# Recommended execution: whole component-subdir batch

Claude can safely process the full requested subdirectory domain in one local batch, but delete in Vite-verified chunks.

Target subdirs:

```bash
SUBDIRS=(
  client/src/components/admin
  client/src/components/ai-brain
  client/src/components/workboard
  client/src/components/scheduling
  client/src/components/payroll
  client/src/components/chat
  client/src/components/mascot
)
```

## Step 1 — inventory actual files

```bash
for dir in "${SUBDIRS[@]}"; do
  echo "===== $dir ====="
  find "$dir" -type f \( -name "*.tsx" -o -name "*.ts" \) -print 2>/dev/null | sort
  echo
done
```

## Step 2 — classify each file by file-path import evidence

Use file path, not export name.

```bash
for dir in "${SUBDIRS[@]}"; do
  find "$dir" -type f \( -name "*.tsx" -o -name "*.ts" \) -print 2>/dev/null | sort | while read -r file; do
    rel="${file#client/src/}"
    noext="${rel%.*}"
    base="$(basename "$file")"
    echo "--- $file"
    grep -rn "$noext" client/src --include="*.ts" --include="*.tsx" | grep -v "^${file}:" || true
  done
done
```

Interpretation:

```text
0 non-self results = delete candidate
1+ non-self results = alive, keep
```

## Step 3 — delete in small chunks, Vite after each chunk

Recommended chunking:

```text
admin -> Vite
ai-brain -> Vite
workboard -> Vite
scheduling -> Vite
payroll -> Vite
chat -> Vite
mascot -> Vite
```

If a subdir has many candidates, split into 5-15 files per commit/chunk.

```bash
git rm <dead files>
npx vite build 2>&1 | grep -E "ENOENT|error during|built in"
```

Expected:

```text
built in X.XXs
```

If Vite reports ENOENT or error:

```bash
git restore <failed files>
```

## Step 4 — final checks

```bash
npx vite build 2>&1 | grep -E "ENOENT|error during|built in"
node build.mjs
rg "<<<<<<<|=======|>>>>>>>" .
```

Boot test before merge/PR readiness:

```bash
export DATABASE_URL="postgresql://postgres:MmUbhSxdkRGFLhBGGXGaWQeBceaqNmlj@metro.proxy.rlwy.net:40051/railway"
export SESSION_SECRET="coaileague-dev-test-session-secret-32chars"
node dist/index.js > /tmp/boot_test.txt 2>&1 &
sleep 18
curl -s http://localhost:5000/api/workspace/health
rg "ReferenceError|is not defined|CRITICAL.*Failed" /tmp/boot_test.txt
```

Expected:

```text
401/Unauthorized from health
0 runtime errors
```

---

# High-value likely targets

Based on prior route/service removals and stale docs:

## ai-brain

Likely contains stale Fast Mode / old AI dashboard pieces if any remain:

```text
FastMode*
guardrails-dashboard
issue-detection-viewer
migration-review
document-extraction-upload
```

Fast Mode server/hook surfaces were already removed/trimmed earlier, so any remaining FastMode components are likely dead unless imported by active pages.

## mascot

Likely legacy because mascot hooks/top-level pieces were removed in Phase 3 hooks/components cleanup. Delete files only if no path imports remain.

## chat

Be careful: support/chatroom pages may still use chat subcomponents. File-path grep is mandatory.

## scheduling/payroll

Be careful: pages are alive and may import subdir components. Keep anything referenced by active routed pages.

## workboard/admin

Likely high dead-code potential. Verify with path grep.

---

# Claude goes next

Claude should execute this component-subdirectory cleanup locally on:

```text
refactor/service-layer
```

Do not use:

```text
refactor/client-cleanup
```

After Claude commits, update handoff totals and tell Jack the next domain:

```text
client/src/components/<remaining subdirs>
client/src/utils/
client/src/config/
client/src/types/
client/src/data/
```

## Jack status

Jack is caught up and has left this handoff. It is Claude's turn after this note.
