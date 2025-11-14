# Customer Name Fields Fix

## 🐛 The Problem

When users registered in the loyalty app, their `first_name` and `last_name` were only being saved in the `users` table, but not in the `customers` table. The `customers` table only had the concatenated `name` field populated.

**User Report:**
> "The first name and last name of the customer is not being saved when the user is registered, it is only registered in the users. Those 2 need to be inserted as well, because they are needed on another process."

---

## 🔍 Root Cause

The registration code was only inserting/updating the `name` field (concatenated full name) in the `customers` table, but not the separate `first_name` and `last_name` columns.

### Database Schema

The `customers` table has:
- `first_name VARCHAR(100)` ✅ Column exists
- `last_name VARCHAR(100)` ✅ Column exists  
- `name VARCHAR(255) NOT NULL` ✅ Column exists

### Before Fix

**Updating existing customer:**
```sql
UPDATE customers 
SET user_id = $1, 
    name = $2,  -- ❌ Only concatenated name
    phone = $3, 
    marketing_consent = $4,
    updated_at = NOW()
WHERE email = $5
```

**Creating new customer:**
```sql
INSERT INTO customers (
  user_id, loyalty_number, name,  -- ❌ Only concatenated name
  email, phone, points, ...
)
VALUES ($1, generate_loyalty_number(), $2, $3, $4, $5, ...)
```

---

## ✅ The Fix

Updated both the `UPDATE` and `INSERT` statements to include `first_name` and `last_name` columns separately.

### Fix 1: Update Existing Customer

**Before:**
```sql
UPDATE customers 
SET user_id = $1, 
    name = $2,  -- Only concatenated
    phone = $3, 
    marketing_consent = $4,
    updated_at = NOW()
WHERE email = $5
```

**After:**
```sql
UPDATE customers 
SET user_id = $1, 
    first_name = $2,          -- ✅ Added
    last_name = $3,           -- ✅ Added
    name = $4,                -- Still keep concatenated
    phone = $5, 
    marketing_consent = $6,
    updated_at = NOW()
WHERE email = $7
```

**Parameters changed from:**
```typescript
[
  user.id,
  `${firstName} ${lastName}`,  // $2 - name
  phone || null,               // $3 - phone
  validation.data.marketingConsent,  // $4
  email,                       // $5
]
```

**To:**
```typescript
[
  user.id,                           // $1 - user_id
  firstName,                         // $2 - first_name ✅
  lastName,                          // $3 - last_name ✅
  `${firstName} ${lastName}`,        // $4 - name
  phone || null,                     // $5 - phone
  validation.data.marketingConsent,  // $6
  email,                             // $7
]
```

---

### Fix 2: Create New Customer

**Before:**
```sql
INSERT INTO customers (
  user_id, loyalty_number, name,  -- Only concatenated
  email, phone, points, total_spent, visit_count, 
  created_at, updated_at, marketing_consent, 
  member_status, enrollment_date, member_type, customer_tier
)
VALUES ($1, generate_loyalty_number(), $2, $3, $4, $5, $6, $7, 
        NOW(), NOW(), $8, $9, NOW(), $10, $11)
```

**After:**
```sql
INSERT INTO customers (
  user_id, loyalty_number, 
  first_name, last_name, name,  -- ✅ Added first_name and last_name
  email, phone, points, total_spent, visit_count, 
  created_at, updated_at, marketing_consent, 
  member_status, enrollment_date, member_type, customer_tier
)
VALUES ($1, generate_loyalty_number(), 
        $2, $3, $4,  -- ✅ firstName, lastName, concatenated name
        $5, $6, $7, $8, $9, 
        NOW(), NOW(), $10, $11, NOW(), $12, $13)
```

**Parameters changed from:**
```typescript
[
  user.id,                           // $1
  `${firstName} ${lastName}`,        // $2 - name
  email,                             // $3
  phone || null,                     // $4
  0,                                 // $5 - points
  '0.00',                           // $6 - total_spent
  0,                                 // $7 - visit_count
  validation.data.marketingConsent,  // $8
  'Active',                          // $9
  'Individual',                      // $10
  'Bronze',                          // $11
]
```

**To:**
```typescript
[
  user.id,                           // $1 - user_id
  firstName,                         // $2 - first_name ✅
  lastName,                          // $3 - last_name ✅
  `${firstName} ${lastName}`,        // $4 - name
  email,                             // $5
  phone || null,                     // $6
  0,                                 // $7 - points
  '0.00',                           // $8 - total_spent
  0,                                 // $9 - visit_count
  validation.data.marketingConsent,  // $10
  'Active',                          // $11
  'Individual',                      // $12
  'Bronze',                          // $13
]
```

