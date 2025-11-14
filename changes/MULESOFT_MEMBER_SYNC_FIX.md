# MuleSoft Member Sync Fix

## 🐛 The Problem

The loyalty app registration was calling the MuleSoft API, but:
1. ❌ Used wrong system setting key (`integration_endpoint` instead of `mulesoft_loyalty_sync_endpoint`)
2. ❌ Only called API for **new customers**, not **existing customers** (POS → Loyalty flow)
3. ⚠️ Used `await` instead of fire-and-forget pattern (could slow down registration)

**User Request:**
> "check if when a member is created in pos is executing the mulesoft api ... if it is, call the same api, when the user registers in loyalty"

---

## 🔍 What the POS Does

When creating a customer in POS (`/api/customers/enhanced`), it:

1. ✅ Inserts customer into database
2. ✅ Gets `mulesoft_loyalty_sync_endpoint` from system settings
3. ✅ Calls `POST ${endpoint}/member/create` with member data
4. ✅ Uses **fire-and-forget** async pattern (doesn't block response)

### POS Code Pattern:
```javascript
// Get MuleSoft endpoint
const mulesoftEndpoint = await pool.query(
  "SELECT setting_value FROM system_settings WHERE setting_key = 'mulesoft_loyalty_sync_endpoint'"
);

// Prepare member data
const memberData = {
  id: result.rows[0].id,
  first_name: customerFirstName,
  last_name: customerLastName,
  name: customerName,
  loyalty_number: finalLoyaltyNumber,
  enrollment_date: finalEnrollmentDate,
  sf_loyalty_program_id: loyaltyProgramId,
  // ... other fields
};

// Fire-and-forget: trigger MuleSoft API call asynchronously
(async () => {
  try {
    const mulesoftResponse = await fetch(`${endpoint}/member/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData)
    });
    if (!mulesoftResponse.ok) {
      console.warn('MuleSoft API call failed:', mulesoftResponse.status);
    } else {
      console.log('Member successfully created in MuleSoft');
    }
  } catch (err) {
    console.warn('MuleSoft API call error:', err);
  }
})();
```

---

## ✅ The Fix

Updated loyalty app registration (`/loyalty-app/src/app/api/auth/register/route.ts`) to match POS behavior:

### Fix 1: Updated Setting Key

**Before:**
```typescript
const integrationEndpoint = await getSystemSetting('integration_endpoint'); // ❌ Wrong key
```

**After:**
```typescript
const mulesoftEndpoint = await getSystemSetting('mulesoft_loyalty_sync_endpoint'); // ✅ Correct key (same as POS)
```

---

### Fix 2: Added MuleSoft Sync for Existing Customers

**Before:**
```typescript
if (existingCustomer.rows.length > 0) {
  // Update existing customer with new user_id
  await query(`UPDATE customers SET ...`);
  
  //if customer exists, pull loyalty member from Loyalty cloud.
  // ❌ NO API CALL - just a TODO comment
}
```

**After:**
```typescript
if (existingCustomer.rows.length > 0) {
  // Update existing customer with new user_id
  await query(`UPDATE customers SET ...`);
  
  // ✅ Sync existing customer with MuleSoft Loyalty Cloud
  try {
    const mulesoftEndpoint = await getSystemSetting('mulesoft_loyalty_sync_endpoint');
    
    if (mulesoftEndpoint) {
      const customerSyncData = await query(/* get customer data */);
      const syncPayload = { /* customer data */ };
      
      // Fire-and-forget: trigger MuleSoft API call asynchronously
      (async () => {
        try {
          const syncResponse = await fetch(`${mulesoftEndpoint}/member/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(syncPayload),
          });
          
          if (syncResponse.ok) {
            console.log('✅ Existing customer successfully synced with MuleSoft');
          } else {
            console.error('❌ MuleSoft sync failed:', syncResponse.status);
          }
        } catch (err) {
          console.error('❌ MuleSoft sync error:', err);
        }
      })();
    }
  } catch (syncError) {
    console.error('Error syncing existing customer with MuleSoft:', syncError);
    // Don't fail the registration if sync fails
  }
}
```

---

### Fix 3: Updated Fire-and-Forget Pattern for New Customers

**Before:**
```typescript
// ❌ Used await - blocks registration response
const syncResponse = await fetch(`${integrationEndpoint}/member/create`, { /* ... */ });

if (syncResponse.ok) {
  console.log('User successfully synced with Loyalty Cloud');
} else {
  console.error('Failed to sync user with Loyalty Cloud');
}
```

**After:**
```typescript
// ✅ Fire-and-forget - doesn't block registration response
(async () => {
  try {
    const syncResponse = await fetch(`${mulesoftEndpoint}/member/create`, { /* ... */ });
    
    if (syncResponse.ok) {
      console.log('✅ New customer successfully synced with MuleSoft');
    } else {
      console.error('❌ MuleSoft sync failed:', syncResponse.status);
    }
  } catch (err) {
    console.error('❌ MuleSoft sync error:', err);
  }
})();
```

---

## 🎯 What This Fixes

### Before Fix:

| Scenario | Database | MuleSoft API Call |
|----------|----------|-------------------|
| **POS creates customer** | ✅ Inserted | ✅ Called (`mulesoft_loyalty_sync_endpoint`) |
| **Loyalty new user** | ✅ Inserted | ⚠️ Called (wrong endpoint: `integration_endpoint`) |
| **Loyalty existing user (POS→Loyalty)** | ✅ Updated | ❌ NOT called |

### After Fix:

| Scenario | Database | MuleSoft API Call |
|----------|----------|-------------------|
| **POS creates customer** | ✅ Inserted | ✅ Called (`mulesoft_loyalty_sync_endpoint`) |
| **Loyalty new user** | ✅ Inserted | ✅ Called (`mulesoft_loyalty_sync_endpoint`) ✅ |
| **Loyalty existing user (POS→Loyalty)** | ✅ Updated | ✅ Called (`mulesoft_loyalty_sync_endpoint`) ✅ |

---

## 🔧 MuleSoft API Endpoint

**URL:** `POST ${mulesoft_loyalty_sync_endpoint}/member/create`

**Payload:**
```json
{
  "id": 123,
  "first_name": "Max",
  "last_name": "Mule",
  "name": "Max Mule",
  "loyalty_number": "LM123456",
  "enrollment_date": "2025-11-13",
  "sf_loyalty_program_id": "program-id",
  "sf_id": "salesforce-id",
  "address_line1": "123 Main St",
  "address_line2": "Apt 4",
  "city": "San Francisco",
  "state": "CA",
  "zip_code": "94102",
  "phone": "+1234567890",
  "email": "max@mule.com",
  "date_of_birth": "1990-01-01"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Member created successfully"
}
```

---

## 🧪 Testing

### Test 1: New User Registration (Loyalty Only)
1. Register new user in loyalty app
2. Check console logs:
   ```
   Syncing new customer with MuleSoft
   Calling MuleSoft at: http://localhost:8081/member/create
   ✅ New customer successfully synced with MuleSoft
   ```
3. Verify MuleSoft received the payload

### Test 2: Existing Customer (POS → Loyalty)
1. Create customer in POS (e.g., `john@example.com`)
2. Register same email in loyalty app
3. Check console logs:
   ```
   ✅ Updating existing customer (ID: 456) with new user_id: 789
   Syncing existing customer with MuleSoft
   Calling MuleSoft at: http://localhost:8081/member/create
   ✅ Existing customer successfully synced with MuleSoft
   ```
4. Verify MuleSoft received the payload

### Test 3: MuleSoft Not Configured
1. Clear `mulesoft_loyalty_sync_endpoint` in system settings
2. Register a new user
3. **Expected:** Registration succeeds, no API call attempted (graceful fallback)

### Test 4: MuleSoft Down
1. Configure endpoint but stop MuleSoft
2. Register a new user
3. **Expected:** Registration succeeds, console shows sync error but doesn't block

---

## 📊 Fire-and-Forget Benefits

### Why Use Fire-and-Forget?

1. **Faster Registration** 
   - User gets response immediately
   - MuleSoft call happens in background

2. **Better UX**
   - Registration doesn't wait for MuleSoft
   - User sees success right away

3. **Resilient**
   - MuleSoft errors don't block registration
   - Customer still gets created locally

### Response Time Comparison:

**Before (await):**
```
Registration Request → Create User → Create Customer → WAIT for MuleSoft → Response
Total: ~2-3 seconds (if MuleSoft is slow)
```

**After (fire-and-forget):**
```
Registration Request → Create User → Create Customer → Response
                                                     ↓ (async)
                                             MuleSoft API call
Total: ~500ms (MuleSoft happens in background)
```

---

## 🔍 System Setting

**Database:**
```sql
SELECT setting_key, setting_value 
FROM system_settings 
WHERE setting_key = 'mulesoft_loyalty_sync_endpoint';
```

**Expected:**
```
setting_key                      | setting_value
---------------------------------|----------------------------------
mulesoft_loyalty_sync_endpoint   | http://localhost:8081
```

**To Configure:**
```sql
UPDATE system_settings 
SET setting_value = 'http://localhost:8081'
WHERE setting_key = 'mulesoft_loyalty_sync_endpoint';
```

Or via POS → Settings → System Settings → `mulesoft_loyalty_sync_endpoint`

---

## 📁 Files Modified

- **`loyalty-app/src/app/api/auth/register/route.ts`** (Lines 124-308)
  - Added MuleSoft sync for existing customers (lines 124-204)
  - Updated setting key from `integration_endpoint` to `mulesoft_loyalty_sync_endpoint`
  - Changed to fire-and-forget pattern for both paths
  - Added detailed logging

---

## 🔄 Registration Flow (Updated)

### New User Flow:
```
User submits registration
       ↓
Create user in users table ✅
       ↓
Create customer in customers table ✅
       ↓
Get mulesoft_loyalty_sync_endpoint ✅
       ↓
   (if configured)
       ├──→ Trigger async MuleSoft API call ✅
       │    (fire-and-forget, doesn't block)
       ↓
Log registration activity ✅
       ↓
Generate JWT token ✅
       ↓
Set auth cookie ✅
       ↓
Return success response to user ✅
```

### Existing Customer Flow (POS → Loyalty):
```
User submits registration
       ↓
User already exists? ❌ (first time in loyalty app)
Customer email exists? ✅ (created in POS)
       ↓
Create user in users table ✅
       ↓
Update customer: link user_id ✅
       ↓
Get mulesoft_loyalty_sync_endpoint ✅
       ↓
   (if configured)
       ├──→ Trigger async MuleSoft API call ✅ (NEW!)
       │    (fire-and-forget, doesn't block)
       ↓
Log registration activity ✅
       ↓
Generate JWT token ✅
       ↓
Set auth cookie ✅
       ↓
Return success response to user ✅
```

---

## 💡 Important Notes

1. **Both Paths Covered**: MuleSoft API is now called for both new customers AND existing customers
2. **Consistent with POS**: Uses same setting key and fire-and-forget pattern
3. **Non-Blocking**: Registration doesn't wait for MuleSoft response
4. **Resilient**: MuleSoft errors don't block registration
5. **Same Endpoint**: Both POS and Loyalty use `/member/create` endpoint

---

## 🚨 Troubleshooting

### MuleSoft Sync Not Happening?

1. **Check setting is configured:**
   ```sql
   SELECT setting_value FROM system_settings 
   WHERE setting_key = 'mulesoft_loyalty_sync_endpoint';
   ```

2. **Check console logs:**
   - Should see: `Calling MuleSoft at: http://localhost:8081/member/create`
   - If not, setting might be empty

3. **Check MuleSoft is running:**
   ```bash
   curl http://localhost:8081/api/health
   ```

4. **Check MuleSoft logs for errors**

### Registration Slow?

- Should be fast (fire-and-forget)
- If slow, MuleSoft sync isn't blocking
- Look for other causes (database, network)

---

## 🚀 Summary

✅ **Fixed**: Loyalty app now uses correct MuleSoft setting (`mulesoft_loyalty_sync_endpoint`)
✅ **Complete**: MuleSoft API called for both new AND existing customers
✅ **Consistent**: Same fire-and-forget pattern as POS
✅ **Fast**: Registration doesn't wait for MuleSoft
✅ **Resilient**: MuleSoft errors don't block registration

**POS and Loyalty app now have identical MuleSoft sync behavior! 🎉**

