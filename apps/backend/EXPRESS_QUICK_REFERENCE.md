# Express Migration Quick Reference

## 🚀 Getting Started

```bash
# Install dependencies
./setup-express.sh

# Start dev server
npx tsx watch express-src/main.ts

# Test health check
curl http://localhost:3000/api/v1/health
```

## 📁 File Structure Pattern

For each new module, create:
```
express-src/
├── schemas/[module].schemas.ts      # Zod validation
├── repositories/[module].repository.ts  # Data access
├── services/[module].service.ts     # Business logic
└── routes/[module].routes.ts        # API routes
```

## 🔧 Common Code Patterns

### 1. Create a Zod Schema

```typescript
// schemas/users.schemas.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    username: z.string().min(3).max(30),
    password: z.string().min(8),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
```

### 2. Create a Repository

```typescript
// repositories/users.repository.ts
import { eq } from 'drizzle-orm';
import { db, users, NewUser, User } from '../db';
import { AppResult, success, failure, NotFoundError } from '../utils/result';

export class UsersRepository {
  async findById(id: string): Promise<AppResult<User | null>> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
      });
      return success(user || null);
    } catch (error) {
      return failure(new NotFoundError('User'));
    }
  }

  async create(data: NewUser): Promise<AppResult<User>> {
    try {
      const [user] = await db.insert(users).values(data).returning();
      return success(user);
    } catch (error) {
      return failure(new ValidationError('Failed to create user'));
    }
  }
}
```

### 3. Create a Service

```typescript
// services/users.service.ts
import { UsersRepository } from '../repositories/users.repository';
import { AppResult, success, failure, NotFoundError } from '../utils/result';
import { User } from '../db/schema';

export class UsersService {
  private repository: UsersRepository;

  constructor() {
    this.repository = new UsersRepository();
  }

  async getUser(id: string): Promise<AppResult<User>> {
    const result = await this.repository.findById(id);
    
    if (result.isErr()) {
      return result;
    }

    if (!result.value) {
      return failure(new NotFoundError('User', id));
    }

    return success(result.value);
  }
}
```

### 4. Create Routes

```typescript
// routes/users.routes.ts
import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';
import { createUserSchema } from '../schemas/users.schemas';
import { UsersService } from '../services/users.service';

const router = Router();
const usersService = new UsersService();

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await usersService.getUser(req.params.id);

    if (result.isErr()) {
      throw result.error;
    }

    res.json({
      success: true,
      data: result.value,
    });
  })
);

export default router;
```

### 5. Register Routes

```typescript
// routes/index.ts
import usersRoutes from './users.routes';

router.use('/users', usersRoutes);
```

## 🗄️ Drizzle Query Patterns

### Simple Find
```typescript
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
});
```

### Find with Relations
```typescript
const auction = await db.query.auctionItems.findFirst({
  where: eq(auctionItems.id, id),
  with: {
    seller: {
      with: {
        profile: true,
      },
    },
  },
});
```

### Find Many with Filters
```typescript
const auctions = await db.query.auctionItems.findMany({
  where: and(
    eq(auctionItems.status, 'live'),
    eq(auctionItems.category, category)
  ),
  orderBy: desc(auctionItems.createdAt),
  limit: 10,
});
```

### Insert
```typescript
const [newUser] = await db
  .insert(users)
  .values({ name, email })
  .returning();
```

### Update
```typescript
const [updated] = await db
  .update(users)
  .set({ name: 'New Name' })
  .where(eq(users.id, id))
  .returning();
```

### Delete
```typescript
await db
  .delete(users)
  .where(eq(users.id, id));
```

## 🛡️ Middleware Usage

### Authentication
```typescript
router.get('/protected', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.id; // TypeScript knows user exists
  // ...
}));
```

### Role-Based Authorization
```typescript
router.post('/admin', 
  authenticate,
  requireRoles('ADMIN'),
  asyncHandler(async (req, res) => {
    // Only admins can access
  })
);
```

