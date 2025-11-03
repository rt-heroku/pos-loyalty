# Heroku Build Fix - Critical Changes

## Problem Summary

The Heroku build was failing with these errors:
1. ❌ `Cannot find module 'tailwindcss'`
2. ❌ `Module not found: Can't resolve '@/contexts/AuthContext'`
3. ❌ TypeScript compilation errors

## Root Cause

**Heroku skips `devDependencies` during production builds**, but our build-critical packages (Tailwind CSS, TypeScript, PostCSS) were in `devDependencies`.

## Solution Applied

### 1. Moved Build-Critical Dependencies to `dependencies` (Loyalty App)

**File**: `loyalty-app/package.json`

**Moved from `devDependencies` to `dependencies`:**
- ✅ `tailwindcss` - CSS compilation
- ✅ `typescript` - TypeScript compilation
- ✅ `postcss` - CSS processing
- ✅ `autoprefixer` - CSS vendor prefixes
- ✅ `@types/*` packages - TypeScript type definitions
- ✅ `@tailwindcss/forms` - Tailwind form plugin
- ✅ `@tailwindcss/typography` - Tailwind typography plugin

**Kept in `devDependencies` (not needed for build):**
- ✅ `eslint` - Code linting
- ✅ `prettier` - Code formatting
- ✅ `@typescript-eslint/*` - ESLint TypeScript plugins

### 1b. Moved Runtime-Critical Dependencies to `dependencies` (Root)

**File**: `package.json` (root)

**Moved from `devDependencies` to `dependencies`:**
- ✅ `concurrently` - Required to start both servers in production

**Why?** The `start:production` script uses `concurrently` to run both Express and Next.js servers simultaneously. Without it in `dependencies`, Heroku can't start the app.

### 2. Added Heroku Configuration

**File**: `package.json` (root)

```json
{
  "heroku-run-build-script": true
}
```

This ensures Heroku runs the build script properly.

### 3. Created `.npmrc` for Loyalty App

**File**: `loyalty-app/.npmrc`

```
production=false
```

This ensures all dependencies are installed, even in production mode.

## Why This Matters

### The Heroku Build Process

```
1. npm install (root)
   ↓
2. postinstall hook runs
   ↓
3. cd loyalty-app && npm install
   ↓
4. Heroku may set NPM_CONFIG_PRODUCTION=true
   ↓
5. Without fix: devDependencies skipped ❌
   With fix: All dependencies installed ✅
   ↓
6. npm run build (Next.js build)
   ↓
7. Success! ✅
```

## What Changed in Each File

### Root `package.json`
```json
{
  "scripts": {
    "postinstall": "cd loyalty-app && npm install",
    "build": "npm run build:loyalty",
    "build:loyalty": "cd loyalty-app && npm run build",
    "start:production": "concurrently \"node server.js\" \"cd loyalty-app && npm start\""
  },
  "dependencies": {
    "concurrently": "^8.2.2",  // ✅ Moved from devDependencies
    "express": "^4.18.2",
    // ... other runtime dependencies
  },
  "devDependencies": {
    "eslint": "^9.35.0",
    "nodemon": "^3.0.1"  // Only dev-time tools remain here
  },
  "heroku-run-build-script": true
}
```

### `loyalty-app/package.json`
```json
{
  "dependencies": {
    // All build-critical packages moved here
    "tailwindcss": "^3.4.18",
    "typescript": "^5.3.3",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.21",
    "@types/node": "^20.10.4",
    "@types/react": "^18.2.42",
    // ... other build dependencies
  },
  "devDependencies": {
    // Only development tools remain here
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

### `loyalty-app/.npmrc` (NEW)
```
production=false
```

## Testing Locally

To verify the fix works:

```bash
# Clean install
rm -rf node_modules loyalty-app/node_modules
npm install

# Should install loyalty-app dependencies automatically
# Check that tailwindcss is installed
ls loyalty-app/node_modules/tailwindcss

# Build
npm run build

# Should complete successfully
```

## Expected Heroku Build Output

```
-----> Installing dependencies
       Installing any new modules (package.json)
       
-----> Running postinstall hook
       cd loyalty-app && npm install
       
-----> Build
       Running heroku-postbuild
       
       > npm run build
       > cd loyalty-app && npm run build
       > next build
       
       ✓ Creating an optimized production build
       ✓ Compiled successfully
       
-----> Build succeeded!
```

## Key Takeaways

1. **Always put build-time dependencies in `dependencies`** for Heroku
2. **Use `postinstall` hook** for monorepo/subdirectory setups
3. **Test with clean installs** to catch dependency issues early
4. **Document the why** - future developers will thank you!

## Verification Checklist

Before deploying to Heroku:
- [ ] `tailwindcss` is in `loyalty-app/package.json` `dependencies`
- [ ] `typescript` is in `loyalty-app/package.json` `dependencies`
- [ ] `concurrently` is in root `package.json` `dependencies`
- [ ] `postinstall` script exists in root `package.json`
- [ ] `.npmrc` file exists in `loyalty-app/`
- [ ] Local build works: `npm run build`
- [ ] Clean install works: `rm -rf node_modules && npm install`
- [ ] Start script works: `npm run start:production`

## Next Steps

1. Commit these changes
2. Push to Heroku
3. Monitor build logs
4. Verify both apps work after deployment

The build should now complete successfully! 🎉

