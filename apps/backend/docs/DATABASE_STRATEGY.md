# 🗄️ Database Strategy: TypeORM + Supabase

For **BarterDash**, we use **TypeORM** as our primary Object-Relational Mapper (ORM), while still leveraging the **Supabase Client** for specialized features like Authentication and Atomic RPCs.

---

## 🏗️ Architecture Overview

| Tool | Purpose |
| :--- | :--- |
| **TypeORM** | Handles 90% of database interactions (CRUD, Relations, Entity logic). |
| **Supabase Client** | Handles Authentication, Storage, and Real-time events. |
| **SQL RPCs** | Handles complex, high-concurrency atomic operations (e.g., bidding). |

---

## 🚀 Why we use TypeORM (Option 3)

We have chosen the "Entity First" approach as requested. This allows you to manage your database structure using TypeScript classes instead of raw SQL.

### ⚡ Key Features:
1.  **Synchronize**: During development, we set `synchronize: true` in `AppModule`. This means as soon as you save a new `@Entity()`, TypeORM will automatically create the table in Supabase.
2.  **Relations**: We use TypeORM decorators like `@ManyToOne` and `@OneToOne` to handle complex links between Users, Sellers, and Auctions.
3.  **Type Safety**: Every result from a repository is automatically typed to your Entity class.

---

## 🛠️ How to Handle Database Changes

Since `synchronize: true` is active for development, follow these steps to add a new table:

1.  **Create an Entity**: Create a file like `src/modules/example/entities/example.entity.ts`.
2.  **Decorate**: Use `@Entity()`, `@PrimaryGeneratedColumn()`, and `@Column()`.
3.  **Register**: Add the entity to the `imports: [TypeOrmModule.forFeature([ExampleEntity])]` array in its module.
4.  **Save**: The table is automatically created in your Supabase project!

> [!WARNING]
> **Production Safety**: In a real production environment, we would disable `synchronize: true` and use TypeORM Migrations to ensure data is never accidentally deleted.

---

## 🤝 The Hybrid Approach (Bidding)

Standard CRUD (getting user profiles, listing auctions) uses TypeORM. However, **Bidding** is different.

Because bidding requires extreme speed and "Row Locking" to prevent two people from winning at the same price, we still use a **Supabase RPC (Remote Procedure Call)**.
*   **Repo**: `BidsRepository` injects both `@InjectRepository(Bid)` AND `SupabaseService`.
*   **Logic**: High-speed logic happens in the DB (SQL), while history and lookups happen in TypeORM.

---

## 💡 How to navigate Entities

Check the existing entities to see examples:
*   👤 [profile.entity.ts](file:///home/aimal-shah/code/BarterDash/barterdash-backend/src/modules/users/entities/profile.entity.ts)
*   🏪 [seller.entity.ts](file:///home/aimal-shah/code/BarterDash/barterdash-backend/src/modules/sellers/entities/seller.entity.ts)
*   🔨 [auction.entity.ts](file:///home/aimal-shah/code/BarterDash/barterdash-backend/src/modules/auctions/entities/auction.entity.ts)
