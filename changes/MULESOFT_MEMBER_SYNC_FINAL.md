# MuleSoft Member Sync - Final Implementation

## 🎯 Final Behavior

MuleSoft API (`POST /member/create`) is called ONLY when creating **NEW members**, not for existing customers.

---

## 📊 When MuleSoft API is Called

| Scenario | Database Action | MuleSoft API Call | Reason |
|----------|----------------|-------------------|--------|
| **POS creates customer** | ✅ Insert customer | ✅ **Called** | New member |
| **Loyalty new user** | ✅ Insert customer | ✅ **Called** | New member |
| **Loyalty existing customer (POS→Loyalty)** | ✅ Update customer (link user_id) | ❌ **Not called** | Already synced in POS |

---

## ✅ Implementation Details

### POS Customer Creation
**Endpoint:** `/api/customers/enhanced`

```javascript
// 1. Insert customer into database
const result = await pool.query(`INSERT INTO customers (...) VALUES (...)`);

// 2. Get MuleSoft endpoint
const mulesoftEndpoint = await pool.query(
  "SELECT setting_value FROM system_settings WHERE setting_key = 'mulesoft_loyalty_sync_endpoint'"
);

// 3. Call MuleSoft API (fire-and-forget)
if (mulesoftEndpoint.rows.length > 0) {
  (async () => {
    try {
      await fetch(`${endpoint}/member/create`, {
        method: 'POST',
        body: JSON.stringify(memberData)
      });
      console.log('✅ Member successfully created in MuleSoft');
    } catch (err) {
      console.warn('❌ MuleSoft API call error:', err);
    }
  })();
}
```

---

### Loyalty App Registration

#### Path 1: New Customer (First Time)
```typescript
// User doesn't exist in customers table
if (existingCustomer.rows.length === 0) {
  // 1. Create new customer record
  await query(`INSERT INTO customers (...) VALUES (...)`);
  
  // 2. Get MuleSoft endpoint
  const mulesoftEndpoint = await getSystemSetting('mulesoft_loyalty_sync_endpoint');
  
  // 3. Format dates to yyyy-MM-dd (same as POS)
  const formatDate = (date: any) => {
    if (!date) return null;
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return new Date(date).toISOString().split('T')[0];
  };
  
  // 4. Call MuleSoft API (fire-and-forget) ✅
  if (mulesoftEndpoint) {
    (async () => {
      try {
        const syncPayload = {
          ...customerData,
          enrollment_date: formatDate(customerData.enrollment_date),
          date_of_birth: formatDate(customerData.date_of_birth)
        };
        const syncResponse = await fetch(`${mulesoftEndpoint}/member/create`, {
          method: 'POST',
          body: JSON.stringify(syncPayload)
        });
        console.log('✅ New customer successfully synced with MuleSoft');
      } catch (err) {
        console.error('❌ MuleSoft sync error:', err);
      }
    })();
  }
}
```

#### Path 2: Existing Customer (POS → Loyalty)
```typescript
// User already exists in customers table (created in POS)
if (existingCustomer.rows.length > 0) {
  // 1. Update existing customer (link user_id)
  await query(`UPDATE customers SET user_id = $1, ... WHERE email = $2`);
  
  // 2. NO MuleSoft call ❌
  console.log('ℹ️  Existing customer - MuleSoft sync not needed (already synced when created in POS)');
}
```

---

## 🔍 Why Not Call MuleSoft for Existing Customers?

1. **Already Synced**: Customer was already synced to MuleSoft when created in POS
2. **Avoid Duplicates**: Calling again could create duplicate records
3. **Performance**: Unnecessary API call
4. **Idempotency**: MuleSoft `/member/create` might not be idempotent

---

## 🧪 Testing Scenarios

### Test 1: Create Customer in POS
```
1. Open POS → Loyalty tab
2. Add new customer:
   - Name: Max Mule
   - Email: max@example.com
   - Phone: +1234567890
3. Click "Add Customer"
```

**Expected Console Logs:**
```
Sending to Mulesoft endpoint http://localhost:8081/member/create to create member with data: {...}
MuleSoft API call triggered asynchronously
```