---

## 🎯 What This Fixes

### Before Fix:
```sql
-- In users table
first_name: 'John'     ✅
last_name: 'Doe'       ✅

-- In customers table
first_name: NULL       ❌
last_name: NULL        ❌
name: 'John Doe'       ✅
```

### After Fix:
```sql
-- In users table
first_name: 'John'     ✅
last_name: 'Doe'       ✅

-- In customers table
first_name: 'John'     ✅
last_name: 'Doe'       ✅
name: 'John Doe'       ✅
```

---

## 🧪 Testing

### Test 1: New User Registration
1. Register a new user with:
   - First Name: `Max`
   - Last Name: `Mule`
   - Email: `test@example.com`

2. Check database:
```sql
-- Check users table
SELECT first_name, last_name FROM users WHERE email = 'test@example.com';
-- Expected: first_name='Max', last_name='Mule' ✅

-- Check customers table
SELECT first_name, last_name, name FROM customers WHERE email = 'test@example.com';
-- Expected: first_name='Max', last_name='Mule', name='Max Mule' ✅
```

### Test 2: Existing Customer (POS to Loyalty)
1. In POS, create a customer with email `existing@example.com`
2. In Loyalty app, register with same email
3. Check database:
```sql
SELECT first_name, last_name, name, user_id 
FROM customers 
WHERE email = 'existing@example.com';
-- Expected: 
--   first_name='First' ✅
--   last_name='Last' ✅
--   name='First Last' ✅
--   user_id=<not null> ✅
```

---

## 📊 Data Availability

Now other processes can access:

| Field | Table | Use Case |
|-------|-------|----------|
| `first_name` | `customers` | Personalized emails, reports |
| `last_name` | `customers` | Formal communications, analytics |
| `name` | `customers` | Display name, receipts |
| `first_name` | `users` | Authentication, user profile |
| `last_name` | `users` | Authentication, user profile |

---

## 🔧 Why Keep All Three Fields?

**Why both `first_name`/`last_name` AND `name`?**

1. **`first_name` & `last_name`** - For:
   - Personalized greetings ("Hi Max!")
   - Formal communications ("Dear Mr. Mule")
   - Sorting/searching by last name
   - Analytics and reporting
   - External system integrations

2. **`name`** - For:
   - Quick display in UI
   - Receipts and invoices
   - Backward compatibility
   - When full format is needed

---

## 📁 Files Modified

- **`loyalty-app/src/app/api/auth/register/route.ts`** (Lines 96-148)
  - Updated `UPDATE customers` query to include `first_name` and `last_name`
  - Updated `INSERT INTO customers` query to include `first_name` and `last_name`
  - Adjusted parameter arrays for both queries

---

## 🔄 Registration Flow (Updated)

```
User submits registration form
       ↓
Validate input
       ↓
Create user in users table
  ├──→ first_name ✅
  ├──→ last_name ✅
  └──→ email ✅
       ↓
Check if customer exists
       ↓
   (if exists)
       ├──→ UPDATE customers
       ├──→ SET first_name ✅ (NEW!)
       ├──→ SET last_name ✅ (NEW!)
       ├──→ SET name ✅
       └──→ SET user_id ✅
       ↓
   (if new)
       ├──→ INSERT INTO customers
       ├──→ first_name ✅ (NEW!)
       ├──→ last_name ✅ (NEW!)
       ├──→ name ✅
       └──→ user_id ✅
              ↓
         Complete ✅
```

---

## 💡 Important Notes

1. **No Migration Needed**: Columns already exist in database
2. **Backward Compatible**: Still sets `name` field for existing code
3. **Consistent Data**: Both tables now have complete name information
4. **Future-Proof**: Supports processes that need separate name fields

---

## 🚨 For Existing Data

If you have existing customers with NULL `first_name`/`last_name`, you can backfill them:

```sql
-- Backfill first_name and last_name from name field
UPDATE customers
SET 
  first_name = SPLIT_PART(name, ' ', 1),
  last_name = SPLIT_PART(name, ' ', 2)
WHERE first_name IS NULL OR last_name IS NULL;

-- Or from linked users table
UPDATE customers c
SET 
  first_name = u.first_name,
  last_name = u.last_name
FROM users u
WHERE c.user_id = u.id
  AND (c.first_name IS NULL OR c.last_name IS NULL);
```

---

## 🚀 Summary

✅ **Fixed**: `first_name` and `last_name` now saved in `customers` table
✅ **Both Paths**: Works for new customers AND existing customer updates
✅ **Complete Data**: All name fields populated correctly
✅ **Process Ready**: Other processes can now access individual name fields

**The customers table now has complete name data for all processes! 🎉**

