# CoAIleague Production Runbook
# Railway Environment Variables — Complete Reference

> **Status:** All code is built and deployed. This document covers every Railway
> environment variable required for full feature activation.

---

## STEP 1 — Database Migrations (run once, in order)

```bash
node server/scripts/migrate-wave-23d-25.js   # support_sessions, simulation_runs, is_simulation
node server/scripts/migrate-wave-27-fema.js  # surge_events, surge_deployments, per_diem_records
```

Both scripts are idempotent — safe to run multiple times.

---

## STEP 2 — Railway Environment Variables

### Already working (confirm these exist)
```
DATABASE_URL          Neon PostgreSQL connection string
SESSION_SECRET        Any strong random string (64+ chars)
NODE_ENV              production
STRIPE_SECRET_KEY     sk_live_...
STRIPE_WEBHOOK_SECRET whsec_... (from Stripe dashboard → Webhooks → endpoint secret)
```

### Resend (email)
```
RESEND_API_KEY        re_... (from Resend dashboard → API Keys)

RESEND_WEBHOOK_SECRET whsec_... 
  WHERE TO GET: Resend dashboard → Webhooks → click your inbound webhook endpoint
                → "Signing Secret" section → copy the full string INCLUDING whsec_ prefix
  IMPORTANT: Each webhook endpoint has its OWN unique signing secret.
             The inbound email endpoint secret ≠ the delivery events endpoint secret.
             Use the secret from the INBOUND email webhook endpoint specifically.

SENDING_DOMAIN        yourdomain.com (must be DNS-verified in Resend)
  DNS verification: Resend dashboard → Domains → Add Domain → add the TXT/CNAME records shown
```

### Redis (ChatDock multi-replica pub/sub)
```
REDIS_URL             redis://... or rediss://... (Redis Cloud or Railway Redis)
  WITHOUT THIS: ChatDock works on a single replica but messages don't propagate
                across Railway replicas if Railway auto-scales.
  WITH THIS:    Full multi-replica pub/sub via chatDurabilityAdapter.ts
  
  Get from: Railway → New Service → Database → Redis
            Copy the REDIS_URL from the Redis service's Variables tab
```

### Firebase / FCM (push notifications for field officers)
```
FIREBASE_PROJECT_ID       your-firebase-project-id
FIREBASE_CLIENT_EMAIL     firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY      -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n

  WHERE TO GET:
    1. Firebase Console → Project Settings → Service Accounts
    2. Click "Generate New Private Key" → download JSON
    3. From the JSON: project_id → FIREBASE_PROJECT_ID
                      client_email → FIREBASE_CLIENT_EMAIL
                      private_key → FIREBASE_PRIVATE_KEY (include the full key with \n)

  WITHOUT THIS: Push notifications silently fail, fcmService returns false
  WITH THIS:    Field officers receive push alerts when offline
```

### GitHub DevOps (Trinity autonomous commits)
```
OCTOKIT_GITHUB_TOKEN    github_pat_...
  WHERE TO GET: GitHub → Settings → Developer Settings → Fine-grained Personal Access Tokens
                Repository: Coaileague/Coaileague
                Permissions: Contents (Read+Write), Pull Requests (Read+Write)
                IMPORTANT: Development branch only

GITHUB_REPO_OWNER       Coaileague
GITHUB_REPO_NAME        Coaileague
```

### Railway Webhook (deployment notifications to #trinity-command)
```
RAILWAY_WEBHOOK_SECRET  any-string-you-choose (set same value in Railway webhook settings)
  Configure in: Railway dashboard → Project → Settings → Webhooks
                URL: https://yourdomain.com/api/webhooks/railway-deploy
                Header: Authorization: Bearer your-secret
```

### Twilio (SMS — SARGE field commands, surge mobilization)
```
TWILIO_ACCOUNT_SID      ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN       xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER     +1xxxxxxxxxx
  CRITICAL FOR: SARGE calloff handling, surge mobilization SMS blast, officer alerts
```

### Statewide Production Seed
```
STATEWIDE_WORKSPACE_ID  (get from DB: SELECT id FROM workspaces WHERE name LIKE '%Statewide%')
  Run after setting:  npx tsx server/scripts/seedStatewideProduction.ts
```

---

## STEP 3 — Drill Verification

After all env vars are set and migrations run:

```
In #trinity-command:
  /drill-all          → all 4 war room drills must show ✅
  /drill-incident     → UoF ZLP verification (run before any armed post)
  /test-devops        → GitHub connection verified
  /audit-keys         → all 33 Trinity tools bound
```

---

## STEP 4 — Inbound Email Setup (Resend)

1. Resend dashboard → Inbound → Add endpoint
   URL: https://yourdomain.com/api/inbound-email
2. Map addresses: calloffs@, incidents@, support@, docs@ → same endpoint
3. Copy the endpoint's signing secret → RESEND_WEBHOOK_SECRET in Railway

---

## STEP 5 — DNS Verification (sending domain)

1. Resend dashboard → Domains → Add your domain
2. Add the DNS records shown (TXT + CNAME + MX)
3. Wait for verification (usually < 1 hour)
4. Set SENDING_DOMAIN env var to your verified domain

---

## Resend Webhook Secret — Exact Steps

This is the most common point of confusion:

1. Go to: https://resend.com/webhooks
2. Click your inbound webhook endpoint (NOT the delivery events endpoint)
3. Scroll to "Signing Secret" section
4. Click "Show" or "Copy"
5. Copy the FULL string — it starts with `whsec_`
6. In Railway: Variables → Add → RESEND_WEBHOOK_SECRET = whsec_xxxxxxx
7. Railway will redeploy automatically

The code handles the whsec_ prefix correctly — do not strip it.
