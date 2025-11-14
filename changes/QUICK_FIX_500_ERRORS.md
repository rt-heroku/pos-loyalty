# 🚨 Quick Fix: 500 Errors on Shop API Routes

## Problem

You're seeing these errors:
```
GET /loyalty/api/shop/settings 500 (Internal Server Error)
GET /loyalty/api/categories 500 (Internal Server Error)
GET /loyalty/api/products?active=true 500 (Internal Server Error)
GET /loyalty/api/customers/profile 404 (Not Found)
```

## Root Cause

The Next.js API routes are trying to proxy requests to the Express backend, but the `BACKEND_URL` environment variable is not set in Heroku.

## Solution

### Option 1: Use the Configuration Script (Recommended)

```bash
# Run the configuration script
./configure-heroku.sh

# When prompted, enter: pos-loyalty-ef4d7b8a3f2a
```

This will automatically set all required environment variables.

---

### Option 2: Manual Configuration

Set the environment variables manually:

```bash
# Set backend URL (replace with your app name)
heroku config:set BACKEND_URL=https://pos-loyalty-ef4d7b8a3f2a.herokuapp.com -a pos-loyalty-ef4d7b8a3f2a

# Set base path
heroku config:set NEXT_PUBLIC_BASE_PATH=/loyalty -a pos-loyalty-ef4d7b8a3f2a

# Verify settings
heroku config -a pos-loyalty-ef4d7b8a3f2a
```

---

### Option 3: Quick Test (Immediate Fix)

If you need an immediate fix without redeploying:

```bash
# Set the environment variable
heroku config:set BACKEND_URL=https://pos-loyalty-ef4d7b8a3f2a.herokuapp.com -a pos-loyalty-ef4d7b8a3f2a

# Restart the app
heroku restart -a pos-loyalty-ef4d7b8a3f2a

# Wait 30 seconds, then test
open https://pos-loyalty-ef4d7b8a3f2a.herokuapp.com/loyalty/shop
```

---

## Verify the Fix

After setting the environment variables, check:

### 1. Environment Variables Are Set

```bash
heroku config -a pos-loyalty-ef4d7b8a3f2a | grep BACKEND_URL
```

Expected output:
```
BACKEND_URL: https://pos-loyalty-ef4d7b8a3f2a.herokuapp.com
```

### 2. API Endpoints Work

Test the Express backend directly:

```bash
curl https://pos-loyalty-ef4d7b8a3f2a.herokuapp.com/api/shop/settings
```

Expected: JSON response with shop settings

### 3. Shop Page Loads

Open in browser:
```
https://pos-loyalty-ef4d7b8a3f2a.herokuapp.com/loyalty/shop
```

Expected: Shop page loads with products

---

## About the 404 Error for Customer Profile

The 404 error for `/api/customers/profile` is **expected** if:
- User is not logged in yet
- User doesn't have a customer record linked

This is **not an error** - it's normal behavior. The app will:
1. Show login/signup options for guests
2. Load profile after successful login
3. Create customer record on first purchase

---

## Still Having Issues?

### Check Heroku Logs

```bash
heroku logs --tail -a pos-loyalty-ef4d7b8a3f2a
```

Look for:
- `Error fetching shop settings`
- `ECONNREFUSED`
- `fetch failed`

### Common Issues

#### Issue: "fetch failed" or "ECONNREFUSED"

**Cause:** BACKEND_URL is not set or incorrect

**Fix:**
```bash
heroku config:set BACKEND_URL=https://pos-loyalty-ef4d7b8a3f2a.herokuapp.com -a pos-loyalty-ef4d7b8a3f2a
heroku restart -a pos-loyalty-ef4d7b8a3f2a
```

#### Issue: "Backend returned 500"

**Cause:** Express backend is having issues

**Fix:**
```bash
# Check backend logs
heroku logs --tail -a pos-loyalty-ef4d7b8a3f2a | grep "Error"

# Test backend directly
curl https://pos-loyalty-ef4d7b8a3f2a.herokuapp.com/api/categories
```

#### Issue: "Failed to fetch shop settings"

**Cause:** Database connection or missing data

**Fix:**
```bash
# Check if shop settings exist
heroku pg:psql -a pos-loyalty-ef4d7b8a3f2a
> SELECT * FROM system_settings WHERE key LIKE 'shop_%';
> \q

# If no settings, run the SQL script
heroku run psql $DATABASE_URL -f db/shop_system.sql -a pos-loyalty-ef4d7b8a3f2a
```

---

## Architecture Reminder

```
Browser Request
    ↓
Next.js API Route (/loyalty/api/shop/settings)
    ↓
Uses BACKEND_URL to proxy to Express
    ↓
Express Backend (/api/shop/settings)
    ↓
Database Query
    ↓
Response back through chain
```

**Key Point:** `BACKEND_URL` must point to the same Heroku app URL where Express is running.

---

## Complete Fix Checklist

- [ ] Set `BACKEND_URL` environment variable
- [ ] Set `NEXT_PUBLIC_BASE_PATH` environment variable
- [ ] Restart Heroku app
- [ ] Wait 30 seconds for restart
- [ ] Test shop page loads
- [ ] Test API endpoints return data
- [ ] Verify no 500 errors in console
- [ ] Check Heroku logs for errors

---

## Need More Help?

1. **Check the full guide:** `SHOP_DEPLOYMENT_GUIDE.md`
2. **Run the config script:** `./configure-heroku.sh`
3. **View Heroku logs:** `heroku logs --tail -a pos-loyalty-ef4d7b8a3f2a`
4. **Test backend directly:** `curl https://pos-loyalty-ef4d7b8a3f2a.herokuapp.com/api/categories`

---

**Last Updated:** November 12, 2025

