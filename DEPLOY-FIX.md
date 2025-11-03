# Deploy the API Fix to Heroku

## Current Situation

✅ Database scripts already ran during initial deployment (via `app.json` postdeploy)
✅ Tables should already exist including `generated_products`
❌ API endpoint is returning HTML instead of JSON (causing the error)

## The Fix

The updated `server.js` now includes:
- ✅ Table existence check before querying
- ✅ Returns empty array `[]` if table doesn't exist or query fails
- ✅ Always returns JSON, never HTML
- ✅ Better error logging

## Deploy the Fix

### Step 1: Commit the Changes

```bash
cd /Users/rodrigo.torres/mulesoft-work/unified-pos-loyalty

# Check what changed
git status

# Add the fixed server.js
git add server.js

# Commit with a clear message
git commit -m "Fix: Add table existence check and better error handling for generated-products API"
```

### Step 2: Push to Heroku

```bash
# If you have Heroku remote configured
git push heroku main

# Or if your remote is named differently
git push heroku master
```

### Step 3: Wait for Deployment

Heroku will:
1. Build the app
2. Run `npm install` (installs dependencies)
3. Run `heroku-postbuild` (builds Next.js app)
4. Run `postdeploy` (database scripts - but tables already exist, so it's safe)
5. Start the app

### Step 4: Verify the Fix

1. Go to: https://pos-loyalty-7ee789772607.herokuapp.com/pos/
2. Click **Settings** → **Data Management**
3. **Expected**: No error! Shows empty list

## Alternative: Quick Deploy Without Git

If you haven't set up Git with Heroku:

### Option 1: Heroku CLI Deploy

```bash
cd /Users/rodrigo.torres/mulesoft-work/unified-pos-loyalty

# Deploy directly
heroku deploy:dir . -a pos-loyalty-7ee789772607
```

### Option 2: Manual Restart (If Already Pushed)

```bash
# Just restart the dyno
heroku restart -a pos-loyalty-7ee789772607
```

## Verify Git Remote is Set Up

```bash
cd /Users/rodrigo.torres/mulesoft-work/unified-pos-loyalty

# Check if Heroku remote exists
git remote -v

# Should show something like:
# heroku  https://git.heroku.com/pos-loyalty-7ee789772607.git (fetch)
# heroku  https://git.heroku.com/pos-loyalty-7ee789772607.git (push)
```

### If Heroku Remote Doesn't Exist

```bash
# Add it
heroku git:remote -a pos-loyalty-7ee789772607

# Verify
git remote -v
```

## Check Deployment Logs

```bash
# Watch the deployment in real-time
heroku logs --tail -a pos-loyalty-7ee789772607

# Or check recent logs
heroku logs -n 100 -a pos-loyalty-7ee789772607
```

## Test the API Directly

After deployment, test the endpoint:

```bash
# Should return JSON (empty array or data)
curl https://pos-loyalty-7ee789772607.herokuapp.com/api/generated-products/history

# Expected response:
[]
# or
[{"batchId": 1, ...}]

# NOT:
<!DOCTYPE html>  ❌
```

## Troubleshooting

### If deployment fails:

```bash
# Check build logs
heroku logs --tail -a pos-loyalty-7ee789772607

# Check if app is running
heroku ps -a pos-loyalty-7ee789772607

# Restart if needed
heroku restart -a pos-loyalty-7ee789772607
```

### If you see "No such app":

```bash
# List your apps
heroku apps

# Make sure you're using the correct app name
```

### If Git push is rejected:

```bash
# Make sure you're on the right branch
git branch

# If you're not on main/master:
git checkout main

# Then push
git push heroku main
```

## What Changed in server.js

The `/api/generated-products/history` endpoint now:

```javascript
// OLD: Would fail if table doesn't exist
const result = await pool.query(`SELECT ... FROM generated_products ...`);

// NEW: Checks first, returns empty array if table doesn't exist
const tableCheck = await pool.query(`
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'generated_products'
  );
`);

if (!tableCheck.rows[0].exists) {
  return res.json([]);  // ✅ Returns JSON, not HTML
}
```

## Summary

**Quick Deploy Steps:**

1. ✅ Commit: `git add server.js && git commit -m "Fix API error"`
2. ✅ Push: `git push heroku main`
3. ✅ Test: Visit Settings → Data Management
4. ✅ Done! No more errors

The fix is already in your local `server.js`, you just need to deploy it! 🚀

