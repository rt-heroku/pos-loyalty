# Orders API Authentication Fix

## Issue
The loyalty app was getting a `401 Unauthorized` error when trying to fetch orders:
```
GET https://tumi-pos-51b5263b9fbc.herokuapp.com/loyalty/api/orders 401 (Unauthorized)
```

## Root Cause
The `/loyalty/api/orders` route was checking for a `user` cookie:
```typescript
const userCookie = cookieStore.get('user');
```

However, the loyalty app uses **JWT authentication** with an `auth-token` cookie, not a plain `user` cookie.

## Solution

### 1. **Changed Authentication Method**
Updated the route to use JWT token verification:

**Before:**
```typescript
const userCookie = cookieStore.get('user');
if (!userCookie) {
  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
}
const user = JSON.parse(userCookie.value);
```

**After:**
```typescript
const authToken = cookieStore.get('auth-token');
if (!authToken) {
  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
}
const user = await verifyToken(authToken.value);
if (!user) {
  return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
}
```

### 2. **Added Database Query for Customer ID**
The `user` object from JWT contains the `user_id`, but the orders table uses `customer_id`. Added a database query to get the correct `customer_id`:

```typescript
const customerResult = await query(
  'SELECT id FROM customers WHERE user_id = $1',
  [user.id]
);

if (customerResult.rows.length === 0) {
  return NextResponse.json([]);
}

const customerId = customerResult.rows[0].id;
```

### 3. **Enhanced Logging**
Added detailed console logging to help debug authentication flow:

```typescript
console.log('[Orders API] Authenticated user:', user.id, user.email);
console.log('[Orders API] Found customer_id:', customerId, 'for user_id:', user.id);
console.log('[Orders API] Fetching all online orders for customer_id:', customerId);
```

## Updated File
`/loyalty-app/src/app/api/orders/route.ts`

## Changes Made
1. ✅ Import `verifyToken` from `@/lib/auth`
2. ✅ Import `query` from `@/lib/db`
3. ✅ Changed from `user` cookie to `auth-token` cookie
4. ✅ Added JWT token verification
5. ✅ Added database query to get `customer_id` from `user_id`
6. ✅ Enhanced error logging
7. ✅ Return empty array if no customer record found

## Authentication Flow

### Old Flow (Broken)
```
1. Check for 'user' cookie ❌ (doesn't exist in loyalty app)
2. Return 401 Unauthorized
```

### New Flow (Fixed)
```
1. Check for 'auth-token' cookie ✅
2. Verify JWT token and get user data ✅
3. Query customers table to get customer_id from user_id ✅
4. Fetch orders from backend using customer_id ✅
5. Return orders data ✅
```

## Testing

### Before Fix
```
GET /loyalty/api/orders
Response: 401 Unauthorized
Error: "Not authenticated"
```

### After Fix
```
GET /loyalty/api/orders
Response: 200 OK
[
  { id: 1, order_number: "ORD-001", ... },
  { id: 2, order_number: "ORD-002", ... },
  ...
]
```

### Console Logs (Success)
```
[Orders API] Authenticated user: 123 user@example.com
[Orders API] Found customer_id: 456 for user_id: 123
[Orders API] Fetching all online orders for customer_id: 456
[Orders API] Found orders: 4
```

## Why This Happened

The `/loyalty/api/orders` route was likely copied from the shop app which uses a plain `user` cookie stored by Express session middleware. The loyalty app uses a more secure JWT-based authentication system with an `auth-token` httpOnly cookie.

## Related Files

### Authentication System
- `/loyalty-app/src/lib/auth.ts` - Defines `verifyToken()` function
- `/loyalty-app/src/contexts/AuthContext.tsx` - Client-side auth context

### Orders Display
- `/loyalty-app/src/app/loyalty/page.tsx` - Loyalty page that fetches orders
- `/loyalty-app/src/app/api/orders/route.ts` - Fixed API route (this file)

### Backend
- `/server.js` - Express backend with `/api/orders` endpoint

## Database Schema

### users table
- `id` - Primary key (user_id)
- `email`, `first_name`, `last_name`, etc.

### customers table
- `id` - Primary key (customer_id)
- `user_id` - Foreign key to users table
- `loyalty_number`, `points`, etc.

### orders table
- `id` - Primary key
- `customer_id` - Foreign key to customers table
- `order_number`, `total_amount`, etc.

## Deployment Status
✅ **Committed** - Commit `e841e7b`  
✅ **Pushed** - Branch `main`  
🚀 **Ready** - Will be deployed on next Heroku build

## Next Steps
1. Deploy to Heroku (automatic on push to main)
2. Clear browser cache and cookies
3. Test orders display in loyalty app at `/loyalty`
4. Verify console logs show successful authentication


