# MuleSoft Promotions Sync Implementation

## Summary
Added async (fire-and-forget) calls to MuleSoft APIs:

### Promotions Sync - `GET /loyalty/members/{id}/promotions`
1. User clicks a customer in POS (opens Customer 360 modal)
2. User loads the `/loyalty` page

### Member Pull - `GET /members/pull/{sfId}`
1. User clicks a customer in POS (opens Customer 360 modal) - existing
2. User loads `/loyalty/loyalty` or `/loyalty/dashboard` pages - existing
3. **NEW**: User clicks "Refresh All Data" in Customer 360 Sync tab

## Changes Made

### 1. Backend - `server.js`

#### New Helper Function (line ~2299)
```javascript
async function syncMemberPromotionsFromMulesoft(customerId)
```
- Fetches promotions from MuleSoft endpoint: `${mulesoftEndpoint}/loyalty/members/${customerId}/promotions`
- Uses customer ID (not user ID or sf_id)
- Logs success/errors but continues execution (fire-and-forget)
- Gets MuleSoft endpoint from `system_settings` table

#### New API Endpoint (line ~5005)
```javascript
POST /api/mulesoft/members/promotions/sync?customer_id={customer_id}
```
- Triggers the async promotions sync
- Returns immediately without waiting for MuleSoft response
- Required query param: `customer_id`

### 2. POS Customer Modal - `public/components/modals/Customer360Modal.js`

**Location**: Line ~45-49 (Modal Opens) & Line ~607-611 (Refresh Button)

**What it does**: 

#### A) When the Customer 360 modal opens:
1. Member pull from MuleSoft (existing - if `sf_id` exists)
2. **NEW**: Promotions sync from MuleSoft (if `customer.id` exists)

```javascript
// Trigger async promotions sync from MuleSoft (fire-and-forget)
if (customer.id) {
    fetch(`/api/mulesoft/members/promotions/sync?customer_id=${customer.id}`, {
        method: 'POST'
    }).catch(err => console.log('Promotions sync triggered (async)'));
}
```

#### B) When user clicks "Refresh All Data" in Sync tab:
**NEW**: Triggers member pull from MuleSoft (if `sf_id` exists)

```javascript
// Trigger async member pull from MuleSoft if sf_id exists (fire-and-forget)
if (customer.sf_id) {
    fetch(`/api/mulesoft/members/pull?sf_id=${customer.sf_id}`, {
        method: 'POST'
    }).catch(err => console.log('Member pull triggered on refresh (async)'));
}
```

### 3. Loyalty Page - `loyalty-app/src/app/loyalty/page.tsx`

**Location**: Line ~199-205

**What it does**: When loading promotions data on the `/loyalty` page, it triggers:
1. **NEW**: Async promotions sync from MuleSoft (if `user.id` exists)
2. Fetches local promotions from database (existing)

```typescript
// Trigger async promotions sync from MuleSoft (fire-and-forget)
if (user?.id) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  fetch(`${backendUrl}/api/mulesoft/members/promotions/sync?customer_id=${user.id}`, {
    method: 'POST'
  }).catch(err => console.log('[Loyalty] Promotions sync triggered (async)'));
}
```

## Key Features

✅ **Fire-and-Forget**: All MuleSoft calls are async and don't block user experience
✅ **Error Handling**: Errors are logged but don't prevent page loading
✅ **Customer ID**: Uses `customer_id` (database primary key), not `user_id` or `sf_id`
✅ **Configuration**: Reads MuleSoft endpoint from `system_settings` table
✅ **Authorization**: Includes Bearer token from `MULESOFT_ACCESS_TOKEN` env variable

## Endpoints Overview

| MuleSoft Endpoint | Triggered By | Parameter Used |
|-------------------|--------------|----------------|
| `GET /loyalty/members/{customer_id}/promotions` | POS customer click (modal opens) | `customer.id` |
| `GET /loyalty/members/{customer_id}/promotions` | `/loyalty` page load | `user.id` |
| `GET /members/pull/{sf_id}` | POS customer click (modal opens) | `customer.sf_id` |
| `GET /members/pull/{sf_id}` | `/loyalty/loyalty` or `/loyalty/dashboard` page load | `user.sf_id` |
| `GET /members/pull/{sf_id}` | **NEW**: Refresh button in Customer 360 Sync tab | `customer.sf_id` |

## Testing

To test:
1. Open POS (`/pos`) → Click on any customer → Check browser console for "Promotions sync triggered"
2. Navigate to `/loyalty` page → Check browser console for "Promotions sync triggered"
3. Check server logs for MuleSoft sync status messages

## Notes

- All errors are caught and logged but don't affect the user experience
- The actual promotions data displayed still comes from the local database
- MuleSoft sync happens in the background to keep data fresh
- No UI changes were made (as per user request to add `tier_points` UI later)

