# 📊 Merged SQL Database Files

## Overview

This directory contains the merged and organized SQL files for the unified POS-Loyalty system. All SQL files from the project have been intelligently merged into 2 organized files for easier deployment and maintenance.

---

## 📁 Files

### 1. `database.sql` (3,151 lines)
**Purpose:** Complete database schema for production deployment

**Contains:**
- ✅ **DROP statements** (64) - Cleans existing objects
- ✅ **CREATE TABLE statements** (60) - All tables from:
  - Original POS system
  - Loyalty application (`loyalty-database-changes.sql`)
  - Shop system (`shop_system.sql`)
  - Orders system
- ✅ **INDEXES** - Performance optimization indexes
- ✅ **SEQUENCES** - Auto-increment sequences
- ✅ **FUNCTIONS** (34) - All database functions
- ✅ **TRIGGERS** (14) - All database triggers
- ✅ **VIEWS** - Database views for reporting
- ✅ **Essential Configuration Data** (20 INSERTs):
  - System settings
  - Roles (Admin, Manager, Employee, Customer)
  - Payment methods (Credit Card, Cash, Apple Pay, PayPal, etc.)
  - Loyalty tiers
  - Customer tier rules
  - Default location settings
- ✅ **Salesforce Integration** - Sync columns for orders
- ✅ **1 Admin User** - Default admin account for initial access
  - Email: `admin@pos.com`
  - Password: `Admin123!`

**Use Case:** Run this file to set up a complete, functional database from scratch

---

### 2. `load_sample_data.sql` (185 lines)
**Purpose:** Sample data for testing and demonstration

**Contains:**
- 📦 Sample products
- 👥 Sample customers
- 💳 Sample transactions
- 📝 Sample orders
- 🏢 Sample location inventory
- 🔧 Sample work orders
- ⚙️ Sample user preferences
- 📊 Sample activity logs

**Use Case:** Run this file AFTER `database.sql` to populate the system with test data

---

## 🚀 Deployment Instructions

### For Production Deployment (No Sample Data)

```bash
# 1. Connect to your database
psql $DATABASE_URL

# 2. Run the schema file
\i database.sql

# Done! Your system is ready with:
# - Complete schema
# - All functions and triggers
# - Essential configuration
# - 1 admin user (admin@pos.com)
```

### For Development/Testing (With Sample Data)

```bash
# 1. Connect to your database
psql $DATABASE_URL

# 2. Run the schema file
\i database.sql

# 3. Load sample data
\i load_sample_data.sql

# Done! Your system now has sample data for testing
```

---

## 📋 What Was Merged

### Source Files Merged into `database.sql`:

| Source File | Purpose | Status |
|-------------|---------|--------|
| `database.sql` | Original POS schema | ✅ Merged |
| `loyalty-app/db/loyalty-database-changes.sql` | Loyalty app tables | ✅ Merged |
| `shop_system.sql` | Shop/ordering tables | ✅ Merged |
| `add_salesforce_sync_columns.sql` | Salesforce integration | ✅ Merged |
| `update_payment_method_icons.sql` | Payment method updates | ✅ Merged |

### Source Files Merged into `load_sample_data.sql`:

| Source File | Purpose | Status |
|-------------|---------|--------|
| `database.sql` (sample data section) | Original sample data | ✅ Extracted |
| `load_sample_data.sql` | Existing sample data | ✅ Merged |

### Files NOT Merged (Obsolete or Redundant):

| File | Reason |
|------|--------|
| `product_modifiers.sql` | Superseded by `fix_product_modifiers.sql` |
| `product_modifiers_correct.sql` | Superseded by `fix_product_modifiers.sql` |
| `customer_audit_logging.sql` | Already in main schema |
| `dashboard_settings.sql` | Already in system_settings |
| `landing_page_settings.sql` | Already in system_settings |

---

## 🗂️ Database Schema Overview

