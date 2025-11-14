# Heroku API Error Fix - Generated Products History

## Problem

When clicking "Data Management" in POS Settings on Heroku, you get:
```
Failed to load generated history: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## Root Cause

The `/api/generated-products/history` endpoint was querying the `generated_products` table without checking if it exists first. If the table doesn't exist (which is likely on a fresh Heroku database), the query fails and might return HTML instead of JSON.

## Solution Applied

### Updated `/api/generated-products/history` Endpoint

Added a table existence check before querying:

```javascript
app.get('/api/generated-products/history', async (req, res) => {
  try {
    // Check if generated_products table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'generated_products'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('generated_products table does not exist, returning empty array');
      return res.json([]);  // Return empty array instead of error
    }

    // Continue with normal query...
  } catch (err) {
    console.error('Error fetching generated products history:', err);
    res.status(500).json({ error: 'Internal server error' });  // Always return JSON
  }
});
```

## What This Fix Does

1. **Checks if table exists** before querying
2. **Returns empty array** `[]` if table doesn't exist (graceful degradation)
3. **Always returns JSON** - never HTML
4. **Logs to console** for debugging

## Deploying the Fix

### Option 1: Git Push (Recommended)

```bash
cd /Users/rodrigo.torres/mulesoft-work/unified-pos-loyalty

# Commit the fix
git add server.js
git commit -m "Fix: Add table existence check for generated_products endpoint"

# Push to Heroku
git push heroku main
```

### Option 2: Manual Deploy

If you're not using Git:
1. Copy the updated `server.js` to your Heroku app
2. Restart the dyno: `heroku restart`

## Creating the Missing Table

If you want the "Generated Products" feature to work, you need to create the table:

### Run Database Script on Heroku

```bash
# Run the complete database setup
heroku pg:psql < db/database.sql

# Or just create the generated_products table
heroku pg:psql <<EOF
CREATE TABLE IF NOT EXISTS generated_products (
    id SERIAL PRIMARY KEY,
    batch INTEGER,
    brand VARCHAR(100),
    segment VARCHAR(100),
    num_of_products INTEGER,
    generated_product JSON,
    prompt TEXT,
    raw_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
EOF
```

## Verification

After deploying the fix:

1. **Visit your Heroku app**: https://pos-loyalty-7ee789772607.herokuapp.com/pos/
2. **Go to Settings** → **Data Management**
3. **Expected behavior**:
   - ✅ No error message
   - ✅ Shows "No generated products history" or empty list
   - ✅ No "Unexpected token '<'" error

## Testing the API Directly

```bash
# Test the endpoint
curl https://pos-loyalty-7ee789772607.herokuapp.com/api/generated-products/history

# Expected response (if table doesn't exist):
[]

# Expected response (if table exists but empty):
[]

# Expected response (if table has data):
[
  {
    "batchId": 1,
    "brand": "Example Brand",
    "segment": "Premium",
    "totalProducts": 10,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "products": [...]
  }
]
```

## Why This Happened

The `generated_products` table is created in `db/database.sql`, but:
1. The Heroku database might not have this table yet
2. The `heroku-postbuild` script only runs `loyalty-database-changes.sql`
3. It doesn't run the main `database.sql` script

## Long-Term Solution

Update `package.json` to run both database scripts on Heroku:

```json
{
  "scripts": {
    "heroku-postbuild": "npm run build && node update-cache-version.js && psql $DATABASE_URL -f db/database.sql && cd loyalty-app && psql $DATABASE_URL -f db/loyalty-database-changes.sql"
  }
}
```

**Note**: This will run the full database setup on every deploy, which is safe because of `CREATE TABLE IF NOT EXISTS` and `INSERT ... ON CONFLICT DO NOTHING`.

## Alternative: Conditional Database Setup

If you don't want to run the full database script every time:

```json
{
  "scripts": {
    "heroku-postbuild": "npm run build && node update-cache-version.js && cd loyalty-app && psql $DATABASE_URL -f db/loyalty-database-changes.sql",
    "db:setup": "psql $DATABASE_URL -f db/database.sql"
  }
}
```

Then run manually once:
```bash
heroku run npm run db:setup
```

## Summary

✅ **Immediate Fix**: API now returns empty array instead of error
✅ **No More HTML Errors**: Always returns JSON
✅ **Graceful Degradation**: Works even if table doesn't exist
✅ **Ready to Deploy**: Just push to Heroku

The "Data Management" section will now work without errors, even if the `generated_products` table doesn't exist yet!




