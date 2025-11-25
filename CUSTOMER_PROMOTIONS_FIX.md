# Customer Promotions View Fix

## Date: November 24, 2025

## Issues Fixed

### 1. Backend SQL Error (500 Internal Server Error)
**Error**: `column lt.name does not exist`

**Root Cause**: 
- The query in `server.js` (line 7039) was trying to reference `lt.name` from the `loyalty_tiers` table
- The `loyalty_tiers` table has a column called `tier_name`, not `name`

**Fix Applied**:
- Updated the SQL query in `/server.js` at the customer promotions endpoint
- Changed: `SELECT c.*, lt.name as tier_name, lt.id as tier_id`
- To: `SELECT c.*, lt.tier_name, lt.id as tier_id`
- Also fixed the JOIN condition from `c.customer_tier = lt.name` to `c.customer_tier = lt.tier_name`

**Location**: `server.js:7038-7043`

### 2. Frontend React Component Error
**Error**: `Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined`

**Root Cause**:
- The `Customer360Modal` component was referencing a `Loader` icon that didn't exist in `window.Icons`
- The icon was used in multiple places for loading states (promotions, vouchers, orders, transactions tabs)

**Fix Applied**:
- Added the missing `Loader` icon to `/public/icons.js`
- The icon is now available for all loading spinners throughout the application

**Location**: `public/icons.js:346-348`

## Database Schema (Already Correct)

The `loyalty_tiers` table in `db/database.sql` already has the correct schema:

```sql
CREATE TABLE IF NOT EXISTS loyalty_tiers (
    id SERIAL PRIMARY KEY,
    tier_name VARCHAR(50) UNIQUE NOT NULL,  -- Correct column name
    tier_level INTEGER NOT NULL UNIQUE,
    min_spending DECIMAL(10,2) NOT NULL,
    min_visits INTEGER NOT NULL,
    ...
);
```

No database schema changes were needed - the issue was only in the application code.

## Testing

To test the fix:
1. Start the server: `npm start`
2. Navigate to the Loyalty View in the POS
3. Search for a customer
4. Click on the customer to open Customer 360 Modal
5. Click on the "Promotions" tab
6. Verify that:
   - No console errors appear
   - Promotions load correctly
   - They are grouped into: Enrolled, Tier-specific, and General promotions

## Files Modified

1. `/server.js` - Fixed SQL query for customer promotions endpoint
2. `/public/icons.js` - Added missing Loader icon

## Related Endpoints

The fix affects the following API endpoint:
- `GET /api/customers/:id/promotions` - Returns customer-specific, tier-based, and general promotions

