# BarterDash API Documentation 🚀

This document provides a comprehensive guide to the BarterDash API for frontend developers.

## 📍 Connection Details
- **Base URL**: `http://192.168.100.120:3000/api/v1`
- **Your Local IP**: `192.168.100.120` (Use this for testing on mobile devices on the same network).
- **Format**: All requests and responses are in `application/json`.

## 🔐 Authentication
Most endpoints require a JWT token.
- **Header**: `Authorization: Bearer <your_jwt_token>`
- **Supabase Integration**: The backend syncs with Supabase Auth. Use the token provided by the Supabase client.

---

## 📂 1. Auth & Profiles

### `GET /auth/me`
Get the current logged-in user's profile.
- **Auth**: Required
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "aimalshah",
    "fullName": "Aimal Shah",
    "avatarUrl": "url",
    "isSeller": true
  }
}
```

### `POST /auth/sync`
Sync user profile after Supabase signup/login.
- **Auth**: Required
- **Body**:
```json
{
  "username": "newuser",
  "fullName": "New User"
}
```

---

## 🏷️ 2. Categories & Products

### `GET /categories`
List all categories with their subcategories.
- **Auth**: Public
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Pokemon Cards",
      "slug": "pokemon-cards",
      "iconUrl": "url",
      "subcategories": []
    }
  ]
}
```

### `GET /products/:id`
Get detailed product info.
- **Auth**: Public

### `POST /products`
Create a new product.
- **Auth**: Required (Seller only)
- **Body**:
```json
{
  "title": "PSA 10 Charizard",
  "description": "Mint condition",
  "category_id": "uuid",
  "condition": "new",
  "starting_bid": "500.00",
  "buy_now_price": "2500.00",
  "images": ["url1", "url2"]
}
```

---

## 🔨 3. Auctions & Bids



### `POST /bids`
Place a bid on a live auction.
- **Auth**: Required
- **Body**:
```json
{
  "auctionId": "uuid",
  "amount": "600.00"
}
```

### `GET /bids/auction/:id`
Get bid history for a specific auction.
- **Auth**: Public

---

## 🎥 4. Live Streams

### `POST /stream/create`
Schedule a new stream.
- **Auth**: Required (Seller only)
- **Body**:
```json
{
  "title": "Vintage Pack Opening",
  "description": "Join us live!",
  "category_id": "uuid",
  "schedule_start": "2026-02-01T15:00:00Z",
  "thumbnail_url": "url"
}
```

## 🛍️ 5. Orders & Payments

### `GET /orders/my-orders`
List your purchases.
- **Auth**: Required

### `POST /payments/create-intent`
Create a Stripe Payment Intent.
- **Auth**: Required
- **Body**:
```json
{
  "productId": "uuid",
  "amount": 250000 
}
```

---

## 🤝 6. Social

### `POST /social/follow/:userId`
Follow a user or seller.
- **Auth**: Required

### `GET /social/followers/:userId`
List followers of a user.
- **Auth**: Public

---

## 🧪 Testing with Mock Data
Use the following credentials for testing:
- **Email**: `aimalshah62@gmail.com`
- **Password**: `Pass@123`
- **User ID**: `b3ea664f-f358-4e7a-a860-fa5801e1b76e`
