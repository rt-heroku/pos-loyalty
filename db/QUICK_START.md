# 🚀 Quick Start Guide

## For Heroku/Production Deployment

```bash
# Single command - creates complete functional system
psql $DATABASE_URL -f database.sql
```

**Result:**
- ✅ 60 tables created
- ✅ 34 functions, 14 triggers, all views
- ✅ Essential configuration loaded
- ✅ 1 admin user: `admin@pos.com` / `Admin123!`
- ✅ System ready for use (NO sample data)

---

## For Local Development/Testing

```bash
# Step 1: Create schema
psql $DATABASE_URL -f database.sql

# Step 2: Load sample data (optional)
psql $DATABASE_URL -f load_sample_data.sql
```

**Result:**
- ✅ Complete functional system
- ✅ Sample products, customers, transactions
- ✅ Ready for testing

---

## What's Included

### database.sql (121 KB)
- Complete POS + Loyalty + Shop schema
- All functions and triggers
- System settings, roles, payment methods
- Salesforce sync columns
- 1 admin user only

### load_sample_data.sql (14 KB)
- Sample products
- Sample customers
- Sample transactions
- Sample orders
- For testing/demo only

---

## Default Admin Access

```
Email:    admin@pos.com
Password: Admin123!
Role:     Admin (full access)
```

⚠️ **Change password after first login in production!**

---

## Verify Deployment

```sql
-- Check tables
SELECT count(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return: 60+

-- Check admin user
SELECT * FROM users WHERE email = 'admin@pos.com';
-- Should return: 1 row

-- Check functions
SELECT count(*) FROM information_schema.routines 
WHERE routine_schema = 'public';
-- Should return: 34+
```

---

## Need Help?

- 📖 Read `README.md` - Comprehensive guide
- 📊 Read `MERGE_SUMMARY.md` - Detailed breakdown
- 🐛 Check troubleshooting section in README.md

---

## File Structure

```
/db/temp/
├── database.sql ⭐ (Deploy this)
├── load_sample_data.sql (Optional)
├── README.md (Full documentation)
├── MERGE_SUMMARY.md (Merge details)
├── QUICK_START.md (This file)
└── merge_sql.py (Merge script)
```

---

## One-Line Deployment

**Production:**
```bash
psql $DATABASE_URL -f /db/temp/database.sql && echo "✅ Deployed!"
```

**Development:**
```bash
psql $DATABASE_URL -f /db/temp/database.sql -f /db/temp/load_sample_data.sql && echo "✅ Deployed with sample data!"
```

---

## 🎉 That's it! You're ready to deploy!

