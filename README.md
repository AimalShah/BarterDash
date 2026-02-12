# BarterDash Monorepo

This is a Turborepo-powered monorepo containing the BarterDash platform.

## Repository

`https://github.com/AimalShah/BarterDash.git`

## Structure

```
.
├── apps/
│   ├── backend/          # Express.js + Drizzle ORM backend
│   └── mobile/           # React Native (Expo) mobile app
├── packages/             # Shared packages (optional)
├── package.json          # Root workspace configuration
└── turbo.json           # Turborepo pipeline configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 10+

### Installation

```bash
npm install
```

### Environment Setup

Create local env files for both apps:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Then update the values in each `.env` file before running the apps.

### Checkout Notes

- Mobile `SECURE CHECKOUT` uses Stripe Payment Sheet (in-app).
- Backend `FRONTEND_URL` should be an absolute `http(s)` URL when using Stripe Checkout Session endpoints.

### Development

Run all apps in development mode:

```bash
npm run dev
```

Run specific apps:

```bash
# Backend only
cd apps/backend && npm run dev

# Mobile only
cd apps/mobile && npm start
```

### Build

Build all apps:

```bash
npm run build
```

### Lint & Format

```bash
npm run lint
npm run format
```

### Testing

```bash
npm run test
```

### Database Operations

```bash
# Generate migrations
npm run db:generate

# Push to database
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start all apps in development mode |
| `npm run build` | Build all apps |
| `npm run lint` | Lint all apps |
| `npm run format` | Format all apps |
| `npm run test` | Run tests in all apps |
| `npm run type-check` | Type-check all apps |
| `npm run clean` | Clean all build outputs |

## Workspace Commands

Run commands for specific workspaces:

```bash
# Backend
cd apps/backend
npm run dev          # Start backend
npm run db:studio    # Open Drizzle Studio

# Mobile
cd apps/mobile
npm start            # Start Expo
npm run ios          # Run iOS simulator
npm run android      # Run Android emulator
```

## Adding Shared Packages

To create a shared package:

```bash
mkdir packages/shared
cd packages/shared
npm init -y
```

Then update the workspace `package.json` to reference the shared package:

```json
{
  "dependencies": {
    "@barterdash/shared": "*"
  }
}
```

## Tech Stack

- **Monorepo Tool**: Turborepo
- **Backend**: Express.js, Drizzle ORM, PostgreSQL
- **Mobile**: React Native, Expo, NativeWind
- **Package Manager**: npm workspaces
