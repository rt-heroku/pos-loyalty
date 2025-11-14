# Checkout Authentication Fix ✅

## Problem

Customer information was not loading during checkout even when the user was signed in. The checkout URL had `?guest=true` parameter even for authenticated users.

### Symptoms:
- User is signed in
- URL shows: `/loyalty/shop/checkout?guest=true`
- Customer info fields (name, phone, email) are empty
- Have to manually enter information

---

## Root Causes

### Issue 1: Authentication Check Required Both Token AND User
```typescript
// OLD CODE (BROKEN)
const checkAuth = useCallback(() => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  if (token && userData) {  // ❌ Required BOTH
    setIsAuthenticated(true);
  }
}, []);
```

**Problem**: The app uses cookie-based authentication, so `token` may not be in localStorage. This caused `isAuthenticated` to always be `false`.

### Issue 2: No Re-check at Checkout Time
The authentication state was only checked on page load. If something changed or if the check failed, there was no retry at checkout time.

---

## Solutions Implemented

### Fix 1: Updated Authentication Check (`shop/page.tsx`)

```typescript
// NEW CODE (FIXED)
const checkAuth = useCallback(() => {
  const userData = localStorage.getItem('user');
  // Check if user data exists (token is optional as we use cookies)
  if (userData) {
    try {
      const user = JSON.parse(userData);
      // Verify it's a valid user object with an ID
      if (user && user.id) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      setIsAuthenticated(false);
    }
  } else {
    setIsAuthenticated(false);
  }
}, []);
```

**Changes:**
- ✅ Only requires `user` in localStorage (not `token`)
- ✅ Validates that user object has an `id`
- ✅ Proper error handling with try/catch
- ✅ Explicitly sets `false` when no user data

### Fix 2: Re-check Authentication at Checkout (`shop/page.tsx`)

```typescript
const handleCheckout = () => {
  if (cart.length === 0) return;
  
  // Store cart in session storage
  sessionStorage.setItem('checkout_cart', JSON.stringify(cart));
  
  // Store selected location for checkout
  if (selectedLocation) {
    sessionStorage.setItem('checkout_location', JSON.stringify(selectedLocation));
  }
  
  // Re-check authentication at checkout time (in case it changed)
  const userData = localStorage.getItem('user');
  let isUserAuthenticated = false;
  
  if (userData) {
    try {
      const user = JSON.parse(userData);
      if (user && user.id) {
        isUserAuthenticated = true;
      }
    } catch (error) {
      console.error('Error parsing user data at checkout:', error);
    }
  }
  
  // Navigate to checkout with or without guest parameter
  if (isUserAuthenticated) {
    console.log('[Checkout] User is authenticated, navigating without guest param');
    router.push('/shop/checkout');  // ✅ No ?guest=true
  } else {
    console.log('[Checkout] User is guest, navigating with guest param');
    router.push('/shop/checkout?guest=true');
  }
};
```

**Benefits:**
- ✅ Fresh authentication check right before checkout
- ✅ Doesn't rely on stale `isAuthenticated` state
- ✅ Console logs for debugging
- ✅ Correct URL based on actual auth state

### Fix 3: Enhanced Profile Loading (`checkout/page.tsx`)

```typescript
// Fetch full customer profile from API
try {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const basePath = '/loyalty';
  const profileUrl = `${origin}${basePath}/api/customers/profile?user_id=${parsedUser.id}`;
  console.log('[Checkout] Fetching profile from:', profileUrl);
  
  const profileRes = await fetch(profileUrl);
  console.log('[Checkout] Profile response status:', profileRes.status);
  
  if (profileRes.ok) {
    const profileData = await profileRes.json();
    console.log('[Checkout] Profile data received:', profileData);
    
    const profile = profileData.customer || profileData;
    
    // Pre-fill user information from profile
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    console.log('[Checkout] Setting name:', fullName);
    if (fullName) setGuestName(fullName);
    
    console.log('[Checkout] Setting phone:', profile.phone);
    if (profile.phone) setGuestPhone(profile.phone);
    
    console.log('[Checkout] Setting email:', profile.email);
    if (profile.email) setGuestEmail(profile.email);
    
    // Pre-fill delivery address if available
    if (profile.address_line1) {
      const fullAddress = `${profile.address_line1}${profile.address_line2 ? ', ' + profile.address_line2 : ''}`;
      console.log('[Checkout] Setting address:', fullAddress);
      setDeliveryAddress(fullAddress);
    }
  } else {
    console.error('[Checkout] Profile fetch failed:', await profileRes.text());
  }
} catch (error) {
  console.error('[Checkout] Error loading customer profile:', error);
}
```

