# 📊 BarterDash Progress Report

This document outlines the current state of the backend, what has been built, and what is missing or needs polish.

---

## ✅ Completed Features
| Feature | Description | Tech Used |
|---|---|---|
| **Hybrid DB Architecture** | TypeORM for CRUD, Supabase Client for Auth/RPC. | NestJS, TypeORM, Supabase |
| **Atomic Bidding** | High-concurrency safe bidding via PostgreSQL function. | Supabase RPC (SQL) |
| **Strict Validation** | Every request body is validated by Zod at the gate. | Zod, ValidationPipe |
| **Auth System** | Email/Password register and login linked to Profiles. | Supabase Auth, TypeORM |
| **Seller System** | Users can upgrade to Sellers and see basic stats. | TypeORM, Guards |
| **Auction Lifecycle** | Auctions can be created as drafts and "Go Live". | BullMQ, TypeORM |
| **Auto-Ending** | Auctions automatically close when time runs out. | BullMQ (Redis) |
| **API Documentation** | Interactive map of all endpoints. | Swagger (OpenAPI) |

---

## 🛠️ Missing / Partially Implemented

### 1. 📂 File Storage (Critical Missing)
*   **Current State**: Auctions just take an array of strings (URLs) for images.
*   **Missing**: Integration with **Supabase Storage**. We need a service that uploads files to a bucket and returns the URL.

### 2. 🔌 Real-Time Integration
*   **Current State**: The DB updates, but we haven't verified if the Frontend is listening.
*   **Missing**: A "Real-time Gateway" or specific instructions on how the Frontend should subscribe to the `live_auctions` table.

### 3. 💳 Payments (Basic Only)
*   **Current State**: We can create a "Stripe Intent" and catch a success.
*   **Missing**: 
    *   **Payouts**: Logic to send the money to the Seller after the auction ends.
    *   **Refunds**: Handling what happens if an auction is cancelled.
    *   **Stripe Connect**: Onboarding sellers to receive money.

### 4. 🔐 Security Polish
*   **Current State**: JWT works, but roles are simple.
*   **Missing**: 
    *   **RLS Policies**: We need to write the SQL for Row Level Security to ensure Users can't read each other's private data.
    *   **Social Login**: Google/Apple sign-in configuration.

### 5. 🔍 Search & Discovery
*   **Current State**: `findAll()` is very basic.
*   **Missing**: More advanced filtering (Price range, ending soon, popular) and potentially full-text search.

---

## 🚀 The Next Steps (Priority Order)

1.  **[PROFILES]**: Add a "Supabase Trigger" to automatically create Profiles for Google Sign-in users.
2.  **[STORAGE]**: Implement an `UploadService` using Supabase Storage for auction images.
3.  **[SECURITY]**: Write the RLS policies in a new migration file.
4.  **[PAYMENTS]**: Add the "Payout" logic to the auction end processor.

---

## 📑 File Audit (Current Files)
- **`src/app.module.ts`**: ✅ Well configured with Hybrid DB & Redis.
- **`src/modules/bids/bids.repository.ts`**: ✅ Good mix of TypeORM and RPC.
- **`src/modules/auth/auth.controller.ts`**: ⚠️ Needs "Reset Password" and "Social Login" endpoints.
- **`src/modules/auctions/entities/auction.entity.ts`**: ✅ Excellent TypeORM structure.

> [!NOTE]
> We are roughly **70% finished** with the core backend infrastructure. The remaining 30% is mostly "integrations" (Stripe Payouts, Supabase Storage, and Real-time subscriptions).
