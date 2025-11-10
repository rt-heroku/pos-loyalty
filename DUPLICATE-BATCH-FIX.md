# Duplicate Batch Issue - Investigation & Fix

## Problem Reported

When generating products with AI via MuleSoft API:
- **Batch records are duplicated** (e.g., Batch 28 and Batch 29)
- **Batch 29 has empty `prompt` and `raw_response`** fields
- **Both batches contain the same 3 products**
- **Expected:** Only Batch 28 should exist

## Root Causes Found

### 1. Missing Fields in Database Save ❌

**Problem:** The server endpoint wasn't saving `prompt` and `raw_response` fields.

**Before:**
```javascript
// server.js - Line 1084
INSERT INTO generated_products (batch, brand, segment, num_of_products, generated_product) 
VALUES ($1, $2, $3, $4, $5)
```

**After:**
```javascript
// server.js - Line 1094
INSERT INTO generated_products (batch, brand, segment, num_of_products, generated_product, prompt, raw_response) 
VALUES ($1, $2, $3, $4, $5, $6, $7)
```

### 2. Client Not Sending Prompt/Response ❌

**Problem:** The client code wasn't extracting or sending `prompt` and `raw_response` from the MuleSoft API response.

**Before:**
```javascript
const productsData = await response.json();
await window.API.call('/generated-products/save', {
    method: 'POST',
    body: JSON.stringify({
        batchId: batchId,
        products: productsData,  // ❌ No prompt or rawResponse
        metadata: { ... }
    })
});
```

**After:**
```javascript
const apiResponse = await response.json();
const productsData = Array.isArray(apiResponse) ? apiResponse : (apiResponse.products || apiResponse);
const promptText = apiResponse.prompt || `Generate ${n} ${segment} products for ${brand}`;
const rawResponseText = typeof apiResponse === 'string' ? apiResponse : JSON.stringify(apiResponse);

await window.API.call('/generated-products/save', {
    method: 'POST',
    body: JSON.stringify({
        batchId: batchId,
        products: productsData,
        prompt: promptText,          // ✅ Now included
        rawResponse: rawResponseText, // ✅ Now included
        metadata: { ... }
    })
});
```

## Duplicate Batch Investigation

### Possible Causes

1. **Double API Call** - User might be clicking "Generate" button twice
2. **Race Condition** - Multiple concurrent requests getting same batch number
3. **Browser Back/Forward** - Page refresh causing re-submission
4. **Network Retry** - Failed request being retried automatically

### Added Logging to Debug

#### Server-Side Logging (server.js)
```javascript
console.log('📦 Saving generated products:', {
  batchId,
  productCount: products?.length,
  hasPrompt: !!prompt,
  hasRawResponse: !!rawResponse,
  metadata
});

console.log('✅ Got batch number from function:', batchNumber);
console.log(`✅ Saved ${products.length} products to batch ${batchNumber}`);
```

#### Client-Side Logging (SettingsView.js)
```javascript
console.log('📦 MuleSoft API Response:', apiResponse);

console.log('💾 Saving to database:', {
    batchId,
    productCount: productsData.length,
    hasPrompt: !!promptText,
    hasRawResponse: !!rawResponseText
});
```

### How to Debug

1. **Open Browser Console** (F12)
2. **Generate products** via AI
3. **Watch for logs:**
   ```
   📦 MuleSoft API Response: { ... }
   💾 Saving to database: { ... }
   ```
4. **Check server logs** on Heroku:
   ```bash
   heroku logs --tail -a rt-pos-loyalty
   ```
5. **Look for:**
   - Multiple "📦 Saving generated products" logs for same generation
   - Different batch numbers being assigned
   - Timing between requests

### Expected Log Flow (Single Batch)

```
Client:
📦 MuleSoft API Response: [{ product1 }, { product2 }, { product3 }]
💾 Saving to database: { batchId: "batch_...", productCount: 3, hasPrompt: true, hasRawResponse: true }

Server:
📦 Saving generated products: { batchId: "batch_...", productCount: 3, hasPrompt: true, hasRawResponse: true, metadata: {...} }
✅ Got batch number from function: 28
✅ Saved 3 products to batch 28
```

### Suspicious Log Flow (Duplicate Batch)

