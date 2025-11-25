# Loyalty Page Fixes - Promotions & Orders Display

## Issues Fixed

### 1. **Promotions Not Showing**
**Problem**: The loyalty page had a "Promotions" tab but it was actually showing "rewards" data from the rewards endpoint, not actual promotions from the `promotions` table.

**Root Cause**:
- The page had no `promotions` state variable
- The `fetchLoyaltyData` function never fetched promotions
- The tab ID was `'rewards'` but labeled as "Promotions"

**Fixes Applied**:
1. Added `promotions` state: `const [promotions, setPromotions] = useState<any[]>([]);`
2. Added promotions fetch in `fetchLoyaltyData()`:
   ```typescript
   if (user?.loyaltyNumber) {
     const promotionsResponse = await fetch(
       `/loyalty/api/promotions?loyalty_number=${user.loyaltyNumber}`,
       { credentials: 'include' }
     );
     if (promotionsResponse.ok) {
       const promotionsData = await promotionsResponse.json();
       setPromotions(promotionsData.promotions || []);
     }
   }
   ```
3. Changed tab ID from `'rewards'` to `'promotions'`
4. Completely rewrote the promotions tab content to display actual promotions with:
   - Promotion image (if available)
   - Display name and description
   - Reward points
   - Enrollment status badge (✓ Enrolled for enrolled promotions)
   - Promotion source (customer/tier/general)
   - Start and end dates

### 2. **Orders Not Showing - Enhanced Logging**
**Problem**: Orders endpoint was being called but data wasn't displaying (user reported 4 orders in database).

**Debugging Added**:
1. Added detailed console logging before fetch:
   ```typescript
   console.log('[Loyalty] Fetching orders for user:', user?.id, user?.email);
   ```
2. Enhanced success logging:
   ```typescript
   console.log('[Loyalty] Orders loaded:', ordersData.length, 'orders:', ordersData);
   ```
3. Added error response logging:
   ```typescript
   const errorText = await ordersResponse.text();
   console.error('[Loyalty] Orders error response:', errorText);
   ```

## API Endpoints Used

### Promotions
- **Loyalty App Route**: `/loyalty/api/promotions?loyalty_number={loyaltyNumber}`
- **Backend Route**: `/api/loyalty/:loyaltyNumber/promotions`
- **Returns**: `{ promotions: [...] }`
  - Includes customer-specific promotions (from `customer_promotions`)
  - Includes tier promotions (from `loyalty_tier_promotions`)
  - Includes general promotions (from `promotions`)
  - Each promotion has `promotion_source: 'customer' | 'tier' | 'general'`

### Orders
- **Loyalty App Route**: `/loyalty/api/orders`
- **Backend Route**: `/api/orders?customer_id={customerId}`
- **Returns**: Array of order objects

## New Promotions Display Features

The promotions tab now shows:

1. **Promotion Cards** with:
   - Image banner (if available)
   - Display name or name
   - Description
   - Reward points in blue
   - Enrollment badge (green "✓ Enrolled" for enrolled promotions)
   - Green border and background for enrolled promotions
   - Gray border and background for available promotions

2. **Promotion Details**:
   - Type (customer/tier/general)
   - Start and end dates with calendar icon

3. **Empty State**:
   - Gift icon
   - "No promotions available" message
   - "Check back later for new promotions" subtext

## Testing Instructions

### 1. Test Promotions Display

Open browser console and navigate to `/loyalty`:

**Check Console Logs**:
```
[Loyalty] Fetching promotions for loyalty number: LOY001
[Loyalty] Promotions loaded: 1 promotions: [...]
```

**What to Look For**:
- ✅ Console shows "Fetching promotions for loyalty number: {number}"
- ✅ Console shows "Promotions loaded: X promotions"
- ✅ Console displays the promotions array
- ✅ Click "Promotions" tab
- ✅ Should see promotion cards
- ✅ Enrolled promotions have green border and "✓ Enrolled" badge

**If No Promotions Show**:
1. Check console for error messages
2. Verify `user.loyaltyNumber` exists: `console.log(user)`
3. Check backend endpoint response: Look for `[Promotions API]` logs
4. Verify database has active promotions: `SELECT * FROM promotions WHERE is_active = true`

### 2. Test Orders Display

**Check Console Logs**:
```
[Loyalty] Fetching orders for user: {id} {email}
[Loyalty] Orders loaded: 4 orders: [...]
```

**What to Look For**:
- ✅ Console shows "Fetching orders for user: {id}"
- ✅ Console shows "Orders loaded: X orders"
- ✅ Console displays the orders array
- ✅ Click "Online Orders" tab
- ✅ Should see "4 total orders" in header
- ✅ Should see order cards with order numbers, dates, totals

**If Orders Don't Show**:
1. Check console logs for errors
2. Check if orders array is empty: Look at console output
3. Verify user authentication: Check for 401 errors
4. Check backend logs: Look for `[Orders API]` entries
5. Verify orders in database:
   ```sql
   SELECT * FROM orders WHERE customer_id = {user_id}
   ```
6. Check that orders have `origin != 'pos'` (online orders only)

## Common Issues & Solutions

### Issue: "No loyaltyNumber found for user"
**Solution**: The user object doesn't have a `loyaltyNumber` field
- Check `customers` table: `SELECT loyalty_number FROM customers WHERE id = {user_id}`
- Verify the login process populates `loyaltyNumber` in the user object

### Issue: Promotions API returns empty array
**Solution**: 
1. Check database for active promotions:
   ```sql
   SELECT COUNT(*) FROM promotions WHERE is_active = true;
   ```
2. Check if customer is enrolled in any:
   ```sql
   SELECT * FROM customer_promotions WHERE customer_id = (
     SELECT id FROM customers WHERE loyalty_number = 'LOY001'
   );
   ```
3. Check tier promotions:
   ```sql
   SELECT ltp.*, p.name 
   FROM loyalty_tier_promotions ltp
   JOIN promotions p ON ltp.promotion_id = p.id
   WHERE ltp.loyalty_tier_id = (
     SELECT lt.id FROM customers c
     JOIN loyalty_tiers lt ON c.customer_tier = lt.name
     WHERE c.loyalty_number = 'LOY001'
   );
   ```

### Issue: Orders API returns 401
**Solution**: Authentication issue
- Verify cookie is being sent: Check Network tab → Request Headers → Cookie
- Check if user cookie exists and is valid
- Try logging out and back in

### Issue: Orders API returns empty array but database has orders
**Solution**: Customer ID mismatch
- Check what customer_id the API is using:
  - Look at `[Orders API] Fetching all online orders for customer: X` log
- Verify orders belong to that customer:
  ```sql
  SELECT id, order_number, customer_id FROM orders WHERE customer_id = X;
  ```
- Check if orders have `origin = 'pos'` (these are excluded from online orders)

## Files Modified

1. **`/loyalty-app/src/app/loyalty/page.tsx`**
   - Added `promotions` state variable
   - Added promotions fetch to `fetchLoyaltyData()`
   - Changed tab ID from 'rewards' to 'promotions'
   - Rewrote promotions tab content
   - Enhanced console logging for orders and promotions

## Next Steps

1. Open the loyalty app in browser
2. Open browser console (F12)
3. Navigate to `/loyalty`
4. Check console logs for fetch operations
5. Click "Promotions" tab - should see promotions
6. Click "Online Orders" tab - should see orders
7. Report back what you see in console and on screen


