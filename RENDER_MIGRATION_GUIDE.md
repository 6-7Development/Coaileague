# WorkforceOS - Render Migration Guide

**Complete step-by-step guide for deploying WorkforceOS to Render**

---

## ✅ Pre-Migration Checklist

### 1. Code Preparation (ALREADY DONE)
- [x] Health check endpoint added at `/health`
- [x] Feature flags for graceful degradation
- [x] WebSocket heartbeat/timeout handling
- [x] Comprehensive `.env.example` file
- [x] Neon serverless driver (works on any platform - Neon databases only)

### 2. Test Locally First
```bash
# Set production-like environment variables
export NODE_ENV=production
export DATABASE_URL="your-test-database-url"
export SESSION_SECRET="generate-with-openssl-rand-base64-32"

# Test the build
npm run build

# Test the production start
npm start

# Verify health check works
curl http://localhost:5000/health
```

---

## 📋 Step-by-Step Render Deployment

### Step 1: Create Render Account (Keep Neon Database)

1. **Sign up at render.com** (if you haven't already)

2. **Database: Keep Your Existing Neon Database (Required)**

   **✅ Use Your Current Neon Database**:
   - No migration needed - works perfectly on Render
   - Current app uses Neon serverless driver
   - Neon provides global edge network and auto-scaling
   - Simply use your existing DATABASE_URL in Step 3

   **⚠️ Alternative: Switch to Render Postgres (ADVANCED - Not Recommended)**:
   - Requires code changes in `server/db.ts`
   - Must switch from Neon driver to `pg` + `drizzle-orm/node-postgres`
   - Data migration required
   - Only do this if you have specific requirements
   - **Not covered in this guide** - stick with Neon for simplicity

### Step 2: Create Web Service

1. **Dashboard → "New+" → "Web Service"**

2. **Connect Your Repository**
   - Choose your Git provider (GitHub, GitLab, etc.)
   - Select your WorkforceOS repository
   - Click "Connect"

3. **Configure Web Service**
   - **Name**: `workforceos-app`
   - **Region**: Same as database
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: Leave empty
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Choose appropriate tier

4. **Advanced Settings**
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: Yes (recommended)

### Step 3: Set Environment Variables

**⚠️ CRITICAL: Set ALL of these BEFORE first deploy**

Click "Environment" tab and add these variables:

```bash
# ============================================
# DATABASE (REQUIRED - Use Your Existing Neon Database)
# ============================================
# IMPORTANT: App uses Neon serverless driver - only works with Neon
# Use your current Neon DATABASE_URL (copy from Replit Secrets)
DATABASE_URL=postgresql://user:pass@hostname.neon.tech/database?sslmode=require

# ============================================
# SESSION & SECURITY (REQUIRED)
# ============================================
SESSION_SECRET=generate-this-with-openssl-rand-base64-32
NODE_ENV=production
PORT=5000

# ============================================
# STRIPE (REQUIRED for payments)
# ============================================
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_publishable_key

# ============================================
# EMAIL (OPTIONAL but recommended)
# ============================================
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# ============================================
# AI SERVICES (OPTIONAL)
# ============================================
OPENAI_API_KEY=sk-your-openai-key
# OR
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# ============================================
# OBJECT STORAGE (OPTIONAL)
# ============================================
DEFAULT_OBJECT_STORAGE_BUCKET_ID=your-bucket-id
PUBLIC_OBJECT_SEARCH_PATHS=/public
PRIVATE_OBJECT_DIR=/.private

# ============================================
# SMS (OPTIONAL)
# ============================================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+15555555555
```

**How to generate SESSION_SECRET**:
```bash
openssl rand -base64 32
```

### Step 4: Deploy

1. **Click "Create Web Service"**
   - Render will start building and deploying
   - Watch the logs for any errors
   - First build takes 5-10 minutes

2. **Monitor Deploy Logs**
   - Look for: ✅ "serving on port 5000"
   - Look for: ✅ Database connection successful
   - Look for: ⚠️ Any environment variable warnings

3. **Verify Health Check**
   - Once deployed, visit: `https://your-app.onrender.com/health`
   - Should return JSON with `status: "healthy"`

---

## 🔧 Post-Deployment

### 1. Test All Features

Visit your deployed app and test:
- [ ] Homepage loads
- [ ] User registration works
- [ ] Login works
- [ ] WebSocket chat connects
- [ ] Stripe subscription flow works
- [ ] Database operations work
- [ ] Email notifications work (if enabled)

### 2. Set Up Custom Domain (Optional)

1. **Render Dashboard → Your Service → Settings**
2. **Custom Domain** section
3. Add your domain (e.g., `app.workforceos.com`)
4. Follow DNS instructions to point your domain
5. Render provides free SSL certificate automatically

### 3. Monitor Application

**Check Health Endpoint Regularly**:
```bash
curl https://your-app.onrender.com/health
```

**Monitor Logs**:
- Render Dashboard → Your Service → "Logs" tab
- Watch for errors or warnings
- Set up log alerts (Render Settings → Alerts)

### 4. Database Backups

**Using Neon Database (Current Setup)**:
1. **Neon Console → Your Project**
2. **Backups** tab (automatic backups included)
3. Point-in-time recovery available
4. Manual backup before major schema changes

**Note**: Since you're using Neon (not Render's database), backups are managed in Neon Console, not Render Dashboard.