```
Client:
📦 MuleSoft API Response: [{ product1 }, { product2 }, { product3 }]
💾 Saving to database: { ... }
💾 Saving to database: { ... }  ⚠️ DUPLICATE!

Server:
📦 Saving generated products: { ... }
✅ Got batch number from function: 28
✅ Saved 3 products to batch 28
📦 Saving generated products: { ... }  ⚠️ DUPLICATE!
✅ Got batch number from function: 29
✅ Saved 3 products to batch 29
```

## Fixes Applied

### 1. Server Endpoint (server.js)

✅ Added `prompt` and `raw_response` to INSERT statement
✅ Added comprehensive logging
✅ Log batch number source (function vs MAX)
✅ Log product count and field presence

### 2. Client Code (SettingsView.js)

✅ Extract `prompt` from API response
✅ Extract `raw_response` from API response
✅ Fallback to constructed prompt if not provided
✅ Added logging for API response structure
✅ Added logging for save payload

## Database Schema

```sql
CREATE TABLE generated_products (
    id SERIAL PRIMARY KEY,
    batch INTEGER,
    brand VARCHAR(100),
    segment VARCHAR(100),
    num_of_products INTEGER,
    generated_product JSON,
    prompt TEXT,              -- ✅ Now populated
    raw_response TEXT,        -- ✅ Now populated
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Testing Instructions

### 1. Test Prompt/Response Saving

```bash
# 1. Generate products via AI
# 2. Check database:
psql $DATABASE_URL -c "SELECT batch, brand, segment, num_of_products, 
  LENGTH(prompt) as prompt_len, 
  LENGTH(raw_response) as response_len, 
  created_at 
FROM generated_products 
ORDER BY created_at DESC 
LIMIT 10;"

# Expected: prompt_len and response_len should be > 0
```

### 2. Test for Duplicates

```bash
# 1. Open browser console (F12)
# 2. Generate products
# 3. Watch for duplicate logs
# 4. Check database:
psql $DATABASE_URL -c "SELECT batch, COUNT(*) as product_count, 
  COUNT(DISTINCT generated_product) as unique_products,
  MAX(created_at) as created_at
FROM generated_products 
GROUP BY batch 
ORDER BY batch DESC 
LIMIT 10;"

# If duplicate batch exists:
# - product_count should be same for both batches
# - unique_products should be same
# - created_at will show time difference
```

### 3. Check Heroku Logs

```bash
# Watch logs in real-time
heroku logs --tail -a rt-pos-loyalty | grep "📦\|✅\|❌"

# Look for patterns:
# - Multiple save requests in quick succession
# - Same batchId appearing twice
# - Different batch numbers for same generation
```

## Potential Solutions for Duplicates

### If Double Click Issue:

```javascript
// Add button disable during generation
setLoadingProducts(true);  // ✅ Already implemented
// Button should be disabled while loading
```

### If Race Condition:

```javascript
// Use transaction to ensure atomic batch number generation
BEGIN;
SELECT get_next_batch_number();
INSERT INTO generated_products ...;
COMMIT;
```

### If Network Retry:

```javascript
// Add idempotency key
const idempotencyKey = `${batchId}_${Date.now()}`;
// Check if already saved before inserting
```

## Files Modified

1. ✅ `server.js`
   - Line 1064: Added `prompt` and `rawResponse` parameters
   - Line 1066-1072: Added logging
   - Line 1094: Updated INSERT to include prompt and raw_response
   - Line 1101-1102: Pass prompt and rawResponse to query

2. ✅ `public/components/views/SettingsView.js`
   - Line 833: Store full API response
   - Line 835: Log API response
   - Line 840-842: Extract prompt and rawResponse
   - Line 847-852: Log save payload
   - Line 859-860: Include prompt and rawResponse in save request

## Next Steps

1. **Deploy to Heroku** - Changes are committed and pushed
2. **Test generation** - Generate products and check logs
3. **Monitor for duplicates** - Watch console and server logs
4. **Check database** - Verify prompt and raw_response are populated
5. **Report findings** - Share logs if duplicates still occur

## Summary

**Fixed:**
- ✅ Prompt and raw_response now saved to database
- ✅ Client extracts data from MuleSoft API response
- ✅ Comprehensive logging added for debugging

**To Investigate:**
- ⏳ Why duplicate batches are created (needs log analysis)
- ⏳ Timing between duplicate requests
- ⏳ Source of duplicate calls (client or server)

**The logging will help identify the root cause of duplicates!** 🔍




