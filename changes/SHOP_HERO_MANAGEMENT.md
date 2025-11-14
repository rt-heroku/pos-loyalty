# Shop Hero Banner Management 🎨

## How to Enable/Disable the Hero Banner

The hero banner is controlled by the `system_settings` table in your database.

---

## Option 1: Via Database (Quick)

### To DISABLE the hero:
```sql
UPDATE system_settings 
SET setting_value = 'false' 
WHERE setting_key = 'shop_hero_enabled';

-- If it doesn't exist, create it:
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description)
VALUES ('shop_hero_enabled', 'false', 'boolean', 'shop', 'Enable/disable hero banner on shop page')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = 'false';
```

### To ENABLE the hero:
```sql
UPDATE system_settings 
SET setting_value = 'true' 
WHERE setting_key = 'shop_hero_enabled';
```

---

## Option 2: Via POS System Settings (Recommended)

### Step 1: Go to System Settings
1. Open POS: `http://localhost:3001` or your POS URL
2. Click **Dashboard** (left sidebar)
3. Scroll down to **System Settings** section
4. Click **View Settings** button

### Step 2: Add/Edit Setting
Look for existing setting with key: `shop_hero_enabled`

**If it exists:**
1. Click **Edit** button
2. Change value to `true` or `false`
3. Click **Save**

**If it doesn't exist:**
1. Click **Add Setting** button
2. Fill in:
   - **Setting Key**: `shop_hero_enabled`
   - **Setting Value**: `true` or `false`
   - **Type**: `boolean`
   - **Category**: `shop` (or `general`)
   - **Description**: `Enable/disable hero banner on shop page`
3. Click **Save**

---

## Other Hero Settings

You can also customize the hero content:

### Hero Title:
```sql
UPDATE system_settings 
SET setting_value = 'Your Custom Title' 
WHERE setting_key = 'shop_hero_title';

-- Or create:
INSERT INTO system_settings (setting_key, setting_value, setting_type, category)
VALUES ('shop_hero_title', 'Order Your Favorites', 'text', 'shop')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = 'Order Your Favorites';
```

### Hero Subtitle:
```sql
UPDATE system_settings 
SET setting_value = 'Your Custom Subtitle' 
WHERE setting_key = 'shop_hero_subtitle';

-- Or create:
INSERT INTO system_settings (setting_key, setting_value, setting_type, category)
VALUES ('shop_hero_subtitle', 'Fresh, delicious, delivered to your door', 'text', 'shop')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = 'Fresh, delicious, delivered to your door';
```

---

## All Available Shop Settings

| Setting Key | Type | Default Value | Description |
|-------------|------|---------------|-------------|
| `shop_hero_enabled` | boolean | `true` | Show/hide hero banner |
| `shop_hero_title` | text | "Order Your Favorites" | Hero main heading |
| `shop_hero_subtitle` | text | "Fresh, delicious, delivered to your door" | Hero subheading |

---

## Verification

After changing settings, check the browser console:

```javascript
// You should see:
[Shop] Settings loaded: {
  hero_enabled: true,  // ← Your new value
  hero_title: 'Order Your Favorites',
  hero_subtitle: 'Fresh, delicious, delivered to your door',
  ...
}
```

---

## Quick SQL to Check Current Settings

```sql
SELECT setting_key, setting_value, setting_type, category 
FROM system_settings 
WHERE setting_key LIKE 'shop_%'
ORDER BY setting_key;
```

Expected output:
```
setting_key         | setting_value                              | setting_type | category
--------------------+--------------------------------------------+--------------+---------
shop_hero_enabled   | true                                       | boolean      | shop
shop_hero_subtitle  | Fresh, delicious, delivered to your door  | text         | shop
shop_hero_title     | Order Your Favorites                       | text         | shop
```

---

## Complete Setup Script

Run this to set up all shop settings at once:

```sql
-- Create/update all shop settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description)
VALUES 
  ('shop_hero_enabled', 'true', 'boolean', 'shop', 'Enable/disable hero banner on shop page'),
  ('shop_hero_title', 'Order Your Favorites', 'text', 'shop', 'Hero banner main title'),
  ('shop_hero_subtitle', 'Fresh, delicious, delivered to your door', 'text', 'shop', 'Hero banner subtitle')
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  setting_type = EXCLUDED.setting_type,
  category = EXCLUDED.category,
  description = EXCLUDED.description;
```

---

## Testing

1. **Disable hero:**
   ```sql
   UPDATE system_settings SET setting_value = 'false' WHERE setting_key = 'shop_hero_enabled';
   ```

2. **Refresh shop page:**
   - Hero should disappear
   - Categories should be at top

3. **Enable hero:**
   ```sql
   UPDATE system_settings SET setting_value = 'true' WHERE setting_key = 'shop_hero_enabled';
   ```

4. **Refresh again:**
   - Hero should reappear with title and subtitle

---

## Troubleshooting

### Hero not disappearing after setting to false:

1. **Check database:**
   ```sql
   SELECT setting_value FROM system_settings WHERE setting_key = 'shop_hero_enabled';
   -- Should return: false
   ```

2. **Clear browser cache:**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+F5` (Windows)

3. **Check console:**
   ```javascript
   // Should show:
   [Shop] Settings loaded: {hero_enabled: false, ...}
   ```

4. **Restart dev server:**
   ```bash
   cd loyalty-app
   # Press Ctrl+C
   npm run dev
   ```

---

**Quick Answer: Yes, it's in system_settings!** 

Just update `shop_hero_enabled` to `true` or `false` via SQL or the POS System Settings UI! ✅

