# Customer 360 Database Schema Fixes

## Date: November 24, 2025

## Issues Fixed

Three database schema mismatches were causing errors in the Customer 360 view:

### 1. Customer Promotions Query Error
**Error**: `column cp.enrollment_date does not exist`

**Root Cause**: 
- The query was looking for `enrollment_date`, `enrollment_status`, and `progress` columns
- The actual `customer_promotions` table has different column names

**Actual Schema**:
```sql
CREATE TABLE customer_promotions (
    ...
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- NOT enrollment_date
    is_enrollment_active BOOLEAN DEFAULT true,         -- NOT enrollment_status
    cumulative_usage_complete_percent NUMERIC(5,2),    -- For progress
    ...
);
```

**Fix Applied**:
```sql
-- Before
cp.enrollment_date,
cp.enrollment_status,
cp.progress,

-- After
cp.enrolled_at as enrollment_date,
cp.is_enrollment_active as enrollment_status,
cp.cumulative_usage_complete_percent as progress,
```

**Location**: `server.js:7052-7064` (Customer promotions endpoint)

---

### 2. Salesforce Orders Settings Error
**Error**: `relation "settings" does not exist`

**Root Cause**:
- The query was looking for a table called `settings`
- The actual table is named `system_settings`

**Actual Schema**:
```sql
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    ...
);
```

**Fix Applied**:
```sql
-- Before
SELECT setting_value FROM settings WHERE setting_key = 'mulesoft_endpoint'

-- After
SELECT setting_value FROM system_settings WHERE setting_key = 'mulesoft_endpoint'
```

**Location**: `server.js:7162-7163` (Salesforce orders endpoint)

---

### 3. Customer Transactions Items Error
**Error**: `column t.items does not exist`

**Root Cause**:
- The query was trying to select `t.items` and `t.transaction_type` directly from transactions table
- The `transactions` table doesn't have an `items` column
- Transaction items are stored in a separate `transaction_items` table with a foreign key relationship

**Actual Schema**:
```sql
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    -- NO items column
    -- NO transaction_type column
);

CREATE TABLE transaction_items (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id),
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal DECIMAL(10,2),
    ...
);
```

**Fix Applied**:
- Removed non-existent columns: `t.items`, `t.transaction_type`
- Added proper columns: `t.subtotal`, `t.tax`, `t.discount_amount`, `t.points_earned`, `t.points_redeemed`
- Added JOIN with `transaction_items` table
- Used JSON aggregation to build items array from `transaction_items`

```sql
-- Added to SELECT
COALESCE(
  json_agg(
    json_build_object(
      'name', ti.product_name,
      'quantity', ti.quantity,
      'price', ti.product_price,
      'subtotal', ti.subtotal
    ) ORDER BY ti.id
  ) FILTER (WHERE ti.id IS NOT NULL),
  '[]'
) as items

-- Added JOIN
LEFT JOIN transaction_items ti ON t.id = ti.transaction_id

-- Added GROUP BY
GROUP BY t.id, l.store_name
```

**Location**: `server.js:7116-7131` (Customer transactions endpoint)

---

## Benefits of These Fixes

1. **Promotions Tab**: Now displays correctly with enrollment dates, status, and progress
2. **Orders Tab**: Can retrieve Salesforce orders if MuleSoft endpoint is configured
3. **Transactions Tab**: Shows complete transaction history with itemized details

## Database Schema Verification

All fixes align with the existing schema in `/db/database.sql`. No schema changes were needed - only query corrections.

## Testing Checklist

- [x] Promotions tab loads without errors
- [x] Enrolled promotions show enrollment date
- [x] Salesforce orders query uses correct table name
- [x] Transactions tab loads with full details
- [x] Transaction items display correctly
- [x] No SQL errors in console
- [x] No linter errors

## Files Modified

1. `/server.js` - Fixed three SQL queries:
   - Line 7052-7064: Customer promotions query
   - Line 7116-7131: Customer transactions query  
   - Line 7162-7163: Salesforce orders settings query

## Related Endpoints

The following API endpoints were fixed:
- `GET /api/customers/:id/promotions` - Returns customer promotions with correct columns
- `GET /api/customers/:id/transactions` - Returns transactions with items from transaction_items table
- `GET /api/customers/:id/salesforce-orders` - Uses correct system_settings table

## Notes

- The transactions query now uses JSON aggregation which is supported in PostgreSQL 9.4+
- Empty transactions (with no items) return an empty array `[]` instead of null
- All changes maintain backwards compatibility with existing frontend code

