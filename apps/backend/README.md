# BarterDash Backend - Express + Drizzle ORM

Live auction platform backend built with Express.js and Drizzle ORM.

## 🚀 Tech Stack

- **Framework**: Express.js 4.x
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (Supabase)
- **Language**: TypeScript
- **Authentication**: JWT + Supabase Auth
- **Validation**: Zod
- **Job Queue**: BullMQ + Redis
- **Payments**: Stripe
- **Error Handling**: Result/Either pattern (neverthrow)

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database (Supabase account)
- Redis instance (for job queue)
- Stripe account (for payments)

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env  # Then edit .env with your credentials
```

## ⚙️ Configuration

Create a `.env` file with the following variables:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT
JWT_SECRET=your-super-secret-key-min-32-characters

# CORS
CORS_ORIGIN=*

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_IDENTITY_WEBHOOK_SECRET=whsec_... # Stripe Identity webhooks

# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Optional
SENTRY_DSN=https://...
```

## 🗄️ Database Setup

```bash
# Option 1: Pull existing schema from database
npm run db:pull

# Option 2: Push Drizzle schema to database
npm run db:push

# Generate migrations
npm run db:generate

# Open Drizzle Studio (database admin UI)
npm run db:studio
```

## 🚀 Running the Application

```bash
# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The server will run on `http://localhost:3000`

## 📍 API Endpoints

### Health Check
- `GET /api/v1/health` - API health status

### Authentication
- `POST /api/v1/auth/sync` - Sync user profile after Supabase Auth *(Protected)*
- `POST /api/v1/auth/logout` - Logout user *(Protected)*
- `GET /api/v1/auth/me` - Get current user profile *(Protected)*

### Auctions
- `POST /api/v1/auctions` - Create new auction *(Protected, SELLER only)*
- `GET /api/v1/auctions` - List all auctions *(Public)*
- `GET /api/v1/auctions/:id` - Get auction details *(Public)*
- `POST /api/v1/auctions/:id/go-live` - Start live auction *(Protected, SELLER only)*

### Users (TODO)
*Coming soon*

### Bids (TODO)
*Coming soon*

### Payments (TODO)
*Coming soon*

### Sellers (TODO)
*Coming soon*

## 📁 Project Structure

```
src/
├── config/          # Centralized configuration
├── db/              # Drizzle schema & connection
│   ├── schema.ts    # Database schema definitions
│   └── index.ts     # DB connection
├── middleware/      # Express middleware
│   ├── auth.ts      # JWT authentication
│   ├── roles.ts     # Role-based authorization
│   ├── validate.ts  # Zod validation
│   ├── error-handler.ts  # Global error handling
│   └── logger.ts    # Request logging
├── routes/          # API routes
│   ├── index.ts     # Main router
│   ├── auth.routes.ts
│   └── auctions.routes.ts
├── services/        # Business logic
│   ├── auth.service.ts
│   └── auctions.service.ts
├── repositories/    # Data access layer
│   ├── auth.repository.ts
│   └── auctions.repository.ts
├── schemas/         # Zod validation schemas
│   ├── auth.schemas.ts
│   └── auctions.schemas.ts
├── utils/           # Utility functions
│   └── result.ts    # Result/Either pattern
├── types/           # TypeScript definitions
└── main.ts          # Application entry point
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

## 🔐 Authentication

This API uses JWT authentication with Supabase Auth:

1. User authenticates with Supabase (client-side)
2. Client receives JWT token
3. Client sends token in Authorization header: `Bearer <token>`
4. Server validates token and extracts user info

Example:
```bash
curl -X POST http://localhost:3000/api/v1/auth/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "full_name": "John Doe"
  }'
```

## 🛡️ Error Handling

This application uses the **Result/Either pattern** for type-safe error handling:

```typescript
// Services return Result<T, AppError>
const result = await authService.syncProfile(userId, data);

if (result.isErr()) {
  throw result.error;  // Express middleware catches this
}

// Success - value is typed correctly
const profile = result.value;
```

Error responses:
```json
{
  "success": false,
  "statusCode": 404,
  "error": {
    "name": "NotFoundError",
    "message": "Auction with id 'xyz' not found",
    "code": "NOT_FOUND"
  },
  "timestamp": "2026-01-26T...",
  "path": "/api/v1/auctions/xyz",
  "method": "GET"
}
```

## 📊 Database Schema

### Tables
- **profiles** - User profiles with roles (USER, SELLER, ADMIN)
- **sellers** - Seller business information
- **auction_items** - Auction listings
- **live_auctions** - Live streaming auctions
- **bids** - Bid history
- **payments** - Payment records

See [src/db/schema.ts](./src/db/schema.ts) for complete schema.

## 🔧 Development

```bash
# Type check
npm run type-check

# Lint code
npm run lint

# Format code
npm run format

# Open Drizzle Studio
npm run db:studio
```

## 📦 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code
- `npm run db:push` - Push schema to database
- `npm run db:pull` - Pull schema from database
- `npm run db:studio` - Open Drizzle Studio

## 🚢 Deployment

1. Set environment variables in your hosting platform
2. Build the application: `npm run build`
3. Start the server: `npm start`

Recommended platforms:
- Railway
- Render
- DigitalOcean App Platform
- AWS/GCP/Azure

## 🔄 Migration from NestJS

This application was migrated from NestJS to Express.js. See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for details.

Key differences:
- **No decorators** - Standard Express patterns
- **Manual DI** - Explicit service instantiation
- **Result pattern** - Type-safe error handling
- **Lighter weight** - Faster startup, smaller bundle

## 📚 Additional Documentation
- [API Documentation](./API_DOCUMENTATION.md) - Extensive guide for frontend developers
- [Migration Guide](./MIGRATION_GUIDE.md) - NestJS to Express migration
- [Quick Reference](./EXPRESS_QUICK_REFERENCE.md) - Common patterns

## 🤝 Contributing
1. Create a feature branch
2. Make your changes
3. Add tests
4. Run linter and type check
5. Submit a pull request

## 📝 License
UNLICENSED - Private project

---
**Status**: Core modules (Auth, Auctions, Products, Categories, Social, Orders) implemented and verified.
Built with ❤️ using Express.js and Drizzle ORM
