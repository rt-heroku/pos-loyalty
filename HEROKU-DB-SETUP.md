# Heroku Database Setup Commands

## Your Database Connection

```
DATABASE_URL=postgres://ua4t8k2upniub0:p5e153aed5cccfdb75b7177eccf4eeca4be6358fc16b7e1ad0ac026f630639ae1@c57oa7dm3pc281.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d2vfvbo9udp4kb
```

## Quick Setup Commands

### Option 1: Using Heroku CLI (Recommended)

```bash
# Navigate to your project
cd /Users/rodrigo.torres/mulesoft-work/unified-pos-loyalty

# Run the POS database setup
heroku pg:psql -a pos-loyalty-7ee789772607 < db/database.sql

# Run the Loyalty database setup
heroku pg:psql -a pos-loyalty-7ee789772607 < loyalty-app/db/loyalty-database-changes.sql
```

### Option 2: Using psql Directly

```bash
# Navigate to your project
cd /Users/rodrigo.torres/mulesoft-work/unified-pos-loyalty

# Set the DATABASE_URL
export DATABASE_URL="postgres://ua4t8k2upniub0:p5e153aed5cccfdb75b7177eccf4eeca4be6358fc16b7e1ad0ac026f630639ae1@c57oa7dm3pc281.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d2vfvbo9udp4kb"

# Run the POS database setup
psql $DATABASE_URL -f db/database.sql

# Run the Loyalty database setup
psql $DATABASE_URL -f loyalty-app/db/loyalty-database-changes.sql
```

### Option 3: Single Command (All at Once)

```bash
cd /Users/rodrigo.torres/mulesoft-work/unified-pos-loyalty

psql "postgres://ua4t8k2upniub0:p5e153aed5cccfdb75b7177eccf4eeca4be6358fc16b7e1ad0ac026f630639ae1@c57oa7dm3pc281.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d2vfvbo9udp4kb" -f db/database.sql

psql "postgres://ua4t8k2upniub0:p5e153aed5cccfdb75b7177eccf4eeca4be6358fc16b7e1ad0ac026f630639ae1@c57oa7dm3pc281.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d2vfvbo9udp4kb" -f loyalty-app/db/loyalty-database-changes.sql
```

## What These Commands Do

### POS Database (`db/database.sql`)
Creates:
- ✅ 22 tables (customers, products, transactions, users, etc.)
- ✅ 25 functions (password hashing, loyalty calculations, etc.)
- ✅ 5 views (dashboards, reports)
- ✅ Sample data (admin user, locations, products)
- ✅ **generated_products table** (fixes your Data Management error)

### Loyalty Database (`loyalty-app/db/loyalty-database-changes.sql`)
Creates:
- ✅ Additional loyalty-specific tables
- ✅ Customer vouchers
- ✅ Wishlists
- ✅ Appointments
- ✅ Store events
- ✅ Indexes for performance

## Verification

After running the setup, verify it worked:

```bash
# Check tables were created
psql "$DATABASE_URL" -c "\dt"

# Check admin user exists
psql "$DATABASE_URL" -c "SELECT id, username, email FROM users WHERE email = 'admin@pos.com';"

# Check generated_products table exists
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM generated_products;"
```

## Expected Output

You should see:
- ✅ Many NOTICE messages (normal - dropping non-existent objects)
- ✅ CREATE TABLE statements
- ✅ CREATE FUNCTION statements
- ✅ INSERT statements
- ✅ **NO ERROR messages**

## After Setup

1. **Test the fix**: Go to https://pos-loyalty-7ee789772607.herokuapp.com/pos/
2. **Click Settings** → **Data Management**
3. **Expected**: No error, shows empty list or generated products

## Default Admin User

After setup, you can login with:
- **Username**: `admin`
- **Email**: `admin@pos.com`
- **Password**: `P@$$word1`

## Troubleshooting

### If you get "permission denied"

```bash
# Make sure you're using the correct DATABASE_URL
echo $DATABASE_URL

# Or use Heroku CLI which handles permissions automatically
heroku pg:psql -a pos-loyalty-7ee789772607
```

### If you get "relation already exists"

This is normal! The scripts use `CREATE TABLE IF NOT EXISTS` and `INSERT ... ON CONFLICT DO NOTHING`, so they're safe to run multiple times.

### If you want to start fresh

**⚠️ WARNING: This deletes ALL data!**

```bash
# Connect to database
psql "$DATABASE_URL"

# Drop and recreate schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO ua4t8k2upniub0;
GRANT ALL ON SCHEMA public TO public;

# Exit and run setup again
\q

# Run setup scripts
psql "$DATABASE_URL" -f db/database.sql
psql "$DATABASE_URL" -f loyalty-app/db/loyalty-database-changes.sql
```

## Quick Test Script

Save this as `test-heroku-db.sh`:

```bash
#!/bin/bash

DATABASE_URL="postgres://ua4t8k2upniub0:p5e153aed5cccfdb75b7177eccf4eeca4be6358fc16b7e1ad0ac026f630639ae1@c57oa7dm3pc281.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d2vfvbo9udp4kb"

echo "Testing database connection..."
psql "$DATABASE_URL" -c "SELECT version();"

echo ""
echo "Checking if generated_products table exists..."
psql "$DATABASE_URL" -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'generated_products');"

echo ""
echo "Checking table count..."
psql "$DATABASE_URL" -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"

echo ""
echo "Checking admin user..."
psql "$DATABASE_URL" -c "SELECT id, username, email, is_active FROM users WHERE email = 'admin@pos.com';"
```

Run it:
```bash
chmod +x test-heroku-db.sh
./test-heroku-db.sh
```

## Summary

**Recommended command** (simplest):

```bash
cd /Users/rodrigo.torres/mulesoft-work/unified-pos-loyalty
heroku pg:psql -a pos-loyalty-7ee789772607 < db/database.sql
```

This will:
1. ✅ Create all tables including `generated_products`
2. ✅ Fix the "Data Management" error
3. ✅ Set up admin user
4. ✅ Add sample data

**Then test**: https://pos-loyalty-7ee789772607.herokuapp.com/pos/ → Settings → Data Management

No more errors! 🎉