### Validation
```typescript
router.post('/',
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    // req.body is validated and typed
  })
);
```

## ⚠️ Error Handling

### Throw Errors in Routes
```typescript
router.get('/:id', asyncHandler(async (req, res) => {
  const result = await service.getData(req.params.id);
  
  if (result.isErr()) {
    throw result.error; // Caught by error middleware
  }
  
  res.json({ success: true, data: result.value });
}));
```

### Return Results in Services
```typescript
async getData(id: string): Promise<AppResult<Data>> {
  const result = await repository.find(id);
  
  if (result.isErr()) {
    return result; // Propagate error
  }
  
  if (!result.value) {
    return failure(new NotFoundError('Data', id));
  }
  
  return success(result.value);
}
```

## 🧪 Testing Patterns

### Service Test
```typescript
describe('UsersService', () => {
  it('should get user by id', async () => {
    const service = new UsersService();
    const result = await service.getUser('test-id');
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveProperty('id');
    }
  });
});
```

### API Test
```typescript
import request from 'supertest';
import app from '../main';

describe('GET /api/v1/users/:id', () => {
  it('should return user', async () => {
    const response = await request(app)
      .get('/api/v1/users/test-id')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## 📊 Response Format

### Success Response
```typescript
res.status(200).json({
  success: true,
  data: result,
  meta: { // Optional
    count: items.length,
    page: 1,
    total: 100,
  }
});
```

### Error Response (Automatic)
```json
{
  "success": false,
  "statusCode": 404,
  "error": {
    "name": "NotFoundError",
    "message": "User with id 'xyz' not found",
    "code": "NOT_FOUND"
  },
  "timestamp": "2026-01-26T...",
  "path": "/api/v1/users/xyz",
  "method": "GET"
}
```

## 🔐 Environment Variables

Required in `.env`:
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key-min-32-chars
STRIPE_SECRET_KEY=sk_test_...
STRIPE_IDENTITY_WEBHOOK_SECRET=whsec_...
REDIS_URL=redis://...
```

## 📦 Useful Commands

```bash
# Database
npx drizzle-kit introspect  # Pull schema from DB
npx drizzle-kit push        # Push schema to DB
npx drizzle-kit studio      # Open DB admin UI
npx drizzle-kit generate    # Generate migrations

# Development
npx tsx watch express-src/main.ts  # Hot reload
npx tsx express-src/main.ts        # No hot reload

# Type checking
tsc --noEmit -p tsconfig.express.json

# Testing
npm test
```

## 🎯 Checklist for New Module

- [ ] Create Zod schemas in `schemas/[module].schemas.ts`
- [ ] Create repository in `repositories/[module].repository.ts`
- [ ] Create service in `services/[module].service.ts`
- [ ] Create routes in `routes/[module].routes.ts`
- [ ] Register routes in `routes/index.ts`
- [ ] Add tests
- [ ] Update README-EXPRESS.md

## 🔗 Quick Links

- [Main App](file:///home/aimal-shah/code/BarterDash/barterdash-backend/express-src/main.ts)
- [DB Schema](file:///home/aimal-shah/code/BarterDash/barterdash-backend/express-src/db/schema.ts)
- [Result Utils](file:///home/aimal-shah/code/BarterDash/barterdash-backend/express-src/utils/result.ts)
- [Auth Routes](file:///home/aimal-shah/code/BarterDash/barterdash-backend/express-src/routes/auth.routes.ts)
- [Auctions Routes](file:///home/aimal-shah/code/BarterDash/barterdash-backend/express-src/routes/auctions.routes.ts)
- [Migration Guide](file:///home/aimal-shah/code/BarterDash/barterdash-backend/MIGRATION_GUIDE.md)
- [Full README](file:///home/aimal-shah/code/BarterDash/barterdash-backend/README-EXPRESS.md)
