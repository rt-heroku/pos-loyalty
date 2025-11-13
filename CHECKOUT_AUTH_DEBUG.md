# Checkout Authentication Debugging Guide 🔍

## Step-by-Step Debugging

I've added extensive logging to help us figure out what's happening. Follow these steps:

---

## Step 1: Restart Dev Server

```bash
cd loyalty-app
# Stop the server (Ctrl+C)
npm run dev
```

**Why?** The code changes need to be compiled.

---

## Step 2: Open Browser Console

1. Go to your shop page: `http://localhost:3000/loyalty/shop`
2. Press **F12** or **Right Click → Inspect**
3. Click the **Console** tab
4. Clear the console (trash icon)

---

## Step 3: Check What's in localStorage

In the browser console, run these commands:

```javascript
// Check if user data exists
localStorage.getItem('user')

// Check if token exists
localStorage.getItem('token')

// See all localStorage keys
Object.keys(localStorage)
```

**Copy the output and send it to me!**

Expected output should look like:
```
'{"id":123,"name":"John Doe","email":"john@example.com"}'
```

---

## Step 4: Try Checkout

1. Add items to cart
2. Click the checkout button
3. **Watch the console** - you should see logs like:

### Expected Logs:

```
[Auth] Checking authentication...
[Auth] User data exists: true
[Auth] Parsed user: {id: 123, name: "John Doe", ...}
[Auth] ✅ User is authenticated
```

Then when clicking checkout:

```
[Checkout] Raw user data from localStorage: {"id":123,"name":"John Doe",...}
[Checkout] Parsed user object: {id: 123, name: "John Doe", ...}
[Checkout] User has id? true
[Checkout] User.id value: 123
[Checkout] ✅ User is authenticated
[Checkout] 🚀 Navigating to checkout (authenticated)
```

### If Something's Wrong:

You might see:
```
[Auth] ❌ No user data in localStorage
OR
[Checkout] ❌ User object missing id field
OR
[Checkout] 🚀 Navigating to checkout (guest mode)
```

---

## Step 5: On Checkout Page

Once on checkout page, look for these logs:

```
[Checkout] Loading checkout data...
[Checkout] isGuest param: false
[Checkout] Not guest mode, loading user data...
[Checkout] Raw user data: {"id":123,...}
[Checkout] Parsed user: {id: 123, name: "John Doe", ...}
[Checkout] User ID field check - id: 123, user_id: undefined, userId: undefined
[Checkout] Using user ID: 123
[Checkout] Fetching profile from: http://localhost:3000/loyalty/api/customers/profile?user_id=123
[Checkout] Profile response status: 200
[Checkout] Profile data received: {...}
[Checkout] Setting name: John Doe
[Checkout] Setting phone: 5551234567
[Checkout] Setting email: john@example.com
```

---

## Common Issues & Solutions

### Issue 1: No User Data in localStorage

**Symptoms:**
```
[Auth] ❌ No user data in localStorage
```

**Solution:**
You need to log in first! Go to `/loyalty/login` and sign in.

---

### Issue 2: User Data Format is Wrong

**Symptoms:**
```
[Checkout] User ID field check - id: undefined, user_id: undefined, userId: undefined
```

**What to check:**
The user object in localStorage should have ONE of these fields:
- `id`
- `user_id`
- `userId`

**Run this in console:**
```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('User object:', user);
console.log('Has id?', user.id);
console.log('Has user_id?', user.user_id);
console.log('Has userId?', user.userId);
```

---

### Issue 3: User Data is Stale

**Symptoms:**
You logged in but still seeing guest mode.

**Solution:**
```javascript
// In console, clear localStorage and log in again
localStorage.clear();
// Then go to /loyalty/login and sign in
```

---

### Issue 4: Profile API Failing

**Symptoms:**
```
[Checkout] Profile response status: 404
OR
[Checkout] Profile response status: 500
```

**Check:**
1. Is the API running? Check Network tab
2. Is the user_id correct?
3. Does the customer exist in database?

**Test API manually:**
```bash
# In console or Postman
curl http://localhost:3000/loyalty/api/customers/profile?user_id=123
```

---

## What to Send Me

Please copy and send:

1. **localStorage contents:**
   ```javascript
   localStorage.getItem('user')
   ```

2. **Console logs** when clicking checkout

3. **Console logs** on checkout page

4. **The URL** you see (does it have `?guest=true`?)

5. **Network tab** - any failed requests?

---

## Quick Test Commands

Run these in browser console:

```javascript
// 1. Check user data
console.log('User:', localStorage.getItem('user'));

// 2. Parse and check ID
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('User ID:', user.id || user.user_id || user.userId);

// 3. Manually set test user (for debugging)
localStorage.setItem('user', JSON.stringify({
  id: 123,
  name: 'Test User',
  email: 'test@example.com'
}));

// 4. Reload page
location.reload();
```

---

## What I Changed

### Enhanced Logging:
- ✅ Shows raw localStorage data
- ✅ Shows parsed user object
- ✅ Shows which ID field is being used
- ✅ Shows authentication decision
- ✅ Shows navigation target

### Flexible ID Check:
Now checks for `id`, `user_id`, OR `userId` (different auth systems use different field names)

### Better Error Messages:
Clear emojis and messages:
- ✅ = Success
- ❌ = Error/Not found
- 🚀 = Navigation

---

## Expected Behavior

### When Authenticated:
1. Shop page loads
2. Console shows: `[Auth] ✅ User is authenticated`
3. Click checkout
4. Console shows: `[Checkout] ✅ User is authenticated`
5. URL: `/loyalty/shop/checkout` (NO `?guest=true`)
6. Form fields auto-filled

### When Guest:
1. Shop page loads
2. Console shows: `[Auth] ❌ No user data in localStorage`
3. Click checkout
4. Console shows: `[Checkout] 🚀 Navigating to checkout (guest mode)`
5. URL: `/loyalty/shop/checkout?guest=true`
6. Form fields empty

---

**Let's debug together!** Send me the console logs and localStorage contents! 🔍

