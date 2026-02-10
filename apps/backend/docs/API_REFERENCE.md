# 📖 BarterDash API Reference

The BarterDash backend exposes a RESTful API documented using the **OpenAPI 3.0** specification (formerly Swagger). This allows for interactive exploration and testing of endpoints.

---

## 🚀 Accessing the Documentation

### Local Development
When running the server locally (`npm run start:dev`), you can access the interactive Swagger UI at:

👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

This interface allows you to:
- Browse all available endpoints.
- See required parameters and request bodies (DTOs).
- View response schemas and error codes.
- **Try it out**: Execute requests directly from the browser (Authentication required for most endpoints).

### JSON Specification
If you need the raw OpenAPI JSON file (e.g., for importing into Postman), it is available at:
`http://localhost:3000/api/docs-json`

---

## 🔑 Authentication

Most endpoints require a **Bearer Token** (JWT).

1.  **Register** (`POST /api/v1/auth/register`) or **Login** (`POST /api/v1/auth/login`) to get an `access_token`.
2.  In the Swagger UI, click the **Authorize** button (top right).
3.  Enter the token value (e.g., `eyJhbGciOiJIUz...`). *Note: Swagger UI usually handles the `Bearer ` prefix automatically if configured.*
4.  Click **Authorize**. Now your "Try it out" requests will include the header:
    `Authorization: Bearer <your_token>`

---

## 🛤️ Key Workflows

### 1. User Journey
1.  **Sign Up**: `POST /auth/register` -> Returns JWT.
2.  **Get Profile**: `GET /users/me` -> Returns your profile (including role).
3.  **Update Profile**: `PUT /users/profile` -> Update your name/bio.

### 2. Selling an Item
1.  **Register as Seller**: `POST /sellers/register` -> Upgrades your role to `SELLER`.
2.  **Create Auction**: `POST /auctions` -> Create a draft auction.
3.  **Go Live**: `POST /auctions/:id/go-live` -> Starts the auction timer.

### 3. Bidding
1.  **Find Auctions**: `GET /auctions` -> List active auctions.
2.  **Place Bid**: `POST /bids` -> Place a bid (Amount must be > current price + increment).
3.  **View History**: `GET /bids/auction/:id` -> See realtime bids.

### 4. Payments (Stripe)
1.  **Create Intent**: `POST /payments/create-intent` -> Get `client_secret` for frontend.
2.  **Webhook**: Stripe calls `POST /payments/webhooks/stripe` to confirm payment.

---

## ⚠️ Common Error Codes

| Status Code | Meaning | Common Cause |
| :--- | :--- | :--- |
| **400** | Bad Request | Validation failed (e.g., invalid email, missing field). Check the response message. |
| **401** | Unauthorized | Missing or invalid JWT token. Did you log in? |
| **403** | Forbidden | You don't have permission (e.g., a "User" trying to create an Auction without being a "Seller"). |
| **404** | Not Found | Resource (Auction, User) does not exist. |
| **409** | Conflict | Duplicate entry (e.g., Username already taken). |
| **500** | Server Error | Something went wrong internally. Check server logs. |
