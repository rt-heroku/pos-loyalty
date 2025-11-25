# MuleSoft Loyalty Tiers Background Sync

## Date: November 24, 2025

## Feature Overview

Added automatic background synchronization with MuleSoft loyalty tiers API when the LoyaltyView loads (Operations → Customers).

## Implementation

### Trigger Point
- **When**: User navigates to Operations → Customers
- **How**: The LoyaltyView loads and calls `GET /api/customers`
- **Action**: Backend makes an async call to MuleSoft `GET /loyalty/tiers`

### Non-Blocking Design
The MuleSoft tiers API call is **fire-and-forget**:
- ✅ Does not block the customer list response
- ✅ Does not affect UI loading
- ✅ Runs asynchronously in the background
- ✅ Logs success or error for monitoring
- ✅ Gracefully handles missing configuration

### Code Flow

```javascript
// 1. Client requests customers
GET /api/customers

// 2. Server responds immediately with customer list
res.json(result.rows);

// 3. Then triggers async sync (non-blocking)
syncMulesoftTiers();

// 4. Helper function syncs tiers
async function syncMulesoftTiers() {
  // Get MuleSoft endpoint from system_settings
  // Call GET /loyalty/tiers
  // Log success or error
}
```

## API Endpoint

### MuleSoft API Called
```
GET {mulesoft_endpoint}/loyalty/tiers
```

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {MULESOFT_ACCESS_TOKEN}`

**Response**: Not used, only logged

## Configuration

The MuleSoft endpoint is retrieved from `system_settings` table:
```sql
SELECT setting_value 
FROM system_settings 
WHERE setting_key = 'mulesoft_loyalty_sync_endpoint'
```

This is configured during the setup wizard or can be updated in settings.

## Logging

### Success Case
```
🔄 Syncing loyalty tiers from MuleSoft: https://example.com/loyalty/tiers
✅ Successfully synced loyalty tiers from MuleSoft: 4 tiers
```

### Error Cases

**Configuration Missing:**
```
⚠️  MuleSoft endpoint not configured, skipping tiers sync
```

**API Call Failed:**
```
❌ Failed to sync loyalty tiers from MuleSoft. Status: 500
```

**Network Error:**
```
❌ Error syncing loyalty tiers from MuleSoft: Connection timeout
```

## Benefits

1. **Automatic Sync**: Tiers are synced whenever loyalty view is accessed
2. **Non-Intrusive**: No impact on UI performance or loading times
3. **Simple Monitoring**: Easy to track in server logs
4. **Fail-Safe**: Errors don't affect customer management functionality
5. **Configuration-Aware**: Gracefully handles missing MuleSoft setup

## Testing Scenarios

### Scenario 1: MuleSoft Configured and Working
1. Navigate to Operations → Customers
2. Customer list loads normally
3. Server logs show: `✅ Successfully synced loyalty tiers from MuleSoft`

### Scenario 2: MuleSoft Not Configured
1. Navigate to Operations → Customers  
2. Customer list loads normally
3. Server logs show: `⚠️ MuleSoft endpoint not configured`

### Scenario 3: MuleSoft API Error
1. Navigate to Operations → Customers
2. Customer list loads normally (not affected)
3. Server logs show: `❌ Failed to sync loyalty tiers from MuleSoft`

### Scenario 4: Network Error
1. Navigate to Operations → Customers
2. Customer list loads normally
3. Server logs show: `❌ Error syncing loyalty tiers from MuleSoft: [error]`

## Files Modified

1. `/server.js`
   - Modified `GET /api/customers` endpoint (line ~2207)
   - Added `syncMulesoftTiers()` helper function (line ~2217)

## Related Endpoints

- `GET /api/customers` - Main customer list endpoint (triggers sync)
- `GET /loyalty/tiers` - MuleSoft API endpoint (external)

## Environment Variables

- `MULESOFT_ACCESS_TOKEN` - Optional bearer token for MuleSoft API authentication

## Future Enhancements

Potential improvements:
1. Cache tiers response to avoid repeated calls
2. Add throttling (e.g., only sync once per hour)
3. Store synced tiers in database for offline use
4. Add sync status indicator in UI
5. Manual sync button in settings
6. Webhook support for real-time updates

## Technical Notes

- Uses native `fetch` API for HTTP requests
- Async/await for clean error handling
- No external dependencies required
- Compatible with existing MuleSoft integration patterns
- Follows same authentication pattern as other MuleSoft calls

