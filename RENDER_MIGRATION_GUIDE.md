# WorkforceOS - Render Migration Guide

**Complete step-by-step guide for deploying WorkforceOS to Render**

---

## ✅ Pre-Migration Checklist

### 1. Code Preparation (ALREADY DONE)
- [x] Database configured for Render internal URLs
- [x] Health check endpoint added at `/health`
- [x] Feature flags for graceful degradation
- [x] WebSocket heartbeat/timeout handling
- [x] Comprehensive `.env.example` file

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

### Step 1: Create Render Account & Database

1. **Sign up at render.com** (if you haven't already)

2. **Create PostgreSQL Database FIRST**
   - Dashboard → "New+" → "PostgreSQL"
   - Name: `workforceos-db`
   - Plan: Choose appropriate tier
   - Region: Choose closest to your users
   - Click "Create Database"
   
3. **Copy INTERNAL Database URL** ⚠️ IMPORTANT
   - Once created, go to database → "Info" tab
   - Find "Internal Database URL" (NOT External)
   - Format: `postgresql://user:pass@hostname.render.internal:5432/dbname`
   - **Save this - you'll need it in Step 3**

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
# DATABASE (REQUIRED)
# ============================================
DATABASE_URL=postgresql://user:pass@hostname.render.internal:5432/dbname
# ☝️ Use INTERNAL URL from Step 1

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

1. **Render Dashboard → Your Database**
2. **Backups** tab
3. Enable automatic backups (recommended)
4. Manual backup before major changes

---

## 🐛 Troubleshooting

### Issue: Database Connection Timeout

**Solution**: Make sure you're using INTERNAL database URL
```bash
# ❌ WRONG (External URL)
postgresql://user:pass@hostname.render.com:5432/dbname

# ✅ CORRECT (Internal URL)
postgresql://user:pass@hostname.render.internal:5432/dbname
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
| `DATABASE_URL` | ✅ Yes | Database connection | `postgresql://...render.internal:5432/...` |
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

### 1. Use Internal Database URL
- **Always** use `.render.internal` URL
- 10-100x faster than external URL
- Stays within Render's private network

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
# Database Management
# ============================================
npm run db:push          # Sync schema to database
npm run db:studio        # Open Drizzle Studio

# ============================================
# Health Checks
# ============================================
curl http://localhost:5000/health    # Local
curl https://your-app.onrender.com/health  # Production
```

---

## ✅ Migration Complete Checklist

- [ ] Render account created
- [ ] PostgreSQL database created on Render
- [ ] INTERNAL database URL copied
- [ ] Web service created and connected to repository
- [ ] All REQUIRED environment variables set
- [ ] First deployment successful
- [ ] Health check endpoint returns "healthy"
- [ ] Test user registration and login
- [ ] Test WebSocket chat functionality
- [ ] Test Stripe subscription flow
- [ ] Custom domain configured (if applicable)
- [ ] Database backups enabled
- [ ] Monitoring and alerts set up

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
