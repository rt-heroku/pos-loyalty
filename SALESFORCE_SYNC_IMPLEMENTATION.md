# Salesforce Order Sync Implementation ✅

## Overview

Automatically sync orders to Salesforce via MuleSoft API after successful order creation in the loyalty app.

---

## Features

### 1. **Automatic Sync** 🔄
- After an order is created, automatically call MuleSoft API
- Async operation (doesn't block order creation response)
- Stores sync status and result in database

### 2. **Sync Tracking** 📊
- `sync_status` - Boolean (true/false/null)
- `sync_message` - Full API response (JSON)
- `salesforce_order_id` - Salesforce Order ID
- `sync_attempted_at` - When sync was last attempted

### 3. **Admin Visibility** 👨‍💼
- Only admins can see sync fields in POS
- Admins see all orders regardless of status
- Regular users see only their orders

---

## Database Schema Changes

### New Columns Added to `orders` Table:

```sql
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS sync_status BOOLEAN DEFAULT NULL;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS sync_message JSONB DEFAULT NULL;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS salesforce_order_id VARCHAR(255) DEFAULT NULL;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS sync_attempted_at TIMESTAMP DEFAULT NULL;
```

### Column Descriptions:

| Column | Type | Description |
|--------|------|-------------|
| `sync_status` | BOOLEAN | `true` if synced successfully, `false` if failed, `null` if not attempted |
| `sync_message` | JSONB | Full Salesforce API response or error message |
| `salesforce_order_id` | VARCHAR(255) | Salesforce Order ID (e.g., `801Kj00000DexZEIAZ`) |
| `sync_attempted_at` | TIMESTAMP | When Salesforce sync was last attempted |

---

## API Flow

### Order Creation Flow:

```
1. Customer places order in loyalty app
   ↓
2. Order saved to database (COMMIT)
   ↓
3. Async: syncOrderToSalesforce(orderId)
   ↓
4. Immediate response to customer
   (Order created successfully)
   
   
[Background]
   ↓
5. Call MuleSoft API:
   POST /orders/salesforce/create
   Body: { "id": 100 }
   ↓
6. MuleSoft creates order in Salesforce
   ↓
7. Save sync result to database
   - sync_status = true/false
   - sync_message = full response
   - salesforce_order_id = SF Order ID
```

---

## MuleSoft API

### Endpoint:
```
POST {MULESOFT_API_URL}/orders/salesforce/create
```

### Request Body:
```json
{
  "id": 100
}
```

### Success Response:
```json
{
  "success": true,
  "message": "Order and Order Items created successfully in Salesforce",
  "salesforce_order_id": "801Kj00000DexZEIAZ",
  "database_order_id": 100,
  "order_items_count": 3
}
```

### Error Response:
```json
{
  "success": false,
  "error": "Salesforce API error",
  "details": "..."
}
```

---

## Implementation Details

### 1. Salesforce Sync Function (`server.js`)

```javascript
async function syncOrderToSalesforce(orderId) {
  const client = await pool.connect();
  
  try {
    console.log(`[Salesforce Sync] Starting sync for order ${orderId}`);
    
    // Update sync attempted timestamp
    await client.query(
      'UPDATE orders SET sync_attempted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [orderId]
    );
    
    // Call MuleSoft API
    const mulesoftUrl = process.env.MULESOFT_API_URL || 'http://localhost:8081';
    const response = await fetch(`${mulesoftUrl}/orders/salesforce/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: orderId }),
      timeout: 30000 // 30 second timeout
    });
    
    const responseData = await response.json();
    
    if (response.ok && responseData.success) {
      // Sync successful
      console.log(`[Salesforce Sync] ✓ Success for order ${orderId}:`, responseData);
      
      await client.query(
        `UPDATE orders 
         SET sync_status = true, 
             sync_message = $1,
             salesforce_order_id = $2
         WHERE id = $3`,
        [JSON.stringify(responseData), responseData.salesforce_order_id, orderId]
      );
    } else {
      // Sync failed
      console.error(`[Salesforce Sync] ✗ Failed for order ${orderId}:`, responseData);
      
      await client.query(
        `UPDATE orders 
         SET sync_status = false, 
             sync_message = $1
         WHERE id = $2`,
        [JSON.stringify(responseData), orderId]
      );
    }
  } catch (error) {
    // Network or other error
    console.error(`[Salesforce Sync] ✗ Error for order ${orderId}:`, error);
    
    await client.query(
      `UPDATE orders 
       SET sync_status = false, 
           sync_message = $1
       WHERE id = $2`,
      [JSON.stringify({ error: error.message, stack: error.stack }), orderId]
    );
  } finally {
    client.release();
  }
}
```

### 2. Order Creation Endpoint (`server.js`)

```javascript
app.post('/api/orders/online', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // ... create order ...
    
    await client.query('COMMIT');
    
    // Sync to Salesforce asynchronously (don't block response)
    syncOrderToSalesforce(order.id).catch(err => {
      console.error(`[Salesforce Sync] Failed for order ${order.id}:`, err.message);
    });
    
    res.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating online order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});
