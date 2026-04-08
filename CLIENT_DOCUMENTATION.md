# BarterDash - Technical Documentation for Client

## Project Overview

BarterDash is a live auction platform with a React Native mobile app (Expo) and Express.js backend.

---

## Repository

| Service | Details |
|---------|---------|
| **GitHub** | https://github.com/AimalShah/BarterDash.git |
| **Repo Type** | Monorepo (Turborepo) |

### Structure
- `apps/backend/` - Express.js + Drizzle ORM API
- `apps/mobile/` - React Native (Expo) mobile app
- `apps/admin/` - Admin dashboard

---

## Hosting & Infrastructure

### Backend Hosting
| Service | Purpose | URL/Location |
|---------|---------|--------------|
| **Vercel** | Backend API hosting | https://barter-dash.vercel.app |
| **Node.js** | Runtime | v20.x |

### Database
| Service | Purpose | Details |
|---------|---------|---------|
| **Supabase** | PostgreSQL Database | Connection pooling enabled |
| **Database URL** | Supabase connection string | Set in Vercel environment variables |

### Redis (Job Queue)
| Service | Purpose | Details |
|---------|---------|---------|
| **Upstash** | Redis for BullMQ job queue | Connection URL in environment |

### Email
| Service | Purpose | API Key |
|---------|---------|---------|
| **Resend** | Transactional emails | `re_xxxxxxxxx` (production key) |

---

## Mobile App

### Expo Configuration
| Setting | Value |
|---------|-------|
| **App Name** | BarterDash |
| **Slug** | barterdash-mobile |
| **Bundle ID (iOS)** | com.barterdash.mobile |
| **Package (Android)** | com.barterdash.mobile |
| **Scheme** | barterdash |
| **Version** | 1.0.0 |

### Build Configuration (EAS)
| Profile | Purpose |
|---------|---------|
| `development` | Internal testing with dev client |
| `preview` | Internal testing |
| `production` | Production build (autoIncrement: true) |

### Production API URL
```
https://barter-dash.vercel.app/api/v1
```

### Expo Services
- **Account**: expo.dev (requires login)
- **Project ID**: 1b23c933-44a4-472e-a968-9e3b1d96ef7c

---

## Third-Party Integrations

### Stripe
| Component | Key Type | Purpose |
|-----------|----------|---------|
| **Stripe Secret Key** | `sk_live_...` | Server-side payments |
| **Stripe Publishable Key** | `pk_live_...` | Mobile app (in app.json) |
| **Webhook Secret** | `whsec_...` | Payment webhooks |
| **Identity Webhook** | `whsec_...` | Identity verification |
| **Merchant ID (iOS)** | `merchant.com.barterdash.mobile` | Apple Pay |
| **Google Pay** | Enabled | Android payments |

### Supabase
| Component | Value |
|-----------|-------|
| **Project URL** | `https://your-project.supabase.co` |
| **Anon Key** | Public key for client |
| **Service Role Key** | Admin access (backend only) |
| **Webhook Secret** | For auth webhooks |

### GetStream (Social Features)
| Component | Purpose |
|-----------|---------|
| **Stream API Key** | Real-time chat & activity feeds |
| **Stream API Secret** | Server-side signing |

### Google Sign-In
| Component | Purpose |
|-----------|---------|
| **Google Sign In** | Native Google authentication |

---

## Environment Variables

### Backend Required Variables
```
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=32+ character secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
REDIS_URL=redis://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
CORS_ORIGIN=exp://localhost:8081
```

### Mobile Required Variables
```
EXPO_PUBLIC_API_URL=https://barter-dash.vercel.app/api/v1
EXPO_PUBLIC_SUPABASE_URL=https://...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## API Endpoints

### Base URL
```
https://barter-dash.vercel.app/api/v1
```

### Key Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/auth/sync` | POST | Sync user profile |
| `/auth/me` | GET | Get current user |
| `/auctions` | GET/POST | List/create auctions |
| `/bids` | POST | Place bid |
| `/payments/payment-sheet` | POST | Stripe Payment Sheet |
| `/payments/webhooks/stripe` | POST | Stripe webhooks |
| `/escrow/create` | POST | Create escrow payment |
| `/sellers/me/dashboard` | GET | Seller dashboard |

---

## Deployment

### Backend to Vercel
1. Connect GitHub repo to Vercel
2. Set root directory to `apps/backend`
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push to main

