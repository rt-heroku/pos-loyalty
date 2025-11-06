# API Error Fix - "Unexpected token '<'" 

## Error Description

```
API call failed: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
Failed to load generated history: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## What This Error Means

This error occurs when:
1. The frontend expects JSON from an API
2. But receives HTML instead (usually a 404 error page or redirect)
3. The browser tries to parse the HTML as JSON and fails

## Root Cause

The error "Failed to load generated history" indicates the **POS app** is trying to call `/api/generated-products/history` but:
- If you're accessing the app from the wrong URL
- Or if there's a routing issue
- The API call might be going to the wrong endpoint

## Which App Are You In?

### POS App
- URL: `http://localhost:3000/pos` or `http://localhost:3000/pos/`
- Uses vanilla JavaScript
- Has "Data Management" with "Generated History" feature

### Loyalty App  
- URL: `http://localhost:3000/loyalty` or `http://localhost:3000/loyalty/`
- Uses Next.js/React
- Errors show in `hook.js` (React hooks)

**The error `hook.js:608` suggests you're in the Loyalty app, but "generated history" is a POS app feature!**

## Possible Scenarios

### Scenario 1: You're in POS app but accessing from wrong URL

**Problem**: Accessing POS from root `/` instead of `/pos`

**Solution**: Make sure you access POS app from:
```
http://localhost:3000/pos
```

### Scenario 2: API endpoint doesn't exist

**Problem**: The `/api/generated-products/history` endpoint might not be working

**Solution**: Test the endpoint directly:
```bash
curl http://localhost:3000/api/generated-products/history
```

Expected response: JSON with history data
Actual if broken: HTML 404 page

### Scenario 3: Mixed app context

**Problem**: You have both apps open and errors are mixing

**Solution**: 
1. Close all browser tabs
2. Open only one app at a time
3. Clear browser cache: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

## Debugging Steps

### Step 1: Identify Which App You're In

Open browser console and run:
```javascript
console.log(window.location.href);
```

- If it contains `/pos` → You're in POS app
- If it contains `/loyalty` → You're in Loyalty app
- If it's just `/` → You're on landing page

### Step 2: Check Network Tab

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Click "Data Management" again
4. Look for failed requests (red)
5. Click on the failed request
6. Check the "Response" tab

**If you see HTML** (starting with `<!DOCTYPE`):
- The endpoint doesn't exist or is returning an error page
- Check the Request URL - is it correct?

**If you see JSON**:
- The endpoint works, but there's a parsing issue in the frontend

### Step 3: Verify Server is Running

```bash
# Check if Express server is running
curl http://localhost:3000/api/health

# Check if Next.js server is running  
curl http://localhost:3001/api/health
```

### Step 4: Check API Routes

For POS app (`/api/*`):
```bash
# Test generated products history
curl http://localhost:3000/api/generated-products/history

# Test system settings
curl http://localhost:3000/api/system-settings
```

For Loyalty app (`/loyalty/api/*`):
```bash
# Test customer profile
curl http://localhost:3000/loyalty/api/customers/profile

# Test system settings
curl http://localhost:3000/loyalty/api/system-settings
```

## Quick Fixes

### Fix 1: Clear Browser Cache

```
Chrome: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
Firefox: Cmd+Shift+R (Mac) or Ctrl+F5 (Windows)
```

### Fix 2: Restart Both Servers

```bash
# Kill existing processes
pkill -f "node server.js"
pkill -f "next dev"

# Start Express server (POS)
cd /Users/rodrigo.torres/mulesoft-work/unified-pos-loyalty
node server.js &

# Start Next.js server (Loyalty)
cd /Users/rodrigo.torres/mulesoft-work/unified-pos-loyalty/loyalty-app
npm run dev &
```

### Fix 3: Check Console for Actual URL Being Called

In browser console, before clicking "Data Management":
```javascript
// Intercept fetch calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
    console.log('Fetch called:', args[0]);
    return originalFetch.apply(this, arguments);
};
```

Then click "Data Management" and see what URL is being called.

## Expected Behavior

### POS App - Data Management
When you click "Data Management" → "Show Generated History":
1. Should call: `GET /api/generated-products/history`
2. Should receive: JSON array of batches
3. Should display: Modal with list of generated product batches

### Loyalty App - Data Management  
When you click "Export Data":
1. Should show: Success toast message
2. No API call (it's a placeholder)

## If Problem Persists

1. **Check which app you're actually in**:
   - Look at the URL bar
   - Look at the page design (POS is different from Loyalty)

2. **Provide more details**:
   - What URL are you accessing?
   - What's the full error message?
   - What does the Network tab show?
   - Screenshot of the browser console

3. **Try accessing the correct app directly**:
   - POS: `http://localhost:3000/pos`
   - Loyalty: `http://localhost:3000/loyalty`

## Common Mistakes

❌ **Accessing POS from root** `/` instead of `/pos`
❌ **Having old service workers** cached
❌ **Mixed tabs** - POS and Loyalty open simultaneously
❌ **Wrong server** - Only Express running, not Next.js (or vice versa)

✅ **Access POS from** `/pos`
✅ **Access Loyalty from** `/loyalty`
✅ **Clear cache** before testing
✅ **Both servers running** (Express on 3000, Next.js on 3001)