**Improvements:**
- ✅ Handles both `profileData.customer` and direct `profileData` formats
- ✅ Comprehensive console logging for debugging
- ✅ Combines `address_line1` and `address_line2`
- ✅ Better error messages

---

## Testing

### Before Fix:
```
1. Sign in as customer
2. Go to shop
3. Add items to cart
4. Click checkout
5. URL: /loyalty/shop/checkout?guest=true ❌
6. Fields: Empty ❌
```

### After Fix:
```
1. Sign in as customer
2. Go to shop
3. Add items to cart
4. Click checkout
5. URL: /loyalty/shop/checkout ✅
6. Fields: Auto-filled with customer info ✅
```

### Debugging with Console Logs:

**Shop Page (when clicking checkout):**
```
[Checkout] User is authenticated, navigating without guest param
```

**Checkout Page (on load):**
```
[Checkout] Loading checkout data...
[Checkout] isGuest param: false
[Checkout] Not guest mode, loading user data...
[Checkout] User data exists: true
[Checkout] Parsed user: {id: 123, name: "John Doe", ...}
[Checkout] Fetching profile from: http://localhost:3000/loyalty/api/customers/profile?user_id=123
[Checkout] Profile response status: 200
[Checkout] Profile data received: {success: true, customer: {...}}
[Checkout] Setting name: John Doe
[Checkout] Setting phone: 5551234567
[Checkout] Setting email: john@example.com
[Checkout] Setting address: 123 Main St, Apt 4B
```

---

## Files Modified

### 1. `/loyalty-app/src/app/shop/page.tsx`
- Updated `checkAuth()` to only require `user` (not `token`)
- Added fresh authentication check in `handleCheckout()`
- Added console logging for debugging

### 2. `/loyalty-app/src/app/shop/checkout/page.tsx`
- Enhanced profile loading with better data extraction
- Added comprehensive console logging
- Handles multiple profile data formats
- Improved address concatenation

---

## Key Learnings

### Authentication in Next.js App Router:
1. **Cookies vs. LocalStorage**: The app uses HTTP-only cookies for security, so don't rely on `localStorage.getItem('token')`
2. **User Data**: Store minimal user info in localStorage for client-side auth checks
3. **Re-validation**: Always re-check auth state before critical operations (like checkout)

### Profile Data Structure:
```typescript
// API Response Format 1:
{
  success: true,
  customer: {
    id: 123,
    first_name: "John",
    last_name: "Doe",
    phone: "5551234567",
    email: "john@example.com",
    address_line1: "123 Main St",
    address_line2: "Apt 4B"
  }
}

// API Response Format 2:
{
  id: 123,
  first_name: "John",
  last_name: "Doe",
  ...
}

// Our code now handles both! ✅
const profile = profileData.customer || profileData;
```

---

## Troubleshooting

### If Customer Info Still Not Loading:

1. **Check localStorage**:
   ```javascript
   // In browser console:
   localStorage.getItem('user')
   // Should show: {"id":123,"name":"John Doe",...}
   ```

2. **Check Console Logs**:
   ```
   Look for:
   [Checkout] User is authenticated, navigating without guest param
   [Checkout] Profile data received: {...}
   ```

3. **Check URL**:
   ```
   Should be: /loyalty/shop/checkout
   NOT: /loyalty/shop/checkout?guest=true
   ```

4. **Check API Response**:
   ```
   Network tab → /api/customers/profile?user_id=123
   Should return 200 with customer data
   ```

5. **Verify Database**:
   ```sql
   SELECT * FROM customers WHERE id = 123;
   -- Should have first_name, last_name, phone, email
   ```

---

## Benefits

### For Customers:
✅ **Automatic info fill** - No re-entering details  
✅ **Faster checkout** - Pre-filled forms  
✅ **Better UX** - Seamless experience  

### For Developers:
✅ **Robust auth check** - Works with cookies  
✅ **Better debugging** - Console logs everywhere  
✅ **Flexible data handling** - Multiple formats supported  
✅ **Error resilience** - Try/catch blocks  

---

## Summary

**Problem**: Checkout always treated signed-in users as guests  
**Cause**: Auth check required non-existent `token` in localStorage  
**Solution**: Updated auth logic to work with cookies + added re-check at checkout  
**Result**: Customer info now auto-fills for authenticated users  

**Status**: ✅ FIXED

---

**Test it now!** Sign in, add items to cart, and check out. Your info should auto-fill! 🎉