### Core POS Tables
- `products` - Product catalog
- `customers` - Customer information
- `transactions` - POS transactions
- `transaction_items` - Transaction line items
- `locations` - Store locations
- `users` - System users
- `roles` - User roles and permissions

### Loyalty System Tables
- `loyalty_tiers` - Loyalty tier definitions
- `loyalty_rewards` - Available rewards
- `customer_rewards` - Customer-earned rewards
- `customer_referrals` - Referral program
- `customer_tier_rules` - Tier calculation rules

### Shop/Ordering System Tables
- `orders` - Customer orders (online & POS)
- `order_items` - Order line items
- `product_modifier_groups` - Product customization groups
- `product_modifiers` - Individual modifiers
- `product_modifier_group_links` - Product-modifier relationships
- `payment_methods` - Available payment methods

### Salesforce Integration
- `orders` - Contains sync columns:
  - `sync_status` - Sync success/failure
  - `sync_message` - Sync response details
  - `salesforce_order_id` - Salesforce record ID
  - `sync_attempted_at` - Last sync timestamp

### Supporting Tables
- `system_settings` - Configuration settings
- `work_orders` - Service/work orders
- `customer_activity_log` - Customer activity tracking
- `user_activity_log` - User activity tracking
- `notifications` - System notifications

---

## 🔑 Default Admin Account

After running `database.sql`, you can log in with:

- **Email:** `admin@pos.com`
- **Password:** `Admin123!`
- **Role:** Admin (full access)

⚠️ **Security Note:** Change this password immediately after first login in production!

---

## 📊 Statistics

### database.sql
- **Lines:** 3,151
- **DROP statements:** 64
- **CREATE TABLE:** 60
- **CREATE FUNCTION:** 34
- **CREATE TRIGGER:** 14
- **INSERT (essential data):** 20
- **Size:** 121 KB

### load_sample_data.sql
- **Lines:** 185
- **INSERT statements:** 14
- **Sample tables:** 12
- **Size:** 14 KB

---

## ✅ Verification Checklist

After deployment, verify the following:

- [ ] All tables created successfully
- [ ] All functions created
- [ ] All triggers created
- [ ] All views created
- [ ] System settings populated
- [ ] Roles populated (Admin, Manager, Employee, Customer)
- [ ] Payment methods populated
- [ ] Admin user created (admin@pos.com)
- [ ] No sample data in production (if not wanted)
- [ ] Sample data loaded correctly (if running load_sample_data.sql)

---

## 🐛 Troubleshooting

### Issue: "relation already exists"
**Solution:** The file includes `DROP IF EXISTS` statements. Run from a clean database or drop existing objects manually.

### Issue: "function does not exist"
**Solution:** Ensure `database.sql` runs completely without errors. Check for syntax errors in function definitions.

### Issue: "foreign key constraint violated"
**Solution:** If manually inserting data, ensure referenced records exist first. The files are ordered correctly.

### Issue: "admin@pos.com already exists"
**Solution:** The admin user creation is idempotent. If the user exists, it will skip creation.

---

## 📝 Merge Script

The merge was performed using `merge_sql.py`, which:
1. ✅ Extracted and organized schema components
2. ✅ Merged multiple source files intelligently
3. ✅ Separated sample data from essential data
4. ✅ Ensured only 1 admin user
5. ✅ Preserved all functions, triggers, and views
6. ✅ Maintained proper dependency order

---

## 🔄 Updating

If you need to make changes:

1. **Schema changes:** Modify `database.sql`
2. **Sample data changes:** Modify `load_sample_data.sql`
3. **Re-merge:** Run `python3 merge_sql.py` to regenerate

**DO NOT** modify the original SQL files in `/db` - they are source files. Always work with the merged versions in `/db/temp/`.

---

## 📞 Support

For questions or issues:
1. Check the troubleshooting section above
2. Review the source SQL files for specific table/function details
3. Check the main project README.md

---

## 🎉 Ready to Deploy!

Your database files are now organized, merged, and ready for deployment. Simply run `database.sql` to set up a complete, functional system!

