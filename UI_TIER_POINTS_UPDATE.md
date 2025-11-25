# Tier Points UI Implementation

## Summary
Added `tier_points` display to customer cards and Customer 360 modal between "Points" and "Total Spent".

## Changes Made

### 1. Customer Cards in POS - `public/components/views/LoyaltyView.js`

#### Main Customer Card Stats (Line ~341-356)
- Changed grid from `grid-cols-3` to `grid-cols-4`
- Added "Tier Points" between "Points" and "Total Spent"
- Used orange color scheme for tier points (`text-orange-600`)

**Before**: Points → Total Spent → Visits
**After**: Points → Tier Points → Total Spent → Visits

#### Customer Detail View Stats (Line ~647-664)
- Changed grid from `grid-cols-3` to `grid-cols-4`
- Added "Tier Points" with orange styling
- Displays `customer.tier_points || 0`

### 2. Customer 360 Modal - `public/components/modals/Customer360Modal.js`

#### Loyalty Tab Stats Cards (Line ~237-264)
- Changed grid from `grid-cols-3` to `grid-cols-2 lg:grid-cols-4`
- Added "Tier Points" card with orange gradient styling
- Positioned between "Loyalty Points" (green) and "Total Spent" (blue)

**New Order**:
1. Loyalty Points (Green)
2. **Tier Points (Orange)** ← NEW
3. Total Spent (Blue)
4. Total Visits (Purple)

## Styling

### Tier Points Card Styling:
- **Background**: Orange gradient (`from-orange-50 to-orange-100`)
- **Border**: Orange (`border-orange-200`)
- **Icon**: Orange circle with TrendingUp icon
- **Text**: Orange color scheme (`text-orange-600`)
- **Value**: Bold 3xl font

## Data Source

The `tier_points` field comes from:
- Backend: `customers.tier_points` column (added previously)
- APIs: All customer endpoints now return `tier_points`
- Default value: `0` if null or undefined

---

## 🐛 Promotions Not Showing - Debugging Guide

### Issue
User reports that promotions are not showing in:
1. POS → Customer 360 Modal → Promotions tab
2. Loyalty App `/loyalty` page → Promotions tab

### Possible Causes

#### 1. No Promotions in Database
Check if promotions exist and are active:

```sql
-- Check for active promotions
SELECT id, name, is_active, created_at 
FROM promotions 
WHERE is_active = true;

-- Check for customer-specific promotions
SELECT cp.customer_id, p.name, cp.enrolled_at
FROM customer_promotions cp
JOIN promotions p ON cp.promotion_id = p.id
WHERE p.is_active = true;

-- Check for tier-specific promotions
SELECT ltp.loyalty_tier_id, lt.tier_name, p.name
FROM loyalty_tier_promotions ltp
JOIN promotions p ON ltp.promotion_id = p.id
JOIN loyalty_tiers lt ON ltp.loyalty_tier_id = lt.id
WHERE p.is_active = true;
```

#### 2. API Endpoint Issues

**POS Customer 360**: 
- Endpoint: `GET /api/customers/:id/promotions`
- Location: `server.js` line ~7197-7273
- Check browser console for errors
- Check server logs for SQL errors

**Loyalty App**:
- Frontend: `loyalty-app/src/app/loyalty/page.tsx` line ~199-228
- Next.js API: `loyalty-app/src/app/api/promotions/route.ts`
- Backend: `GET /api/loyalty/:loyaltyNumber/promotions` (server.js line ~3326)

#### 3. Frontend Display Logic

**Customer 360 Modal** (`Customer360Modal.js`):
- Shows loading state while fetching
- Shows "No promotions available" if `promotions.length === 0`
- Groups by source: customer, tier, general
- Line ~316-417

**Loyalty Page** (`loyalty-app/src/app/loyalty/page.tsx`):
- Shows "No promotions available" if array is empty
- Line ~479-565

### Debugging Steps

1. **Check Browser Console**:
   ```javascript
   // Look for these errors:
   - "Error fetching promotions"
   - 404 or 500 status codes
   - Network errors
   ```

2. **Check Server Logs**:
   ```
   - Look for SQL errors
   - Check "Error fetching customer promotions"
   - Verify customer tier lookup is working
   ```

3. **Test Endpoints Directly**:
   ```bash
   # Test customer promotions endpoint
   curl http://localhost:3000/api/customers/1/promotions
   
   # Test loyalty promotions endpoint
   curl http://localhost:3000/api/loyalty/LOYALTY001/promotions
   ```

4. **Verify Database Records**:
   ```sql
   -- Create a test promotion if none exist
   INSERT INTO promotions (name, description, promotion_type, is_active)
   VALUES ('Test Promotion', 'Test description', 'General', true);
   ```

### Expected Response Format

```json
{
  "promotions": [
    {
      "id": 1,
      "name": "Spring Sale",
      "description": "Get 20% off",
      "promotion_type": "Percentage",
      "is_active": true,
      "promotion_source": "general", // or "customer" or "tier"
      "is_enrolled": false // or true for customer-specific
    }
  ]
}
```

### Quick Fix

If no promotions exist, create some test data:

```sql
-- Insert a test general promotion
INSERT INTO promotions 
  (name, description, promotion_type, discount_value, is_active, start_date, end_date)
VALUES 
  ('Welcome Bonus', 'New member bonus', 'Points', 100, true, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
  ('Summer Sale', '15% off all items', 'Percentage', 15, true, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days');
```

## Next Steps

1. ✅ Tier points UI is complete
2. 🔍 **User needs to**: Check browser console and server logs for promotions errors
3. 🔍 **User needs to**: Verify promotions exist in database
4. 📋 Once debugged, we can add MuleSoft promotions sync logic