**MuleSoft Should Receive:**
```json
{
  "id": 123,
  "first_name": "Max",
  "last_name": "Mule",
  "loyalty_number": "LM001234",
  "enrollment_date": "2025-11-13",
  ...
}
```

---

### Test 2: Register NEW User in Loyalty App
```
1. Go to /register
2. Fill form:
   - First Name: Jane
   - Last Name: Doe
   - Email: jane@example.com (NEW email)
3. Submit
```

**Expected Console Logs:**
```
Creating new customer record
Syncing new customer with MuleSoft
Calling MuleSoft at: http://localhost:8081/member/create
✅ New customer successfully synced with MuleSoft
```

**MuleSoft Should Receive:**
```json
{
  "id": 124,
  "first_name": "Jane",
  "last_name": "Doe",
  "loyalty_number": "LM001235",
  "enrollment_date": "2025-11-13",
  ...
}
```

---

### Test 3: Register EXISTING Customer (POS → Loyalty)
```
1. First: Create customer in POS with email test@example.com
   (This calls MuleSoft ✅)
   
2. Then: Register in loyalty app with SAME email test@example.com
```

**Expected Console Logs:**
```
✅ Updating existing customer (ID: 125) with new user_id: 456
✅ Customer updated successfully: { id: 125, user_id: 456, email: 'test@example.com' }
ℹ️  Existing customer - MuleSoft sync not needed (already synced when created in POS)
```

**MuleSoft Should:**
- ❌ NOT receive any API call
- ✅ Already has this member from POS creation

---

## 📋 Summary Table

| Event | Customer State | Database | MuleSoft |
|-------|---------------|----------|----------|
| **POS: Add Customer** | NEW | ✅ INSERT | ✅ POST /member/create |
| **Loyalty: Register (new)** | NEW | ✅ INSERT | ✅ POST /member/create |
| **Loyalty: Register (existing)** | EXISTS | ✅ UPDATE (link user_id) | ❌ No call |

---

## 🔧 Configuration

**System Setting:**
```sql
SELECT setting_key, setting_value 
FROM system_settings 
WHERE setting_key = 'mulesoft_loyalty_sync_endpoint';
```

**Should Return:**
```
mulesoft_loyalty_sync_endpoint | http://localhost:8081
```

**To Configure:**
- Via SQL: `UPDATE system_settings SET setting_value = 'http://localhost:8081' WHERE setting_key = 'mulesoft_loyalty_sync_endpoint';`
- Via POS: Settings → System Settings → `mulesoft_loyalty_sync_endpoint`

---

## 📅 Date Formatting

Both POS and Loyalty App now format dates consistently as **`yyyy-MM-dd`** (date only, no time).

**Before (Loyalty App):**
```json
{
  "enrollment_date": "2025-11-13T05:00:00.000Z",
  "date_of_birth": "1990-05-15T00:00:00.000Z"
}
```

**After (Both POS and Loyalty):**
```json
{
  "enrollment_date": "2025-11-13",
  "date_of_birth": "1990-05-15"
}
```

**Implementation:**
```typescript
const formatDate = (date: any) => {
  if (!date) return null;
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  return new Date(date).toISOString().split('T')[0];
};
```

---

## 📁 Files Modified

- **`loyalty-app/src/app/api/auth/register/route.ts`**
  - Lines 118-123: Removed MuleSoft sync for existing customers
  - Lines 171-179: Added `formatDate` helper function
  - Line 187: Format `enrollment_date` to yyyy-MM-dd
  - Line 197: Format `date_of_birth` to yyyy-MM-dd
  - Lines 144-227: Updated setting key and fire-and-forget pattern for new customers

---

## 🎉 Final Result

✅ **POS**: Creates customer → Calls MuleSoft (with formatted dates)
✅ **Loyalty (new)**: Creates customer → Calls MuleSoft (with formatted dates)
✅ **Loyalty (existing)**: Updates customer → **No MuleSoft call** (already synced)

**This avoids duplicate API calls, formats dates consistently, and ensures each member is only synced once! 🚀**

