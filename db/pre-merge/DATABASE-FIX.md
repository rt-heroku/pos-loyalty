# Database SQL Fix

## Issues Fixed

### 1. Syntax Error (Line 137)
**Problem**: Extra semicolon in the middle of the `customers` table definition
```sql
country VARCHAR(100);,  -- ❌ Semicolon AND comma
```

**Fixed**:
```sql
country VARCHAR(100),   -- ✅ Just comma
```

### 2. Foreign Key Reference Before Table Exists (Line 149)
**Problem**: Trying to add foreign key to `users` table before it's created
```sql
CREATE TABLE customers (...);
ALTER TABLE customers ADD COLUMN user_id INTEGER REFERENCES users(id);  -- ❌ users doesn't exist yet
```

**Fixed**:
```sql
-- Add user_id column in CREATE TABLE
CREATE TABLE customers (
    ...
    user_id INTEGER
);

-- Later, after users table is created:
ALTER TABLE customers ADD CONSTRAINT fk_customers_user_id FOREIGN KEY (user_id) REFERENCES users(id);
```

### 3. EXTRACT Function Type Error (Line 1058)
**Problem**: Using EXTRACT on an integer instead of an interval
```sql
EXTRACT(DAY FROM CURRENT_DATE - c.enrollment_date::DATE)  -- ❌ Result is integer, not interval
```

**Fixed**:
```sql
(CURRENT_DATE - c.enrollment_date::DATE)  -- ✅ Direct subtraction gives days as integer
```

### 4. Admin User Insertion Error (Line 1663)
**Problem**: Trying to insert into non-existent `role` column
```sql
INSERT INTO users (..., role_id, is_active, role)  -- ❌ 'role' column doesn't exist
```

**Fixed**:
```sql
INSERT INTO users (..., role_id, is_active)  -- ✅ Removed 'role' column
```

### 5. Loyalty Database - Wrong Column Names in Indexes (Lines 846-850)
**Problem**: Creating indexes on columns that don't exist in `work_orders` table
```sql
CREATE INDEX idx_work_orders_user_id ON work_orders(user_id);    -- ❌ No user_id column
CREATE INDEX idx_work_orders_store_id ON work_orders(store_id);  -- ❌ No store_id column
CREATE INDEX idx_work_orders_type ON work_orders(type);          -- ❌ No type column
```

**Fixed**:
```sql
CREATE INDEX idx_work_orders_customer_id ON work_orders(customer_id);    -- ✅ Correct column
CREATE INDEX idx_work_orders_location_id ON work_orders(location_id);    -- ✅ Correct column
CREATE INDEX idx_work_orders_work_type ON work_orders(work_type);        -- ✅ Correct column
```

## About the NOTICE Messages

The NOTICE messages you see are **normal and expected**:

```
NOTICE:  view "enhanced_customer_dashboard" does not exist, skipping
NOTICE:  relation "transactions" does not exist, skipping
NOTICE:  function get_customer_tier_summary() does not exist, skipping
```

These occur because the script starts with `DROP` statements to clean up any existing objects:

```sql
-- Drop views if they exist
DROP VIEW IF EXISTS enhanced_customer_dashboard;
DROP VIEW IF EXISTS customer_management_dashboard;
-- ... etc
```

The `IF EXISTS` clause prevents errors, but PostgreSQL still shows NOTICE messages. **This is harmless** - it just means the objects didn't exist yet (which is expected on a fresh database).

## Running the Script

To run the database setup:

```bash
# Local
psql your_database_name -f db/database.sql

# Heroku
heroku pg:psql -f db/database.sql
```

## Expected Output

You should see:
- ✅ Many NOTICE messages (normal - objects being dropped)
- ✅ CREATE TABLE statements
- ✅ CREATE FUNCTION statements
- ✅ CREATE VIEW statements
- ✅ INSERT statements for sample data
- ✅ **No ERROR messages**

## Default Admin User

After running the script, you'll have an admin user:

- **Username**: `admin`
- **Email**: `admin@pos.com`
- **Password**: `P@$$word1`
- **Role**: Administrator

## Verification

To verify the database was set up correctly:

```sql
-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check admin user was created
SELECT id, username, email, first_name, last_name, is_active 
FROM users 
WHERE email = 'admin@pos.com';

-- Check roles were created
SELECT * FROM roles;

-- Check sample data was inserted
SELECT COUNT(*) FROM customers;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM locations;
```

## Troubleshooting

### If you still see ERROR messages

1. **Check PostgreSQL version**: The script requires PostgreSQL 12+
2. **Check permissions**: Ensure your database user has CREATE privileges
3. **Check existing data**: If tables already exist with data, you may need to backup and drop them first

### To completely reset the database

```sql
-- WARNING: This deletes ALL data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO your_user;
GRANT ALL ON SCHEMA public TO public;

-- Then run the script again
\i db/database.sql
```

## What Gets Created

### Tables (22 total)
- `customers` - Customer information and loyalty data
- `transactions` - Sales transactions
- `transaction_items` - Line items for transactions
- `products` - Product catalog
- `locations` - Store locations
- `users` - System users
- `roles` - User roles and permissions
- `work_orders` - Work order management
- `customer_activity_log` - Customer activity tracking
- ... and more

### Functions (25 total)
- `hash_password()` - Password hashing
- `verify_password()` - Password verification
- `generate_loyalty_number()` - Loyalty number generation
- `calculate_customer_tier()` - Tier calculation
- `update_customer_stats()` - Statistics updates
- ... and more

### Views (5 total)
- `enhanced_customer_dashboard` - Customer analytics
- `customer_management_dashboard` - Management view
- `work_orders_summary` - Work order summary
- `location_inventory_view` - Inventory by location
- `user_permissions` - User permission matrix

### Sample Data
- 3 Roles (admin, manager, staff)
- 1 Admin user
- 4 Locations (stores)
- 24 Products
- 4 Customers (sample)

## Next Steps

After running the database script:

1. ✅ Verify admin user can login
2. ✅ Check sample data is present
3. ✅ Test creating a new customer
4. ✅ Test creating a transaction
5. ✅ Deploy to Heroku (if needed)

## Heroku Deployment

The `heroku-postbuild` script in `package.json` automatically runs the loyalty database changes:

```json
"heroku-postbuild": "npm run build && node update-cache-version.js && cd loyalty-app && psql $DATABASE_URL -f db/loyalty-database-changes.sql"
```

To also run the POS database setup on Heroku:

```bash
heroku pg:psql < db/database.sql
```

Or add it to the postbuild script if needed.

