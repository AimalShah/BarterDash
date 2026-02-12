# Render Deployment Plan for BarterDash Backend

## Overview

This guide provides step-by-step instructions for deploying the BarterDash backend to Render, a cloud platform that offers free tier resources for web services and PostgreSQL databases.

---

## Your Backend Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Node.js with TypeScript |
| **Framework** | Express.js |
| **Database** | PostgreSQL (via Supabase connection pooling) |
| **ORM** | Drizzle |
| **Build** | TypeScript compilation (`tsc`) |
| **Entry Point** | `dist/main.js` |

---

## Prerequisites

Before deploying, ensure you have:

- [x] GitHub repository with your code pushed
- [x] Render account (sign up at [dashboard.render.com](https://dashboard.render.com))
- [x] Supabase account with PostgreSQL database
- [x] Stripe account for payment processing
- [x] Upstash account for Redis (optional)

---

## Required Environment Variables

You must configure these environment variables in Render Dashboard under your service's **Environment** tab.

### Critical Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Set to `production` | Yes |
| `PORT` | Render assigns this (usually 10000) | Yes |
| `DATABASE_URL` | Supabase PostgreSQL connection string | **Yes** |
| `JWT_SECRET` | Secret key for JWT tokens (32+ characters) | **Yes** |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...`) | **Yes** |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | **Yes** |

### Additional Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REDIS_URL` | Upstash Redis connection string | Yes |
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `CORS_ORIGIN` | Your frontend domain (e.g., `exp://localhost:8081`) | Yes |
| `ENCRYPTION_KEY` | 32-character hex string for encryption | No |
| `SENTRY_DSN` | Sentry error tracking URL | No |
| `STREAM_API_KEY` | GetStream API key | No |
| `STREAM_API_SECRET` | GetStream API secret | No |
| `EXPO_ACCESS_TOKEN` | Expo push notification token | No |
| `SENDGRID_API_KEY` | SendGrid email API key | No |

---

## Step-by-Step Deployment

### Step 1: Push Code to GitHub

Ensure your backend code is pushed to a GitHub repository:

```bash
cd /home/aimal-shah/code/BarterDash
git add apps/backend/
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** in the top navigation
3. Select **Web Service**
4. Connect your GitHub repository
5. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `barterdash-backend` |
| **Root Directory** | `apps/backend` |
| **Environment** | `Node` |
| **Node Version** | `20.x` (or latest) |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Starter` (free) or `Basic` |

6. Click **Create Web Service**

### Step 3: Set Environment Variables

After service creation:

1. Click on your service name (`barterdash-backend`)
2. Go to **Environment** tab
3. Click **Add Environment Variable**
4. Add each variable from the Required Environment Variables table above

**Important**: Use the actual values from your Supabase project and Stripe dashboard. Do not use the placeholder values from your `.env` file.

### Step 4: Configure Build and Start

Render will automatically detect your `package.json` and run:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

This compiles TypeScript to JavaScript in the `dist/` directory, then starts the Express server.

### Step 5: Health Check Verification

Render automatically creates a health check endpoint. Verify it's working:

```
https://your-service-name.onrender.com/api/v1/health
```

If you don't have a health endpoint, create one in your routes or use the root endpoint:

```
https://your-service-name.onrender.com/
```

---

## Database Setup Options

### Option A: Use Render's Managed PostgreSQL (Recommended)

1. In Render Dashboard, click **New +** → **PostgreSQL**
2. Configure:
   - **Name**: `barterdash-db`
   - **Database**: `barterdash`
   - **User**: `barterdash_user`
   - **Plan**: `Free` (or paid tier)
3. Click **Create Database**
4. Once created, go to **Connection** tab
5. Copy the **External Database URL**
6. Add to your web service's Environment Variables:
   - Key: `DATABASE_URL`
   - Value: (paste the connection string)

### Option B: Use Existing Supabase Database

If you prefer to keep using Supabase:

1. Keep your existing `DATABASE_URL` from `.env`
2. Add your Supabase IP allowlist:
   - Go to Supabase Dashboard → Settings → Database
   - Add Render's IP ranges (0.0.0.0/0 for simplicity in development)

---

## Database Migration

After deployment, you need to run database migrations to create/update tables.

### Method 1: Add to Build Command (Recommended)

Update your build command in Render:

```
npm install && npm run db:push && npm run build
```

### Method 2: Manual Migration via Render Exec

1. In Render Dashboard, select your service
2. Click **Shell** tab
3. Run:

```bash
npm run db:migrate
```

### Method 3: Use Drizzle Studio (Development)

For development, you can use Drizzle Kit Studio:

```bash
npm run db:studio
```

---

## Files to Create for Render

### Procfile (Optional - Render Auto-Detects)

Create `apps/backend/Procfile`:

```
web: npm start
```

### render.yaml (For Auto-Deploy)

Create `apps/backend/render.yaml` for declarative configuration:

```yaml
services:
  - type: web
    name: barterdash-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: barterdash-db
          property: connectionString
    healthCheckPath: /api/v1/health
    pullRequestPreviewsEnabled: true
```

---

## Verifying Your Deployment

### 1. Health Check

Visit your health endpoint:

```
https://barterdash-backend.onrender.com/api/v1/health
```

Expected response:

```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-02-12T..."
}
```

### 2. API Root

Visit the root endpoint:

```
https://barterdash-backend.onrender.com/
```

Expected response:

```json
{
  "success": true,
  "message": "BarterDash API - Express + Drizzle ORM",
  "version": "1.0.0",
  "environment": "production"
}
```

### 3. Check Logs

If issues occur:

1. Go to Render Dashboard → Your Service → **Logs**
2. Filter by level: `Error`, `Warning`, `Info`
3. Look for TypeScript compilation errors or database connection issues

---

## Connecting Your Mobile App

After deployment, update your mobile app to use the production API:

### File: `apps/mobile/lib/api/client.ts`

```typescript
const PRODUCTION_API_URL = 'https://barterdash-backend.onrender.com';

const apiClient = axios.create({
  baseURL: PRODUCTION_API_URL,
  // ... rest of config
});
```

### Environment-Based URL

```typescript
const API_URL = process.env.EXPO_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://barterdash-backend.onrender.com' 
    : 'http://localhost:3000');
```

---

## Cost Estimation

### Free Tier

| Component | Free Allocation | Cost |
|-----------|---------------|------|
| Web Service | 750 hours/month | $0 |
| PostgreSQL | 1 database, 256MB storage | $0 |
| Redis | 30MB storage | $0 |
| **Total** | | **$0/month** |

### Paid Tier (Production)

| Component | Monthly Cost |
|-----------|-------------|
| Web Service (Basic) | ~$7/month |
| PostgreSQL (Standard) | ~$7/month |
| Redis | ~$5/month |
| **Total** | **~$19/month** |

---

## Troubleshooting

### Build Fails

**Error**: `npm install` fails

**Solution**:
1. Check Node.js version compatibility
2. Ensure all dependencies are in `package.json`
3. Clear Render cache: Settings → Clear Build Cache

**Error**: TypeScript compilation fails

**Solution**:
1. Check `tsconfig.json` for correct settings
2. Run `npm run build` locally first
3. Fix TypeScript errors before pushing

### Database Connection Fails

**Error**: `ECONNREFUSED` or `connection refused`

**Solution**:
1. Verify `DATABASE_URL` is correct
2. Check if Supabase allows connections from Render IPs
3. Ensure database is not paused (Render may pause free databases)

### CORS Errors

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
1. Set `CORS_ORIGIN` to your frontend domain
2. For development, use `*` (not recommended for production)

### Service Returns 404

**Error**: Endpoint not found

**Solution**:
1. Verify API prefix is `api/v1`
2. Check route files are mounted correctly in `src/routes/index.ts`
3. Review `src/main.ts` for route registration

---

## Security Best Practices

### 1. Never Commit Secrets

```bash
# Add to .gitignore
.env
.env.local
*.pem
*.key
```

### 2. Use Render Secret Files

For sensitive files (certificates, keys):

1. Render Dashboard → Your Service → **Secret Files**
2. Upload file
3. Reference in application

### 3. Set Up Webhook Security

For Stripe webhooks:

1. Use `STRIPE_WEBHOOK_SECRET` environment variable
2. Verify webhook signatures in your endpoint
3. Use raw body parser for signature verification

### 4. Enable HTTPS

Render automatically provides SSL certificates for all web services.

---

## Rollback Procedure

If deployment causes issues:

1. **Render Dashboard** → Your Service → **Deployments**
2. Find previous successful deployment
3. Click **Deploy** button next to it
4. Monitor logs for errors

---

## Monitoring and Alerts

### Set Up Health Alerts

1. Render Dashboard → Your Service → **Settings**
2. Enable **Health Check**
3. Configure email notifications

### View Metrics

1. Click **Metrics** tab
2. Monitor:
   - Request count
   - Response time
   - Error rate
   - Memory usage

---

## Next Steps After Deployment

1. [ ] Update mobile app API URL to production
2. [ ] Test all API endpoints with Postman
3. [ ] Configure Stripe webhooks for production
4. [ ] Set up custom domain (optional)
5. [ ] Enable CI/CD for automatic deployments
6. [ ] Configure backup and disaster recovery

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Compile TypeScript |
| `npm start` | Start production server |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Drizzle Studio |

---

## Support

- **Render Docs**: https://render.com/docs
- **Express.js**: https://expressjs.com/
- **Drizzle ORM**: https://orm.drizzle.team/
- **Render Community**: https://community.render.com/
