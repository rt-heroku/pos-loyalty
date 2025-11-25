# Sample Promotions Setup Guide

This guide explains how to load sample promotions into your database to test the promotions feature.

## 🎯 What's Included

The sample data includes **10 different promotions**:

1. **Welcome Bonus** - 500 points for new members (enrollment required)
2. **Double Points on Backpacks** - Automatic 2x points (active now)
3. **Big Spender Bonus** - 1000 points for $500+ purchases
4. **Birthday Month Bonus** - 300 points during birthday month
5. **Referral Rewards** - 250 points for referring friends
6. **Holiday Triple Points** - 3x points on all purchases (active now)
7. **Profile Completion** - 100 points for completing profile
8. **Free Shipping** - Member exclusive free shipping week
9. **Gold Tier Early Access** - Exclusive sale access (coming soon)
10. **Social Share Bonus** - 50 points for social media shares

## 📋 Prerequisites

- Database must be set up (run `database.sql` and `load_sample_data.sql` first)
- PostgreSQL client (`psql`) installed
- `DATABASE_URL` environment variable configured

## 🚀 Quick Start

### Option 1: Using the Shell Script (Recommended)

```bash
# Navigate to the db directory
cd /Users/rodrigo.torres/mulesoft-work/unified-pos-loyalty/db

# Set your DATABASE_URL (if not already set)
export DATABASE_URL='your-database-url-here'

# For Heroku:
export DATABASE_URL=$(heroku config:get DATABASE_URL -a your-app-name)

# Run the script
./load_sample_promotions.sh
```

### Option 2: Manual SQL Execution

```bash
# Run the SQL file directly
psql "$DATABASE_URL" -f sample_promotions.sql
```

### Option 3: Using Heroku Postgres

```bash
# Connect to Heroku database
heroku pg:psql -a your-app-name

-- Then paste or run:
\i sample_promotions.sql
```

## 🔍 Verify the Data

### 1. Check Promotions in POS App

1. Open your POS application
2. Click **"Operations"** → **"Promotions"**
3. You should see all 10 promotions displayed

### 2. Check Promotions in Loyalty View

1. Go to **"Loyalty"** tab
2. Search for customer: **LOY001**
3. You'll see 3 enrolled promotions:
   - ✅ Welcome Bonus (Completed)
   - ✅ Profile Completion (Completed)
   - 🔄 Holiday Triple Points (In Progress - 30%)

### 3. Test the API

```bash
# Get all active promotions
curl https://your-app.herokuapp.com/api/promotions

# Get promotions for a specific customer
curl https://your-app.herokuapp.com/api/loyalty/LOY001/promotions
```

## 📊 Sample Data Details

### Promotion Types

- **Once**: Can only be used once per customer
- **Limited**: Limited number of uses
- **Unlimited**: Can be used multiple times

### Enrollment

- **Required**: Customer must explicitly enroll
- **Automatic**: Auto-applied to eligible customers

### Customer Enrollments

Customer **LOY001 (John Doe)** is enrolled in:

| Promotion | Status | Progress |
|-----------|--------|----------|
| Welcome Bonus | Completed | 100% |
| Profile Completion | Completed | 100% |
| Holiday Triple Points | Active | 30% (3/10) |

## 🎨 Features Demonstrated

### 1. Active Promotions
- Currently running promotions
- Date-based activation/expiration
- Point multipliers
- Fixed point rewards

### 2. Enrollment Tracking
- Required vs automatic enrollment
- Progress tracking for cumulative promotions
- Completion status
- Historical data

### 3. Promotion Types
- Points-based rewards
- Multiplier promotions (2x, 3x points)
- Conditional rewards (spend thresholds)
- Time-based promotions

## 🔧 Customization

### Add Your Own Promotions

Edit `sample_promotions.sql` and add new entries:

```sql
INSERT INTO promotions (
    sf_id,
    name,
    display_name,
    description,
    is_active,
    start_date_time,
    end_date_time,
    usage_type,
    total_reward_points,
    -- ... other fields
) VALUES (
    'YOUR-ID',
    'Your Promotion Name',
    'Display Name',
    'Description for customers',
    true,
    NOW(),
    NOW() + INTERVAL '30 days',
    'Unlimited',
    1000
);
```

### Enroll More Customers

```sql
-- Enroll customer in a promotion
INSERT INTO customer_promotions (
    customer_id,
    promotion_id,
    is_enrollment_active,
    enrolled_at,
    status
) VALUES (
    (SELECT id FROM customers WHERE loyalty_number = 'LOY001'),
    (SELECT id FROM promotions WHERE sf_id = 'SAMPLE-001'),
    true,
    NOW(),
    'active'
);
```

## 🗑️ Cleanup

To remove all sample promotions:

```sql
-- Remove all sample promotions and enrollments
DELETE FROM customer_promotions 
WHERE promotion_id IN (
    SELECT id FROM promotions WHERE sf_id LIKE 'SAMPLE-%'
);

DELETE FROM promotions WHERE sf_id LIKE 'SAMPLE-%';
```

## 🆘 Troubleshooting

### "Promotions not showing in POS"

1. Check if promotions are in database:
   ```sql
   SELECT COUNT(*) FROM promotions WHERE is_active = true;
   ```

2. Verify API endpoint:
   ```bash
   curl http://localhost:3000/api/promotions
   ```

3. Check browser console for errors

### "Customer promotions not showing"

1. Verify customer exists:
   ```sql
   SELECT * FROM customers WHERE loyalty_number = 'LOY001';
   ```

2. Check enrollment data:
   ```sql
   SELECT * FROM customer_promotions WHERE customer_id = 
     (SELECT id FROM customers WHERE loyalty_number = 'LOY001');
   ```

3. Test API:
   ```bash
   curl http://localhost:3000/api/loyalty/LOY001/promotions
   ```

### "DATABASE_URL not set"

```bash
# For Heroku
export DATABASE_URL=$(heroku config:get DATABASE_URL -a your-app-name)

# For local development
export DATABASE_URL='postgresql://username:password@localhost:5432/dbname'
```

## 📝 Notes

- All sample promotions use `SAMPLE-XXX` prefix in `sf_id` for easy identification
- Dates are relative to current date for realistic testing
- Customer LOY001 must exist (created by `load_sample_data.sql`)
- Re-running the script will delete and recreate sample promotions

## 🎓 Next Steps

1. **Test the functionality**: Try searching for customers, viewing promotions
2. **Create real promotions**: Use the POS or directly in database
3. **Integrate with Salesforce**: Sync promotions from Salesforce when ready
4. **Customize display**: Modify the PromotionsView component as needed

## 📚 Related Documentation

- **API Endpoints**: See `server.js` lines 3217-3365
- **Database Schema**: See `database.sql` lines 4420-4569
- **POS View**: `public/components/views/PromotionsView.js`
- **Loyalty View**: `public/components/views/LoyaltyView.js`

---

**Need help?** Check the console logs or create an issue in the repository.