---

## 🐛 Troubleshooting

### Issue: Database Connection Timeout

**This app uses Neon serverless driver - only compatible with Neon databases**

**Check**:
1. Using a Neon database URL (contains `.neon.tech`)
2. SSL mode enabled (`?sslmode=require`)
3. Database is running and accessible in Neon dashboard

```bash
# ✅ CORRECT - Neon database URL
postgresql://user:pass@hostname.neon.tech/database?sslmode=require

# ❌ WRONG - Won't work with Neon driver
postgresql://user:pass@hostname.render.com:5432/dbname
postgresql://user:pass@hostname.render.internal:5432/dbname

# To use Render Postgres, you must switch drivers in server/db.ts
# (not recommended - adds complexity)
```

### Issue: Health Check Failing

**Check**:
1. Database connection working?
2. All REQUIRED env vars set?
3. Build completed successfully?

**Debug**:
```bash
# Check health endpoint locally first
curl http://localhost:5000/health

# Check on Render
curl https://your-app.onrender.com/health
```

### Issue: Missing Environment Variables

**Symptoms**:
- Features not working
- Errors in logs about missing env vars

**Solution**:
1. Check `/health` endpoint - shows which features are disabled
2. Add missing env vars in Render Dashboard → Environment
3. Save changes (triggers auto-redeploy)

### Issue: WebSocket Connection Errors

**Check**:
1. Is `wss://` protocol supported? (Render automatically provides SSL)
2. Check firewall/CORS settings
3. Monitor Render logs for WebSocket errors

### Issue: Build Failures

**Common Causes**:
- Missing dependencies in `package.json`
- TypeScript errors
- Environment-specific code

**Debug**:
```bash
# Test build locally
npm run build

# Check build logs on Render
# Dashboard → Service → Logs → Build Logs
```

---

## 📊 Environment Variable Quick Reference

| Variable | Required? | Purpose | Example |
|----------|-----------|---------|---------|
| `DATABASE_URL` | ✅ Yes | Neon database connection | `postgresql://...neon.tech/...?sslmode=require` |
| `SESSION_SECRET` | ✅ Yes | Session encryption | Generate with `openssl rand -base64 32` |
| `NODE_ENV` | ✅ Yes | Environment mode | `production` |
| `STRIPE_SECRET_KEY` | ✅ Yes* | Payment processing | `sk_live_...` |
| `VITE_STRIPE_PUBLIC_KEY` | ✅ Yes* | Payment processing | `pk_live_...` |
| `RESEND_API_KEY` | ⚠️ Optional | Email notifications | `re_...` |
| `OPENAI_API_KEY` | ⚠️ Optional | AI features | `sk-...` |
| `TWILIO_ACCOUNT_SID` | ⚠️ Optional | SMS notifications | `AC...` |

*Required for subscription features to work

---

## 🚀 Performance Optimization

### 1. Database: Neon
- App is configured for Neon (global edge network, auto-scaling)
- Works great on Render - no changes needed
- Neon provides automatic backups and point-in-time recovery

### 2. Enable HTTP/2
- Automatically enabled by Render
- No configuration needed

### 3. CDN for Static Assets (Future)
- Consider Cloudflare CDN for static files
- Reduces Render bandwidth costs

### 4. Database Connection Pooling
- Already configured in `server/db.ts`
- Uses Neon serverless driver

---

## 📝 Deployment Commands

```bash
# ============================================
# Local Development
# ============================================
npm run dev              # Start dev server

# ============================================
# Production Build & Test
# ============================================
npm run build            # Build for production
npm start                # Start production server

# ============================================
# Database Management (from package.json)
# ============================================
npm run db:push          # Sync schema to Neon database

# ============================================
# Health Checks
# ============================================
curl http://localhost:5000/health    # Local
curl https://your-app.onrender.com/health  # Production
```

---

## ✅ Migration Complete Checklist

- [ ] Render account created
- [ ] Neon database URL ready (from existing Replit setup)
- [ ] Web service created on Render and connected to repository
- [ ] All REQUIRED environment variables set in Render
- [ ] First deployment successful
- [ ] Health check endpoint returns "healthy" (`/health`)
- [ ] Test user registration and login
- [ ] Test WebSocket chat functionality
- [ ] Test Stripe subscription flow
- [ ] Custom domain configured (if applicable)
- [ ] Neon database backups verified in Neon Console
- [ ] Monitoring and alerts set up in Render

---

## 🎯 Next Steps

1. **Monitor First Week**
   - Watch logs daily
   - Check `/health` endpoint
   - Monitor error rates

2. **Set Up Alerts**
   - Render Dashboard → Alerts
   - Configure email/Slack notifications
   - Set up health check monitoring

3. **Plan for Scale**
   - Monitor resource usage
   - Upgrade plan if needed
   - Consider Redis for sessions (future)

4. **Backup Strategy**
   - Weekly database exports
   - Document recovery procedures
   - Test restore process

---

## 📞 Support

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **This Project**: Check `/health` endpoint for feature status

---

**🎉 Congratulations! Your WorkforceOS platform is now running on Render!**
