# CORS Error Fix Guide

## Understanding the Error

You're seeing this error because:
- **Frontend**: Running on `http://localhost:8081` (Expo web)
- **Backend**: Running on `http://192.168.100.120:3000` or `http://localhost:3000`
- **Problem**: Browser blocks cross-origin requests unless backend explicitly allows them

## Error Message
```
Access to XMLHttpRequest at 'http://192.168.100.120:3000/api/v1/auctions' 
from origin 'http://localhost:8081' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present
```

## Solution: Fix Backend CORS Configuration

Your backend server needs to add CORS headers. Here's how to fix it based on your backend framework:

### Option 1: Express.js Backend

Add CORS middleware:

```javascript
const cors = require('cors');
const express = require('express');
const app = express();

// Allow all origins (development only)
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Or allow specific origins (recommended for production)
app.use(cors({
    origin: [
        'http://localhost:8081',  // Expo web dev server
        'http://localhost:19006',  // Expo web alternative port
        'exp://192.168.100.120:8081', // Expo dev client
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### Option 2: NestJS Backend

In `main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    
    app.enableCors({
        origin: [
            'http://localhost:8081',
            'http://localhost:19006',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    
    await app.listen(3000);
}
```

### Option 3: Fastify Backend

```javascript
const fastify = require('fastify')({ logger: true });

fastify.register(require('@fastify/cors'), {
    origin: ['http://localhost:8081'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### Option 4: Manual CORS Headers (Any Framework)

Add these headers to all responses:

```javascript
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:8081');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});
```

## Quick Test

After updating your backend:

1. Restart your backend server
2. Check browser console - CORS errors should be gone
3. Verify requests are working with `[API DEBUG]` logs

## Current Configuration

The app is configured to:
- **Web**: Use `http://localhost:3000/api/v1` (to match origin)
- **Mobile**: Use `http://192.168.100.120:3000/api/v1` (for physical devices)

## Troubleshooting

### Still Getting CORS Errors?

1. **Check backend is running**: `curl http://localhost:3000/api/v1/auctions`
2. **Verify CORS headers**: Check Network tab → Headers → Response Headers
3. **Check origin**: Make sure backend allows `http://localhost:8081`
4. **Restart backend**: CORS changes require server restart

### For Production

In production, configure CORS to allow only your production domain:
```javascript
origin: ['https://yourdomain.com']
```

## Alternative: Use Proxy (Development Only)

If you can't modify backend CORS, you can use Expo's proxy feature in `app.json`:

```json
{
  "expo": {
    "web": {
      "proxy": {
        "/api": {
          "target": "http://localhost:3000",
          "changeOrigin": true
        }
      }
    }
  }
}
```

Then update `constants/config.ts`:
```typescript
export const API_BASE_URL = '/api/v1'; // Relative path uses proxy
```
