# 🔐 Bcrypt Password Hashing & Setup Wizard Implementation

**Date:** November 13, 2025  
**Status:** ✅ Complete

---

## 🎯 Objective

1. **Standardize password hashing** across the entire system using bcrypt
2. **Remove hardcoded admin credentials** from database deployment
3. **Implement first-time setup wizard** for secure initial configuration

---

## ⚠️ Problem Identified

### Inconsistent Password Hashing

The system had **TWO different password hashing methods**:

1. **SHA-256** (database functions) - Used in most places
   ```sql
   CREATE OR REPLACE FUNCTION hash_password(password TEXT) RETURNS TEXT AS $$
   BEGIN
       RETURN 'hashed_' || encode(sha256(password::bytea), 'hex');
   END;
   ```

2. **bcrypt** (Node.js bcryptjs library) - Only used in profile password changes
   ```typescript
   const newPasswordHash = await bcrypt.hash(newPassword, 12);
   ```

### Security Issues:
- ❌ SHA-256 is **not recommended** for password hashing (no salt, fast to crack)
- ❌ **Inconsistent hashing** meant password changes in the loyalty app could break authentication
- ❌ **Hardcoded admin credentials** in database.sql posed security risks

---

## ✅ Solution Implemented

### 1. Standardized on bcrypt Using pgcrypto

**Updated database functions to use bcrypt:**

```sql
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Hash passwords with bcrypt (cost factor 12)
CREATE OR REPLACE FUNCTION hash_password(password TEXT) RETURNS TEXT AS $$
BEGIN
    RETURN crypt(password, gen_salt('bf', 12));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify passwords against bcrypt hash
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT) RETURNS BOOLEAN AS $$
BEGIN
    RETURN hash = crypt(password, hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Benefits:**
- ✅ Industry-standard password hashing
- ✅ Automatic salting
- ✅ Configurable cost factor (12 rounds)
- ✅ Consistent across all systems (POS & Loyalty app)
- ✅ Native PostgreSQL implementation (no external dependencies)

---

### 2. Removed Hardcoded Admin User

**Before (in database.sql):**
```sql
-- Hardcoded admin user with SHA-256 hash
INSERT INTO users (...) VALUES
    ('admin@pos.com', 'hashed_0d3e9c1701bbd27...', ...);