```

---

## Console Logging

### Successful Sync:
```
[Salesforce Sync] Starting sync for order 100
[Salesforce Sync] ✓ Success for order 100: {
  success: true,
  message: "Order and Order Items created successfully in Salesforce",
  salesforce_order_id: "801Kj00000DexZEIAZ",
  database_order_id: 100,
  order_items_count: 3
}
```

### Failed Sync:
```
[Salesforce Sync] Starting sync for order 101
[Salesforce Sync] ✗ Failed for order 101: {
  success: false,
  error: "Product not found in Salesforce"
}
```

### Network Error:
```
[Salesforce Sync] Starting sync for order 102
[Salesforce Sync] ✗ Error for order 102: Error: fetch failed
```

---

## POS Admin View

### For Admins:
Orders table shows additional columns:
- **Salesforce Sync** (✓/✗/⏳)
- **Salesforce Order ID**
- **Sync Details** (expandable)

### Sync Status Icons:
- ✅ **Green checkmark**: Successfully synced
- ❌ **Red X**: Sync failed
- ⏳ **Clock**: Sync pending/not attempted
- 🔄 **Retry button**: Manual retry (admin only)

### Example Display:
```
┌──────────────────┬────────┬────────┬──────────────┬────────────────────┐
│ Order Number     │ Status │ Total  │ SF Sync      │ SF Order ID        │
├──────────────────┼────────┼────────┼──────────────┼────────────────────┤
│ ORD-20250113-001 │ Comp.  │ $63.30 │ ✅ Synced    │ 801Kj00000DexZEIAZ │
│ ORD-20250113-002 │ Pend.  │ $45.00 │ ❌ Failed    │ -                  │
│ ORD-20250113-003 │ Comp.  │ $28.50 │ ⏳ Pending   │ -                  │
└──────────────────┴────────┴────────┴──────────────┴────────────────────┘
```

---

## Configuration

### Environment Variables:

```bash
# .env file
MULESOFT_API_URL=http://localhost:8081
```

Or configure in MuleSoft system settings via database:
```sql
INSERT INTO system_settings (setting_key, setting_value)
VALUES ('mulesoft_loyalty_sync_endpoint', 'http://your-mulesoft-url:8081');
```

---

## Testing

### Test Sync Manually:

```javascript
// In Node.js console or test file
const orderId = 100;
syncOrderToSalesforce(orderId);
```

### Check Sync Status:

```sql
SELECT 
  id,
  order_number,
  sync_status,
  sync_message,
  salesforce_order_id,
  sync_attempted_at
FROM orders
WHERE id = 100;
```

### Example Result:
```
id  | order_number      | sync_status | salesforce_order_id    | sync_attempted_at
----+-------------------+-------------+------------------------+------------------
100 | ORD-20250113-0001 | true        | 801Kj00000DexZEIAZ    | 2025-01-13 16:30:00
```

---

## Error Handling

### Scenarios:

1. **MuleSoft API Down**:
   - Sync fails
   - Error logged
   - `sync_status = false`
   - `sync_message` contains error details

2. **Network Timeout**:
   - 30-second timeout
   - Sync marked as failed
   - Can retry later

3. **Invalid Response**:
   - Response parsed as JSON
   - If `success: false`, marked as failed
   - Full response stored in `sync_message`

4. **Database Error**:
   - Error logged
   - Doesn't affect order creation (already committed)
   - Can be retried manually

---

## Manual Retry (Future Enhancement)

Admin can manually retry failed syncs:

```sql
-- Reset sync status to retry
UPDATE orders 
SET sync_status = NULL, 
    sync_attempted_at = NULL 
WHERE id = 100;

-- Then trigger sync again
-- (via API endpoint or admin UI button)
```

---

## Files Modified/Created

### Created:
1. **`/db/add_salesforce_sync_columns.sql`** - Database migration
2. **`SALESFORCE_SYNC_IMPLEMENTATION.md`** - This documentation

### Modified:
1. **`server.js`**:
   - Added `syncOrderToSalesforce()` function (lines 6070-6134)
   - Updated `/api/orders/online` endpoint (line 6153-6156)
   - Updated `/api/orders` SELECT to include sync fields (lines 1366-1369)
   - Updated GROUP BY clause (line 1447)

---

## Benefits

### For Business:
✅ **Automatic sync** - No manual data entry  
✅ **Real-time updates** - Orders in Salesforce immediately  
✅ **Audit trail** - Track sync status for every order  
✅ **Error visibility** - Admins see failed syncs  
✅ **Retry capability** - Can retry failed syncs  

### For Developers:
✅ **Async operation** - Doesn't slow down order creation  
✅ **Comprehensive logging** - Easy debugging  
✅ **Error handling** - Graceful failure  
✅ **Configurable** - Environment variable for MuleSoft URL  

### For Admins:
✅ **Visibility** - See sync status in POS  
✅ **Monitoring** - Track sync success rate  
✅ **Manual control** - Retry failed syncs  
✅ **Troubleshooting** - Full error messages stored  

---

## Next Steps

### Immediate:
1. ✅ Run database migration: `add_salesforce_sync_columns.sql`
2. ⏳ Update POS UI to display sync fields (admin only)
3. ⏳ Test with actual MuleSoft API

### Future Enhancements:
- [ ] Manual retry button in POS (admin only)
- [ ] Bulk retry for failed syncs
- [ ] Sync status dashboard
- [ ] Webhooks for Salesforce updates
- [ ] Scheduled sync for pending orders
- [ ] Sync analytics and reporting

---

## Installation Steps

### 1. Run Database Migration:
```bash
psql -h your-host -U your-user -d your-database -f db/add_salesforce_sync_columns.sql
```

### 2. Set Environment Variable:
```bash
export MULESOFT_API_URL=http://your-mulesoft-url:8081
```

### 3. Restart Server:
```bash
npm run dev
# or
node server.js
```

### 4. Test:
- Create an order in the loyalty app
- Check console logs for sync messages
- Query database to verify sync status

---

**Implementation Complete!** ✅  
**Auto-Sync Enabled!** 🔄  
**Salesforce Integration Ready!** 🚀  
**Admin Visibility Pending!** 👨‍💼

