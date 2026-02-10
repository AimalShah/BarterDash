# 🛠️ BarterDash Technical Handbook (Master Edition)

Welcome to the BarterDash Backend! This handbook is designed for developers who are new to **NestJS** and **Supabase**. It explains exactly where everything is, how it works, and how to stay productive.

---

## 🧭 1. The Beginner's Map
If you are new to NestJS, think of the codebase as a city organized by **Modules**. Each module is a self-contained "department" (Auth, Auctions, Bids, etc.).

### 📂 Folder Structure
| Folder | Purpose | Key Files |
|---|---|---|
| `src/modules/*/` | The core department logic | `*.controller.ts`, `*.service.ts` |
| `src/modules/*/schemas/` | **[SCHEMA HOUSE]** Where request validation is defined | `*.schema.ts` (Zod) |
| `src/modules/*/dto/` | **[DATA TRANSFER]** Classes for Swagger documentation | `*.dto.ts` |
| `src/modules/*/entities/` | **[DB LOOKALIKES]** TypeScript classes representing DB rows | `*.entity.ts` |
| `src/common/` | Shared tools (guards, decorators, pipes) | `zod-validation.pipe.ts` |
| `supabase/migrations/` | **[TABLE HOUSE]** Where your actual SQL tables live | `*.sql` |

---

## 🗄️ 2. The Database Deep Dive (TypeORM Way)
We use a **Hybrid Approach**. We use **TypeORM** for managing our tables and relations, but we still use the **Supabase Client** for Authentication and high-speed bidding.

### A. The "Real" Tables (TypeORM Entities)
**Location:** `src/modules/*/entities/*.entity.ts`

Instead of writing raw SQL, we use TypeScript classes called **Entities**.
*   **How to create a table**: Create a new file in the `entities/` folder with the `@Entity()` decorator.
*   **How to apply changes**: We have enabled `synchronize: true` in `app.module.ts`. This means as soon as you save your code, the table is automatically built in the cloud!

### B. The Gatekeepers (Zod Schemas)
**Location:** `src/modules/*/schemas/*.schema.ts`

These are still our primary validation layer. They check the user's data *before* TypeORM tries to save it to the database.

### C. The Atomic Core (Supabase RPC)
**Location:** `supabase/migrations/`

For extremely complex logic like "Atomic Bidding," we still use standard SQL functions. These are called via `this.supabase.getClient().rpc()`.

---

## 🔄 3. How a Request Flows (The Life of a Bid)
Let's trace what happens when someone calls `POST /bids`:

1.  **`bids.controller.ts`**: The request arrives.
2.  **`ZodValidationPipe`**: Validates the data against `bids.schema.ts`.
3.  **`bids.service.ts`**: Handles business logic.
4.  **`bids.repository.ts`**: Uses **TypeORM** to find the auction, and the **Supabase Client** to call the atomic bid function.
5.  **`PostgreSQL`**: The data is saved securely in the cloud.

---

## 🛠️ 4. Essential Commands for Beginners

| Command | What it does |
|---|---|
| `npm run start:dev` | Starts the server and auto-updates your database tables. |
| `npm install <package>` | Installs new tools for the project. |

---

## 🎓 5. Understanding NestJS Decorators
You'll see a lot of `@` symbols. Here's what they mean:
*   `@Controller('path')`: Tells Nest this file handles URLs entry points.
*   `@InjectRepository(Entity)`: Plugs a database table directly into your repository.
*   `@Entity()`: Marks a class as a database table.
*   `@Column()`: Creates a column in your table.
*   `@CreateDateColumn()`: Automatically fills in the "created_at" time.

---

## 💡 Pro-Tips for Navigation
1.  **The Entry Point**: Everything starts in [`src/main.ts`](file:///home/aimal-shah/code/BarterDash/barterdash-backend/src/main.ts).
2.  **The Root Module**: All modules are tied together in [`src/app.module.ts`](file:///home/aimal-shah/code/BarterDash/barterdash-backend/src/app.module.ts).
3.  **The API Docs**: Go to `http://localhost:3000/api` while the server is running to see a visual map of all endpoints (Swagger).

---

> [!TIP]
> **Stuck?** Look at the [`AuthModule`](file:///home/aimal-shah/code/BarterDash/barterdash-backend/src/modules/auth/) first. It is the simplest example of how a module, controller, and repository work together.
