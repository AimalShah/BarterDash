# NestJS to Express Migration Guide

## Quick Start

### 1. Install Express Dependencies

```bash
cd /home/aimal-shah/code/BarterDash/barterdash-backend

# Install required packages
npm install express drizzle-orm postgres zod jsonwebtoken bcrypt cors helmet morgan express-rate-limit neverthrow dotenv

# Install dev dependencies
npm install -D drizzle-kit tsx @types/express @types/cors @types/morgan @types/jsonwebtoken @types/bcrypt @types/node
```

### 2. Set Up Drizzle

```bash
# Pull existing database schema
npx drizzle-kit introspect

# Or push Drizzle schema to database
npx drizzle-kit push
```

### 3. Run the Express App

```bash
# Development mode (hot reload)
npx tsx watch express-src/main.ts

# Or using the script
npm run dev
```

## Testing the Migration

### Step 1: Test Health Check

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2026-01-26T..."
}
```

### Step 2: Test Auth Sync (requires JWT)

First, get a JWT from your Supabase auth flow, then:

```bash
curl -X POST http://localhost:3000/api/v1/auth/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "full_name": "Test User"
  }'
```

### Step 3: Test Auction Creation (requires SELLER role)

```bash
curl -X POST http://localhost:3000/api/v1/auctions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Vintage Watch",
    "description": "Beautiful vintage watch",
    "starting_price": 100,
    "buyout_price": 500,
    "category": "Accessories"
  }'
```

### Step 4: Test Get All Auctions

```bash
curl http://localhost:3000/api/v1/auctions
```

## Migration Checklist

### ✅ Phase 1: Infrastructure (COMPLETE)
- [x] Express app setup
- [x] Drizzle schema definitions
- [x] Database connection
- [x] Configuration management
- [x] Result/Either pattern utilities
- [x] Error handling middleware
- [x] Authentication middleware
- [x] Authorization middleware
- [x] Validation middleware
- [x] Logging middleware

### ✅ Phase 2: Auth Module (COMPLETE)
- [x] Auth schemas (Zod)
- [x] Auth repository
- [x] Auth service
- [x] Auth routes
- [x] JWT authentication
- [x] Profile sync endpoint

### ✅ Phase 3: Auctions Module (COMPLETE)
- [x] Auctions schemas
- [x] Auctions repository
- [x] Auctions service
- [x] Auctions routes
- [x] Create auction
- [x] List auctions
- [x] Get auction by ID
- [x] Go live functionality

### 🚧 Phase 4: Remaining Modules (TODO)
- [ ] Users module
  - [ ] Schemas
  - [ ] Repository
  - [ ] Service
  - [ ] Routes
- [ ] Bids module
  - [ ] Schemas
  - [ ] Repository
  - [ ] Service
  - [ ] Routes
- [ ] Payments module
  - [ ] Schemas
  - [ ] Repository
  - [ ] Service (Stripe integration)
  - [ ] Routes
  - [ ] Webhook handler
- [ ] Sellers module
  - [ ] Schemas
  - [ ] Repository
  - [ ] Service
  - [ ] Routes

### 🚧 Phase 5: Jobs & Background Tasks (TODO)
- [ ] Port BullMQ configuration
- [ ] Port auction processor
- [ ] Set up Redis connection
- [ ] Test job processing

### 🚧 Phase 6: Additional Features (TODO)
- [ ] Swagger/OpenAPI documentation
- [ ] API versioning
- [ ] Request/Response interceptors
- [ ] File upload handling
- [ ] WebSocket support (if needed)

### 🚧 Phase 7: Testing (TODO)
- [ ] Unit tests for services
- [ ] Integration tests for API endpoints
- [ ] E2E tests
- [ ] Load testing
- [ ] Security testing

### 🚧 Phase 8: Deployment (TODO)
- [ ] Disable TypeORM in NestJS app
- [ ] Update deployment scripts
- [ ] Database migration strategy
- [ ] Rollback plan
- [ ] Monitoring setup

## Common Patterns

### Converting a NestJS Controller to Express Router

**Before (NestJS):**
```typescript
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  async findAll(@Query() query: QueryDto) {
    return this.usersService.findAll(query);
  }
}
```

**After (Express):**
```typescript
const router = Router();
const usersService = new UsersService();

router.get(
  '/',
  authenticate,
  validate(querySchema),
  asyncHandler(async (req, res) => {
    const result = await usersService.findAll(req.query);
    
    if (result.isErr()) {
      throw result.error;
    }
    
    res.json({
      success: true,
      data: result.value,
    });
  })
);
```

### Converting a TypeORM Entity to Drizzle Schema

**Before (TypeORM):**
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @CreateDateColumn()
  created_at: Date;
}
```

**After (Drizzle):**
```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Converting a TypeORM Repository Query

**Before (TypeORM):**
```typescript
const user = await this.userRepository.findOne({
  where: { id },
  relations: ['profile', 'orders'],
});
```

**After (Drizzle):**
```typescript
const user = await db.query.users.findFirst({
  where: eq(users.id, id),
  with: {
    profile: true,
    orders: true,
  },
});
```

## Troubleshooting

### Error: "Cannot find module"
Make sure all dependencies are installed:
```bash
npm install
```

### Error: "Database connection failed"
Check your `.env` file DATABASE_URL is correct and accessible.

### Error: "Invalid token"
Ensure you're using a valid JWT from Supabase auth. Test with:
```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### TypeScript errors
Run type checking:
```bash
npm run type-check
```

## Performance Comparison

After migration, measure:
- Response times
- Memory usage
- Database query performance
- Startup time
- Bundle size

Expected improvements:
- ✅ Faster startup time (no NestJS overhead)
- ✅ Smaller bundle size
- ✅ Better type inference with Drizzle
- ✅ More explicit error handling

## Next Steps

1. **Complete remaining modules** - Follow the same pattern used for Auth and Auctions
2. **Add comprehensive tests** - Unit and integration tests
3. **Port BullMQ jobs** - Background task processing
4. **Add Swagger docs** - API documentation
5. **Load test** - Ensure performance meets requirements
6. **Deploy** - Switch from NestJS to Express

## Resources

- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Neverthrow Documentation](https://github.com/supermacro/neverthrow)
- [Zod Documentation](https://zod.dev)

---

**Note:** The NestJS app can continue running on a different port during development/testing. Once the Express app is fully tested and ready, you can switch over completely.
