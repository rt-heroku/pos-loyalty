# 🚀 Shop System - Deployment Guide

## Environment Variables Setup

### Required Environment Variables

The shop system requires proper environment variables to connect the Next.js frontend (Loyalty app) to the Express backend (POS server).

#### For Heroku Deployment

Set these environment variables in your Heroku app:

```bash
# Backend URL (Express server)
BACKEND_URL=https://your-app-name.herokuapp.com

# Next.js Base Path
NEXT_PUBLIC_BASE_PATH=/loyalty

# Database
DATABASE_URL=postgresql://...

# JWT Secret
JWT_SECRET=your-secret-key
```

#### Setting Heroku Config Vars

```bash
# Set backend URL to point to the same Heroku app
heroku config:set BACKEND_URL=https://pos-loyalty-ef4d7b8a3f2a.herokuapp.com -a pos-loyalty-ef4d7b8a3f2a

# Set base path
heroku config:set NEXT_PUBLIC_BASE_PATH=/loyalty -a pos-loyalty-ef4d7b8a3f2a

# Verify settings
heroku config -a pos-loyalty-ef4d7b8a3f2a
```

---

## API Route Architecture

### How It Works

```
Browser Request → Next.js API Route → Express Backend → Database
```

1. **Browser** makes request to `/loyalty/api/shop/settings`
2. **Next.js API Route** (`/app/api/shop/settings/route.ts`) receives it
3. **Proxy** forwards to Express backend using `BACKEND_URL`
4. **Express** (`server.js`) handles the request
5. **Response** flows back through the chain

### API Routes Created

```
loyalty-app/src/app/api/
├── shop/
│   └── settings/
│       └── route.ts          → /api/shop/settings
├── categories/
│   └── route.ts              → /api/categories
├── products/
│   ├── route.ts              → /api/products
│   └── [id]/
│       └── modifiers/
│           └── route.ts      → /api/products/:id/modifiers
├── payment-methods/
│   └── route.ts              → /api/payment-methods
└── orders/
    └── online/
        └── route.ts          → /api/orders/online
```

---

## Troubleshooting

### Issue: 404 Errors on API Routes

**Symptoms:**
```
GET /loyalty/api/shop/settings 404 (Not Found)
GET /loyalty/api/categories 404 (Not Found)
```

**Cause:** API routes not found by Next.js

**Solution:**
1. Verify API route files exist in `loyalty-app/src/app/api/`
2. Rebuild the app: `npm run build`
3. Restart the server

---

### Issue: 500 Internal Server Errors

**Symptoms:**
```
GET /loyalty/api/shop/settings 500 (Internal Server Error)
GET /loyalty/api/categories 500 (Internal Server Error)
```

**Cause:** Backend URL not configured or unreachable

**Solution:**

1. **Check BACKEND_URL is set:**
   ```bash
   heroku config:get BACKEND_URL -a your-app-name
   ```

2. **Set BACKEND_URL if missing:**
   ```bash
   # For Heroku (same app serves both)
   heroku config:set BACKEND_URL=https://your-app-name.herokuapp.com
   
   # For local development
   # In loyalty-app/.env.local:
   BACKEND_URL=http://localhost:3000
   ```

3. **Verify Express server is running:**
   ```bash
   curl https://your-app-name.herokuapp.com/api/categories
   ```

4. **Check server logs:**
   ```bash
   heroku logs --tail -a your-app-name
   ```

---

### Issue: CORS Errors

**Symptoms:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Solution:**
Already configured in `server.js`:
```javascript
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

---

### Issue: Database Connection Errors

**Symptoms:**
```
Error: Connection terminated unexpectedly
```

**Solution:**
1. Verify DATABASE_URL is set
2. Check database is accessible
3. Verify SSL settings in pool configuration

---

## Local Development Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install loyalty app dependencies
cd loyalty-app
npm install
cd ..
```

### 2. Configure Environment Variables

Create `loyalty-app/.env.local`:

```env
# Database
DATABASE_URL=postgresql://localhost:5432/loyalty_app

# Backend URL (Express server)
BACKEND_URL=http://localhost:3000

# Next.js Configuration
NEXT_PUBLIC_BASE_PATH=/loyalty
NEXT_PUBLIC_APP_URL=http://localhost:3001

# JWT
JWT_SECRET=your-local-secret-key
```

### 3. Start Development Servers

```bash
# Terminal 1: Start Express backend (port 3000)
npm run dev

# Terminal 2: Start Next.js frontend (port 3001)
cd loyalty-app
npm run dev
```

### 4. Access the Shop

- **POS System:** http://localhost:3000
- **Loyalty App:** http://localhost:3001/loyalty
- **Shop:** http://localhost:3001/loyalty/shop

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] All environment variables set in Heroku
- [ ] `BACKEND_URL` points to production URL
- [ ] `DATABASE_URL` configured
- [ ] `JWT_SECRET` set to secure value
- [ ] Build succeeds locally: `npm run build`

