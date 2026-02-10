# BarterDash Backend - Express + Drizzle ORM

## Migration Status

This is the Express.js version of the BarterDash backend, migrated from NestJS with TypeORM to Express with Drizzle ORM.

### ✅ Completed Features

- **Core Infrastructure**
  - Express app setup with security middleware (helmet, cors, rate limiting)
  - Centralized configuration with Zod validation
  - Drizzle ORM schema for all entities (Profiles, Sellers, Auctions, Bids, Payments)
  - Database connection with connection pooling

- **Error Handling**
  - Result/Either pattern using `neverthrow`
  - Custom error classes (NotFoundError, UnauthorizedError, etc.)
  - Global error handler middleware
  - Async error wrapper

- **Authentication & Authorization**
  - JWT authentication middleware
  - Role-based authorization middleware
  - Protected route examples

- **Validation**
  - Zod validation middleware
  - Validation schemas for Auth and Auctions

- **Modules Migrated**
  - ✅ Auth (sync profile, logout, get profile)
  - ✅ Auctions (create, list, get by ID, go live)
  - 🚧 Users (TODO)
  - 🚧 Bids (TODO)
  - 🚧 Payments (TODO)
  - 🚧 Sellers (TODO)

### 📦 Installation

```bash
# Install dependencies (use the existing package.json or merge with package.express.json)
npm install express drizzle-orm postgres zod jsonwebtoken bcrypt cors helmet morgan express-rate-limit neverthrow

# Install dev dependencies
npm install -D drizzle-kit tsx @types/express @types/cors @types/morgan @types/jsonwebtoken @types/bcrypt
```

### 🗄️ Database Setup

```bash
# Pull existing schema from database
npm run db:pull

# Or push Drizzle schema to database
npm run db:push

# Open Drizzle Studio to view database
npm run db:studio
```

### 🚀 Running the Application

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The server will run on `http://localhost:3000` by default.

### 📍 API Endpoints

#### Auth
- `POST /api/v1/auth/sync` - Sync user profile (Protected)
- `POST /api/v1/auth/logout` - Logout (Protected)
- `GET /api/v1/auth/me` - Get current user (Protected)

#### Auctions
- `POST /api/v1/auctions` - Create auction (Protected, SELLER only)
- `GET /api/v1/auctions` - List all auctions (Public)
- `GET /api/v1/auctions/:id` - Get auction details (Public)
- `POST /api/v1/auctions/:id/go-live` - Start live auction (Protected, SELLER only)

#### Health Check
- `GET /api/v1/health` - API health status

### 🏗️ Project Structure

```
express-src/
├── config/           # Configuration with Zod validation
├── db/               # Drizzle schema and connection
├── middleware/       # Express middleware (auth, validation, errors, logging)
├── routes/           # Express  routers
├── services/         # Business logic layer
├── repositories/     # Database access layer
├── schemas/          # Zod validation schemas
├── utils/            # Utility functions (Result pattern, etc.)
├── types/            # TypeScript type definitions
├── jobs/             # BullMQ job processors
└── main.ts           # Express app entry point
```

### 🔄 Result Pattern (Error Handling)

This application uses the `neverthrow` library for type-safe error handling:

```typescript
// Services return Result<T, AppError>
const result = await authService.syncProfile(userId, data);

if (result.isErr()) {
  // Handle error
  throw result.error;
}

// Success - value is typed correctly
const profile = result.value;
```

### 🔐 Environment Variables

Required environment variables (same as NestJS version):

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
REDIS_URL=redis://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
```

### 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### 📝 Next Steps

1. **Complete remaining modules:**
   - Users module (CRUD operations)
   - Bids module (bid placement, history)
   - Payments module (Stripe integration)
   - Sellers module (seller management)

2. **Add BullMQ integration:**
   - Port auction processor job
   - Set up Redis connection

3. **Add Swagger documentation:**
   - Install swagger-ui-express
   - Generate OpenAPI spec

4. **Add comprehensive tests:**
   - Unit tests for services
   - Integration tests for API endpoints

5. **Migration from NestJS:**
   - Test all endpoints thoroughly
   - Run load tests
   - Switch over when ready

### 🔀 Key Differences from NestJS

| Feature | NestJS | Express (This App) |
|---------|--------|-------------------|
| **Dependency Injection** | Automatic via decorators | Manual instantiation |
| **Routing** | `@Controller()`, `@Get()` decorators | Express router methods |
| **Validation** | class-validator + class-transformer | Zod schemas |
| **Error Handling** | Exception filters | Result/Either pattern + error middleware |
| **ORM** | TypeORM with decorators | Drizzle with schema builders |
| **Guards** | `@UseGuards()` decorator | Middleware functions |
| **Type Safety** | Good | Excellent (Drizzle infers types) |

### 📚 Documentation

- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Neverthrow (Result Pattern)](https://github.com/supermacro/neverthrow)
- [Zod Validation](https://zod.dev)
- [Express.js](https://expressjs.com)

### 🐛 Known Issues

None yet! This is a new migration.

### 🤝 Contributing

When adding new features:
1. Create Zod schemas in `schemas/`
2. Create repository in `repositories/`
3. Create service in `services/` using Result pattern
4. Create routes in `routes/`
5. Add tests

---

**Migration Progress:** Auth + Auctions modules complete. 4 modules remaining.