### Mobile to Stores
1. **iOS (App Store)**: EAS Submit
2. **Android (Play Store)**: EAS Submit

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Monorepo** | Turborepo |
| **Backend** | Express.js, Drizzle ORM |
| **Backend Hosting** | Vercel |
| **Database** | PostgreSQL (Supabase) |
| **Mobile** | React Native, Expo, NativeWind |
| **Payments** | Stripe |
| **Email** | Resend |
| **Queue** | BullMQ + Redis |
| **Auth** | JWT + Supabase Auth |

---

## Step-by-Step: Client Setup Guide

This guide walks the client through setting up their own accounts and deploying the backend to Vercel.

### Step 1: Fork the Repository

1. Go to https://github.com/AimalShah/BarterDash
2. Click **Fork** button (top right)
3. Select your GitHub account as the destination
4. Clone your forked repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/BarterDash.git
   cd BarterDash
   ```

### Step 2: Create Supabase Account & Database

1. Go to https://supabase.com and sign up
2. Click **New project**
3. Enter project details:
   - **Name**: `barterdash` (or your preferred name)
   - **Database Password**: Create a strong password and save it!
   - **Region**: Choose closest to your users
4. Wait for project to be ready (2-3 minutes)
5. Go to **Settings** → **Database**
6. Find **Connection string** section
7. Copy the **URI** (password will be in it - replace if needed)
   - Format: `postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT].supabase.co:5432/postgres`

### Step 3: Create Stripe Account

1. Go to https://stripe.com and sign up
2. Complete account verification
3. Go to **Developers** → **API Keys**
4. Copy your **Secret Key** (starts with `sk_live_...`)
5. Go to **Developers** → **Webhooks**
6. Click **Add endpoint**
7. Enter your future Vercel URL (e.g., `https://your-app.vercel.app/api/v1/payments/webhooks/stripe`)
8. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `account.updated`, `identity_verification_session.verified`
9. Copy the **Webhook Secret** (starts with `whsec_...`)

### Step 4: Create Upstash Redis (Optional - for job queue)

1. Go to https://upstash.com and sign up
2. Click **Create Database**
3. Choose **Redis**
4. Copy the **REST URL** (format: `redis://default:password@host.upstash.io:port`)

### Step 5: Deploy Backend to Vercel

1. Go to https://vercel.com and sign up
2. Click **Add New...** → **Project**
3. Import your forked GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `apps/backend`
5. Click **Deploy**

### Step 6: Configure Environment Variables

After deployment, go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**:

Add these variables:

| Variable | Value | Where to Find |
|----------|-------|---------------|
| `NODE_ENV` | `production` | - |
| `DATABASE_URL` | Supabase connection string | Supabase → Settings → Database |
| `JWT_SECRET` | Generate a random 32+ character string | Use a password generator |
| `STRIPE_SECRET_KEY` | Your Stripe secret key | Stripe → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Your Stripe webhook secret | Stripe → Developers → Webhooks |
| `REDIS_URL` | Upstash Redis URL (optional) | Upstash → Database → REST URL |
| `SUPABASE_URL` | Your Supabase project URL | Supabase → Settings → General |
| `SUPABASE_ANON_KEY` | Your Supabase anon key | Supabase → Settings → API |
| `CORS_ORIGIN` | `*` or your mobile app URL | - |

6. Click **Redeploy** to apply the environment variables

### Step 7: Run Database Migrations

1. In Vercel dashboard, go to **Deployments**
2. Find your latest deployment
3. Click the **...** menu → **Shell**
4. Run the migration command:
   ```bash
   npm run db:push
   ```
5. Exit the shell

### Step 8: Verify Backend is Working

1. Visit: `https://your-vercel-app.vercel.app/api/v1/health`
2. You should see a JSON response with `"status": "healthy"`

### Step 9: Update Mobile App to Use Your Backend

1. Open `apps/mobile/app.json`
2. Update the production API URL in `eas.json`:
   ```json
   "production": {
     "env": {
       "EXPO_PUBLIC_API_URL": "https://your-vercel-app.vercel.app/api/v1"
     }
   }
   ```
3. Update Stripe publishable key in your environment or config

---

## Support Links

- **Vercel Docs**: https://vercel.com/docs
- **Expo Docs**: https://docs.expo.dev
- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Drizzle ORM**: https://orm.drizzle.team/