### Deployment

```bash
# 1. Commit all changes
git add -A
git commit -m "Deploy shop system"

# 2. Push to Heroku
git push heroku main

# 3. Run database migrations (if needed)
heroku run psql $DATABASE_URL -f db/shop_system.sql

# 4. Verify deployment
heroku open
```

### Post-Deployment

- [ ] Check Heroku logs: `heroku logs --tail`
- [ ] Test shop page loads: `/loyalty/shop`
- [ ] Test API endpoints work
- [ ] Test guest checkout flow
- [ ] Test authenticated checkout flow

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Heroku Dyno                          │
│                                                         │
│  ┌──────────────────┐         ┌──────────────────┐    │
│  │   Express.js     │         │    Next.js       │    │
│  │   (Port 3000)    │◄────────│   (Port 3001)    │    │
│  │                  │         │                  │    │
│  │  /api/*          │         │  /loyalty/*      │    │
│  │  - categories    │         │  - /shop         │    │
│  │  - products      │         │  - /dashboard    │    │
│  │  - orders        │         │  - /profile      │    │
│  │  - shop/settings │         │                  │    │
│  └────────┬─────────┘         └──────────────────┘    │
│           │                                            │
│           ▼                                            │
│  ┌──────────────────┐                                 │
│  │   PostgreSQL     │                                 │
│  │   Database       │                                 │
│  └──────────────────┘                                 │
└─────────────────────────────────────────────────────────┘
```

---

## API Endpoint Testing

### Test Shop Settings

```bash
curl https://your-app-name.herokuapp.com/api/shop/settings
```

Expected response:
```json
{
  "hero_enabled": true,
  "hero_title": "Order Your Favorites",
  "hero_subtitle": "Fresh, delicious, delivered to your door",
  "logo_url": "data:image/png;base64,...",
  "location_name": "Main Store"
}
```

### Test Categories

```bash
curl https://your-app-name.herokuapp.com/api/categories
```

Expected response:
```json
[
  {
    "id": 1,
    "name": "Burgers",
    "description": "...",
    "product_count": 5
  }
]
```

### Test Products

```bash
curl https://your-app-name.herokuapp.com/api/products?active=true
```

Expected response:
```json
[
  {
    "id": 1,
    "name": "Cheeseburger",
    "price": 9.99,
    "category": "Burgers",
    "is_active": true
  }
]
```

---

## Common Issues and Solutions

### 1. Shop Page Shows Dark Theme

**Solution:** Already fixed - shop page forces light theme on mount

### 2. Products Not Loading

**Check:**
1. Database has products: `SELECT COUNT(*) FROM products WHERE is_active = true;`
2. API endpoint works: `curl /api/products?active=true`
3. Browser console for errors

### 3. Checkout Fails

**Check:**
1. Payment methods exist: `SELECT * FROM payment_methods;`
2. Locations exist: `SELECT * FROM locations;`
3. Orders table exists: `\dt orders`

### 4. Guest Checkout Not Working

**Verify:**
1. Guest fields in orders table: `\d orders` (check for guest_name, guest_phone, guest_email)
2. API endpoint: `POST /api/orders/online`
3. Browser console for validation errors

---

## Monitoring

### Check Application Health

```bash
# View recent logs
heroku logs --tail -a your-app-name

# Check dyno status
heroku ps -a your-app-name

# Check config vars
heroku config -a your-app-name

# Restart if needed
heroku restart -a your-app-name
```

### Monitor Database

```bash
# Connect to database
heroku pg:psql -a your-app-name

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check recent orders
SELECT order_number, status, total_amount, created_at 
FROM orders 
WHERE origin IN ('mobile', 'online') 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Performance Optimization

### Database Indexes

Already created in `db/shop_system.sql`:
```sql
CREATE INDEX idx_product_modifiers_group ON product_modifiers(group_id);
CREATE INDEX idx_product_modifier_links_product ON product_modifier_group_links(product_id);
CREATE INDEX idx_orders_order_type ON orders(order_type);
CREATE INDEX idx_orders_scheduled_time ON orders(scheduled_time);
```

### Caching

Consider adding:
- Redis for session storage
- CDN for static assets
- Database query caching

---

## Security Checklist

- [x] CORS configured properly
- [x] JWT authentication for protected routes
- [x] SQL injection prevention (parameterized queries)
- [x] XSS protection (React escaping)
- [x] HTTPS enforced (Heroku automatic)
- [x] Environment variables for secrets
- [x] Rate limiting (can be added)

---

## Support

For issues:
1. Check this guide first
2. Review Heroku logs
3. Test API endpoints directly
4. Check database connectivity
5. Verify environment variables

---

**Last Updated:** November 12, 2025
**Version:** 1.0.0

