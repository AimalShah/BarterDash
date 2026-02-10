# BarterDash API Reference

base URL: `/api/v1`

## Authentication
Authentication is handled primarily on the client-side via Supabase. The backend validates the Supabase JWT.
**Header:** `Authorization: Bearer <SUPABASE_ACCESS_TOKEN>`

### 1. Auth Headers
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/sync` | Sync Supabase user with Backend Profile. Call this after Sign Up. | Yes |

**Request Body (`/auth/sync`):**
```json
{
  "username": "johndoe",
  "full_name": "John Doe",
  "avatar_url": "https://..."
}
```

---

## Users
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/me` | Get current user's private profile | Yes |
| `GET` | `/users/:id` | Get public profile of a user | No |
| `PUT` | `/users/profile` | Update user profile | Yes |

**Request Body (`PUT /users/profile`):**
```json
{
  "full_name": "New Name",
  "bio": "I love auctions",
  "avatar_url": "..."
}
```

---

## Sellers
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/sellers/register` | Register current user as a Seller | Yes |
| `GET` | `/sellers/dashboard` | Get seller analytics and dashboard stats | Yes (Seller/Admin) |

**Request Body (`POST /sellers/register`):**
```json
{
  "business_name": "John's Shop",
  "business_address": "123 Market St"
}
```

---

## Auctions
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/auctions` | List all auctions (supports query params) | No |
| `GET` | `/auctions/:id` | Get detailed auction info | No |
| `POST` | `/auctions` | Create a new auction | Yes (Seller) |
| `POST` | `/auctions/:id/go-live` | Start an auction (change status to LIVE) | Yes (Seller) |

**Request Body (`POST /auctions`):**
```json
{
  "title": "Vintage Camera",
  "description": "Mint condition...",
  "starting_bid": 100,
  "images": ["url1", "url2"]
}
```
**Request Body (`POST /auctions/:id/go-live`):**
```json
{
  "duration_minutes": 60
}
```

---

## Bids
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/bids` | Place a bid on a live auction | Yes |
| `GET` | `/bids/auction/:id` | Get bid history for a specific auction | No |
| `GET` | `/bids/my-bids` | Get current user's bid history | Yes |

**Request Body (`POST /bids`):**
```json
{
  "auction_id": "uuid-string",
  "amount": 150.00
}
```

---

## Payments
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/payments/create-intent` | Create a Stripe Payment Intent | Yes |
| `POST` | `/payments/webhooks/stripe`| Handle Stripe Webhooks | No (Signature Verified) |

**Request Body (`POST /payments/create-intent`):**
```json
{
  "auction_id": "uuid-string",
  "amount": 150.00 // Should match winning bid, validated on backend
}
```
