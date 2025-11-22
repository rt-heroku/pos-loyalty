# Promotions Debug Status

## ✅ ISSUE RESOLVED!

**Root Cause Found:** The `/api/auth/me` and `/api/auth/login` endpoints were **not fetching** the `loyalty_number` field from the database!

**Fix Applied:**
- Added `c.loyalty_number` to SQL queries in both endpoints
- Added `loyaltyNumber` to the returned user objects
- Deployed in commit `5a11189`

**Next Step:** Clear browser cache and login again. The user object should now include `loyaltyNumber: 'LOY002'`.

---

## Current Data State

### User Information
```sql
User ID: 34
Email: rtorres42@gmail.com
Loyalty Number: LOY002
```

### Promotions Data
```sql
Active Promotions: 1 promotion
Customer Enrollments: 1 enrollment (customer 34 → promotion 1)
```

### Enrollment Details
```
Customer ID: 34
Promotion ID: 1
Enrolled At: 2025-11-21 21:02:32
Status: (empty - should be 'active')
Is Auto Enrolled: NULL
Is Enrollment Active: NULL
```

## What We're Testing

The loyalty app should show this promotion when:
1. User logs in with `rtorres42@gmail.com`
2. Navigates to `/loyalty`
3. Clicks "Promotions" tab

## Debug Logs to Check

With the new debugging in place, you should see in the browser console:

### 1. **User Authentication Check**
```
[Loyalty] ===== PROMOTIONS FETCH DEBUG =====
[Loyalty] User object: { id: 34, email: 'rtorres42@gmail.com', loyaltyNumber: 'LOY002', ... }
[Loyalty] User loyaltyNumber: LOY002
[Loyalty] User id: 34
[Loyalty] User email: rtorres42@gmail.com
```

**✅ Expected:** Should see LOY002, not LOY001
**❌ If missing:** User object doesn't have loyaltyNumber field

### 2. **API Call**
```
[Loyalty] Fetching promotions from URL: /loyalty/api/promotions?loyalty_number=LOY002
[Loyalty] Promotions response status: 200
[Loyalty] Promotions response headers: { ... }
```

**✅ Expected:** Status 200
**❌ Possible issues:**
- 401: Not authenticated
- 404: Customer not found
- 500: Server error

### 3. **Data Received**
```
[Loyalty] Promotions data received: { promotions: [...] }
[Loyalty] Promotions array length: 1
[Loyalty] Promotions array: [
  {
    id: 1,
    name: '...',
    is_enrolled: true,
    promotion_source: 'customer',
    ...
  }
]
[Loyalty] ✅ Promotions successfully set in state
```

**✅ Expected:** 1 promotion with `promotion_source: 'customer'`
**❌ If 0:** Backend query issue

### 4. **Render Check**
```
[Loyalty Render] Promotions tab active
[Loyalty Render] Promotions state length: 1
[Loyalty Render] Promotions state: [...]
```

**✅ Expected:** State length matches fetched data
**❌ If 0:** State update failed

## Backend API Check

The `/loyalty/api/promotions` route calls the backend which queries:

```sql
-- Customer-specific promotions
SELECT 
  p.*,
  cp.enrollment_date,
  cp.enrollment_status,
  cp.progress,
  true as is_enrolled,
  'customer' as promotion_source
FROM customer_promotions cp
INNER JOIN promotions p ON cp.promotion_id = p.id
WHERE cp.customer_id = $1 AND p.is_active = true
```

This should return promotion ID 1 for customer 34.

## Testing Steps

1. **Open Browser DevTools** (F12)
2. **Go to Console Tab**
3. **Navigate to:** `https://tumi-pos-51b5263b9fbc.herokuapp.com/loyalty`
4. **Login with:** `rtorres42@gmail.com`
5. **Click "Promotions" Tab**
6. **Look for Debug Output**

## What Each Log Tells Us

### If you see:
```
[Loyalty] ❌ No loyaltyNumber found for user
[Loyalty] User object keys: ['id', 'email', 'firstName', 'lastName', 'role']
```
**Problem:** The `loyaltyNumber` field is not being fetched from the database in the JWT token verification.
**Fix:** Check `auth.ts` verifyToken() function includes loyalty_number

### If you see:
```
[Loyalty] Promotions response status: 401
```
**Problem:** Authentication failed
**Fix:** Check auth-token cookie exists

### If you see:
```
[Loyalty] Promotions array length: 0
```
**Problem:** Backend query returned no results
**Possible causes:**
- Customer ID mapping issue (user_id → customer_id)
- Promotion is not is_active = true
- customer_promotions record issue

### If you see:
```
[Loyalty Render] Promotions state length: 0
```
**Problem:** State didn't update properly
**Check:** Earlier logs to see if fetch succeeded

## Quick Database Verification

```sql
-- Verify the promotion is active
SELECT id, name, display_name, is_active 
FROM promotions 
WHERE id = 1;

-- Should return is_active = true

-- Verify the enrollment record
SELECT * FROM customer_promotions 
WHERE customer_id = 34 AND promotion_id = 1;

-- Should return 1 row

-- Get the full promotion data as API would
SELECT 
  p.*,
  cp.enrolled_at as enrollment_date,
  cp.status as enrollment_status,
  cp.cumulative_usage_completed,
  cp.cumulative_usage_target,
  cp.cumulative_usage_complete_percent,
  true as is_enrolled,
  'customer' as promotion_source
FROM customer_promotions cp
INNER JOIN promotions p ON cp.promotion_id = p.id
WHERE cp.customer_id = 34 AND p.is_active = true;
```

## Next Steps

**After checking console logs**, report back with:

1. **What you see for "User loyaltyNumber"**
   - Is it LOY002?
   - Is it undefined?

2. **What you see for "Promotions response status"**
   - 200, 401, 404, 500?

3. **What you see for "Promotions array length"**
   - 0, 1, or more?

4. **What you see for "Promotions state length" (when rendering)**
   - Does it match the array length?

5. **Copy the full debug block** starting from:
   ```
   [Loyalty] ===== PROMOTIONS FETCH DEBUG =====
   ```
   to
   ```
   [Loyalty] ===== END PROMOTIONS FETCH DEBUG =====
   ```

This will tell us exactly where the issue is! 🎯

## Files with Debug Logging

- **Loyalty App Frontend:** `/loyalty-app/src/app/loyalty/page.tsx` (lines 186-222)
- **Loyalty App API Route:** `/loyalty-app/src/app/api/promotions/route.ts`
- **Backend API:** `/server.js` - `/api/customers/:id/promotions` endpoint