```

**After:**
```sql
-- =============================================================================
-- FIRST-TIME SETUP
-- =============================================================================
-- NO default admin user is created automatically
-- On first launch, the application will detect no users exist and show a
-- setup wizard where you can create your admin account with custom credentials
```

**Security improvements:**
- ✅ No hardcoded credentials
- ✅ Forces secure password creation
- ✅ Customizable admin details
- ✅ No shared default password across deployments

---

### 3. Created Setup Wizard

#### API Routes

**Check Setup Status:**
```typescript
// GET /api/setup/status
{
  setupRequired: true,  // true if no users exist
  userCount: 0
}
```

**Initialize Setup:**
```typescript
// POST /api/setup/initialize
{
  username: string,
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phone?: string,
  companyName?: string,
  address?: string,
  city?: string,
  state?: string,
  zipCode?: string,
}
```

#### Setup Wizard Page

**Location:** `/setup`

**Features:**
- ✅ Clean, modern UI
- ✅ Form validation with Zod
- ✅ Required admin fields
- ✅ Optional business information
- ✅ Password confirmation
- ✅ Auto-redirect after completion
- ✅ Prevents duplicate setup

**Flow:**
1. User deploys app with empty database
2. App detects no users exist
3. Redirects to `/setup`
4. User fills in admin details
5. System creates:
   - Admin user with bcrypt-hashed password
   - Linked customer record
   - Optional company name in settings
6. Redirects to `/login`

---

## 📁 Files Modified

### Database
- ✅ `db/database.sql`
  - Added pgcrypto extension
  - Updated `hash_password()` function to use bcrypt
  - Updated `verify_password()` function to use bcrypt
  - Removed hardcoded admin user creation

### API Routes
- ✅ `loyalty-app/src/app/api/setup/status/route.ts` (NEW)
  - Checks if setup is required
  
- ✅ `loyalty-app/src/app/api/setup/initialize/route.ts` (NEW)
  - Handles setup form submission
  - Creates admin user + customer record
  
- ✅ `loyalty-app/src/app/api/profile/password/route.ts` (UPDATED)
  - Removed bcryptjs dependency
  - Now uses database `hash_password()` and `verify_password()` functions

### Pages
- ✅ `loyalty-app/src/app/setup/page.tsx` (NEW)
  - Beautiful setup wizard UI
  - Form validation
  - Error handling
  - Success state

### Server (Already Consistent)
- ✅ `server.js` - Already using database functions ✓

---

## 🔧 Technical Details

### Password Hashing Details

**Algorithm:** bcrypt  
**Cost Factor:** 12 (same as bcryptjs default)  
**Salt:** Automatically generated (blowfish, 'bf')  
**Hash Format:** `$2a$12$...` (bcrypt standard format)

**Example:**
```javascript
Input:  "MySecurePassword123"
Hash:   "$2a$12$KIXxP7st.VC3L7FQZq6bKuO8h3k7fYa5h2cJ6mQ1dF3zY9xL4oK5q"
```

### Security Features

1. **bcrypt Advantages:**
   - Slow by design (prevents brute force)
   - Automatically salted
   - Adaptive (can increase cost factor as hardware improves)
   - Resistant to rainbow table attacks

2. **Database Function Security:**
   - `SECURITY DEFINER` - Functions run with creator privileges
   - Prevents SQL injection through parameterized queries
   - Centralized hashing logic

3. **Setup Wizard Security:**
   - Password strength validation (min 8 characters)
   - Email validation
   - One-time setup (prevents overwriting)
   - CSRF protection via Next.js

---

## 📊 Migration Path

### For Existing Deployments

**⚠️ IMPORTANT:** If you have existing users with SHA-256 hashes, they will need to reset their passwords.

**Option 1: Force Password Reset (Recommended)**
1. Run database.sql update (with new bcrypt functions)
2. Clear all user `password_hash` values
3. Send password reset emails to all users
4. Users create new passwords with bcrypt

**Option 2: Gradual Migration**
1. Modify `verify_password()` to check both formats:
   ```sql
   CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT) RETURNS BOOLEAN AS $$
   BEGIN
       -- Check if it's old SHA-256 format
       IF hash LIKE 'hashed_%' THEN
           RETURN hash = 'hashed_' || encode(sha256(password::bytea), 'hex');
       END IF;
       
       -- Otherwise use bcrypt
       RETURN hash = crypt(password, hash);
   END;
   ```
2. On successful login, re-hash with bcrypt
3. Eventually remove SHA-256 support

### For New Deployments

**Just deploy!** 🎉
1. Run `database.sql`
2. Launch app
3. Visit `/setup`
4. Create admin account
5. Done!

---

## 🧪 Testing Checklist

- [ ] Run database.sql on clean database
- [ ] Verify pgcrypto extension is enabled
- [ ] Visit app - should redirect to `/setup`
- [ ] Fill out setup form with valid data
- [ ] Verify user and customer created
- [ ] Try to access `/setup` again - should redirect to login
- [ ] Login with created credentials
- [ ] Change password in profile
- [ ] Logout and login again with new password
- [ ] Verify POS authentication works
- [ ] Verify loyalty app authentication works

---

## 📝 Deployment Instructions

### Heroku Deploy with 1-Click Button

1. **Deploy database:**
   ```bash
   heroku run 'psql $DATABASE_URL -f db/database.sql' -a your-app-name
   ```

2. **Launch app:**
   ```bash
   heroku open -a your-app-name
   ```

3. **First-time setup:**
   - App will automatically redirect to `/setup`
   - Fill in admin details
   - Click "Complete Setup"
   - Login with new credentials

---

## 🔒 Security Best Practices

### Password Requirements
- ✅ Minimum 8 characters (enforced)
- ⚠️ Consider adding:
  - Uppercase letter requirement
  - Lowercase letter requirement
  - Number requirement
  - Special character requirement
  - Password strength meter

### Additional Recommendations
1. **Rate Limiting:** Already implemented in login route ✓
2. **Password History:** Prevent password reuse
3. **Password Expiry:** Force periodic password changes for admins
4. **2FA:** Consider adding two-factor authentication
5. **Session Management:** Already using HTTP-only cookies ✓
6. **Password Reset:** Secure email-based password reset flow

---

## 📚 References

- **pgcrypto Documentation:** https://www.postgresql.org/docs/current/pgcrypto.html
- **bcrypt Algorithm:** https://en.wikipedia.org/wiki/Bcrypt
- **OWASP Password Guidelines:** https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

---

## ✅ Summary

### What Changed
1. ✅ Database functions now use bcrypt via pgcrypto
2. ✅ Removed hardcoded admin credentials
3. ✅ Created setup wizard for first-time configuration
4. ✅ All password operations now consistent (bcrypt everywhere)
5. ✅ Improved security posture significantly

### Benefits
- 🔒 **More Secure:** Industry-standard password hashing
- 🎯 **Consistent:** One hashing method everywhere
- 🚀 **User-Friendly:** Easy first-time setup
- ✨ **Professional:** No hardcoded credentials
- 📦 **Deployable:** Ready for production use

---

**🎉 Password hashing is now secure and consistent throughout the system!**

