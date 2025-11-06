# Landing Page Customization Guide

## Overview

The landing page (`/`) is now fully customizable through system settings and automatically uses your location's logo. All content can be managed through the POS Settings interface.

## Features

### ✅ **Dynamic Content**
- Title 1 (Main heading)
- Title 2 (Gradient subheading)
- Subtitle (Description text)
- Logo (from selected location or default)

### ✅ **New Tab Navigation**
- POS button opens `/pos` in new tab
- Loyalty button opens `/loyalty` in new tab

### ✅ **Powered By Section**
Four featured technologies with logos and descriptions:
1. **MuleSoft** - Agent orchestration
2. **Mule AI Chain** - AI integration
3. **Heroku** - AI PaaS platform
4. **Loyalty Management** - Salesforce-based loyalty

---

## Setup Instructions

### 1. Initialize Landing Page Settings

Run the SQL script to create the default settings:

```bash
# Connect to your database
psql $DATABASE_URL -f db/landing_page_settings.sql
```

Or manually:

```sql
INSERT INTO system_settings (category, setting_key, setting_value, description, data_type)
VALUES 
    ('landing_page', 'landing_title1', 'Complete Business Solution', 'Main title (first line) on landing page', 'string'),
    ('landing_page', 'landing_title2', 'POS & Loyalty Platform', 'Secondary title (second line with gradient) on landing page', 'string'),
    ('landing_page', 'landing_subtitle', 'Manage your entire business with our integrated Point of Sale and Customer Loyalty system. Streamline operations, boost sales, and reward your customers all in one place.', 'Subtitle/description text on landing page', 'text')
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    updated_at = CURRENT_TIMESTAMP;
```

### 2. Customize Through POS Settings

1. **Login to POS** (`/pos`)
2. **Go to Settings** (gear icon)
3. **Click "System Settings" tab**
4. **Edit Landing Page Settings:**
   - `landing_title1`: Main heading text
   - `landing_title2`: Gradient subheading text
   - `landing_subtitle`: Description paragraph

### 3. Set Location Logo

1. **Go to Settings → Locations**
2. **Select or create a location**
3. **Upload logo image**
4. **Save**

The landing page will automatically use the first active location's logo.

---

## API Endpoint

### GET `/api/landing-config`

**Public endpoint** (no authentication required)

**Response:**
```json
{
  "title1": "Complete Business Solution",
  "title2": "POS & Loyalty Platform",
  "subtitle": "Manage your entire business with our integrated Point of Sale and Customer Loyalty system. Streamline operations, boost sales, and reward your customers all in one place.",
  "logo": "/images/logo.svg"
}
```

**Logo Priority:**
1. First active location's `logo_base64` (if exists)
2. Fallback to `/images/logo.svg` (default MuleSoft logo)

---

## Customization Examples

### Example 1: Retail Store

```sql
UPDATE system_settings 
SET setting_value = 'Welcome to RetailPro' 
WHERE setting_key = 'landing_title1';

UPDATE system_settings 
SET setting_value = 'Your Complete Retail Solution' 
WHERE setting_key = 'landing_title2';

UPDATE system_settings 
SET setting_value = 'Manage inventory, process sales, and reward loyal customers with our all-in-one retail management platform.' 
WHERE setting_key = 'landing_subtitle';
```

### Example 2: Restaurant Chain

```sql
UPDATE system_settings 
SET setting_value = 'Restaurant Management Suite' 
WHERE setting_key = 'landing_title1';

UPDATE system_settings 
SET setting_value = 'Orders, Payments & Loyalty' 
WHERE setting_key = 'landing_title2';

UPDATE system_settings 
SET setting_value = 'Streamline your restaurant operations with integrated POS, kitchen management, and customer loyalty programs.' 
WHERE setting_key = 'landing_subtitle';
```

### Example 3: Coffee Shop

```sql
UPDATE system_settings 
SET setting_value = 'Brew Better Business' 
WHERE setting_key = 'landing_title1';

UPDATE system_settings 
SET setting_value = 'Coffee Shop POS & Rewards' 
WHERE setting_key = 'landing_title2';

UPDATE system_settings 
SET setting_value = 'Serve your customers faster and keep them coming back with our specialized coffee shop management system.' 
WHERE setting_key = 'landing_subtitle';
```

---

## Logo Management

### Supported Formats
- PNG, JPG, JPEG, GIF, SVG
- Recommended: SVG (scalable) or PNG (transparent background)
- Recommended size: 200x200px or larger
- Max file size: 2MB

### Upload Logo via POS

1. Navigate to **Settings → Locations**
2. Click **"Create New Location"** or edit existing
3. Scroll to **"Logo"** section
4. Click **"Choose File"** or drag & drop
5. Preview appears below
6. Click **"Create Location"** or **"Update Location"**

### Logo Display
- **Header:** 48px height (h-12), auto width
- **Format:** Base64 encoded or file path
- **Fallback:** `/images/logo.svg` if no location logo

---

## Powered By Section

### Current Technologies

| Logo | Title | Description |
|------|-------|-------------|
| ![MuleSoft](../public/images/mulesoft_logo.png) | **MuleSoft** | Agents everywhere. Govern and orchestrate them with MuleSoft. |
| ![Mule AI Chain](../public/images/mac_logo.png) | **Mule AI Chain** | Seamlessly integrate cutting-edge AI capabilities into your MuleSoft ecosystem, enabling smarter automation and enhanced decision-making. |
| ![Heroku](../public/images/heroku_logo.png) | **Heroku** | The AI PaaS For Deploying, Managing, and Scaling Apps |
| ![Loyalty Management](../public/images/lm_logo.png) | **Loyalty Management** | Built on the Salesforce platform, helps organizations deliver innovative programs for customer recognition, reward, and retention |

### Logo Specifications
- **Size:** 80x80px container (h-20 w-20)
- **Background:** White with shadow
- **Padding:** 12px (p-3)
- **Format:** PNG with transparent background

---

## File Structure

```
public/
├── landing.html                 # Main landing page
└── images/
    ├── logo.svg                 # Default logo (fallback)
    ├── mulesoft_logo.png        # MuleSoft logo
    ├── mac_logo.png             # Mule AI Chain logo
    ├── heroku_logo.png          # Heroku logo
    └── lm_logo.png              # Loyalty Management logo

db/
└── landing_page_settings.sql    # SQL to initialize settings

server.js
└── GET /api/landing-config      # API endpoint for dynamic content
```

---

## Technical Details

### How It Works

1. **Page Load:**
   ```javascript
   document.addEventListener('DOMContentLoaded', loadConfig);
   ```

2. **Fetch Config:**
   ```javascript
   const response = await fetch('/api/landing-config');
   const config = await response.json();
   ```

3. **Update DOM:**
   ```javascript
   document.getElementById('title1').textContent = config.title1;
   document.getElementById('title2').textContent = config.title2;
   document.getElementById('subtitle').textContent = config.subtitle;
   document.getElementById('headerLogo').src = config.logo;
   ```

### Server-Side Logic

```javascript
// Get settings from database
const settingsResult = await pool.query(`
  SELECT setting_key, setting_value 
  FROM system_settings 
  WHERE category = 'landing_page' AND is_active = true
`);

// Get first active location's logo
const locationResult = await pool.query(`
  SELECT logo_base64 
  FROM locations 
  WHERE is_active = true 
  ORDER BY id 
  LIMIT 1
`);

// Return config with fallback values
res.json({
  title1: settings.landing_title1 || 'Complete Business Solution',
  title2: settings.landing_title2 || 'POS & Loyalty Platform',
  subtitle: settings.landing_subtitle || 'Manage your entire business...',
  logo: locationResult.rows[0]?.logo_base64 || '/images/logo.svg'
});
```

---

## Troubleshooting

### Logo Not Showing

**Problem:** Landing page shows default logo instead of location logo

**Solutions:**
1. Check location has logo uploaded:
   ```sql
   SELECT id, store_name, 
     CASE WHEN logo_base64 IS NOT NULL THEN 'Has Logo' ELSE 'No Logo' END as logo_status
   FROM locations 
   WHERE is_active = true;
   ```

2. Verify location is active:
   ```sql
   UPDATE locations SET is_active = true WHERE id = 1;
   ```

3. Check browser console for errors (F12)

### Settings Not Updating

**Problem:** Changed settings but landing page shows old text

**Solutions:**
1. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Verify settings in database:
   ```sql
   SELECT * FROM system_settings WHERE category = 'landing_page';
   ```

4. Check settings are active:
   ```sql
   UPDATE system_settings 
   SET is_active = true 
   WHERE category = 'landing_page';
   ```

### API Returns Defaults

**Problem:** `/api/landing-config` returns default values

**Solutions:**
1. Run initialization script:
   ```bash
   psql $DATABASE_URL -f db/landing_page_settings.sql
   ```

2. Check database connection in server logs
3. Verify table exists:
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'system_settings';
   ```

---

## Best Practices

### 1. Keep Text Concise
- **Title 1:** 2-5 words (e.g., "Complete Business Solution")
- **Title 2:** 2-5 words (e.g., "POS & Loyalty Platform")
- **Subtitle:** 1-2 sentences, max 200 characters

### 2. Logo Guidelines
- Use high-resolution images (2x actual display size)
- Transparent background for PNG
- SVG preferred for scalability
- Test on light and dark backgrounds

### 3. Branding Consistency
- Match colors to your brand
- Use same logo across all locations
- Keep messaging consistent with other marketing

### 4. Testing
- Test on mobile devices
- Check different screen sizes
- Verify new tab behavior
- Test with and without location logo

---

## Future Enhancements

### Potential Features
- [ ] Multiple logo options (header, footer, favicon)
- [ ] Custom color schemes
- [ ] Background image/video
- [ ] Animated transitions
- [ ] Multi-language support
- [ ] A/B testing for different messages
- [ ] Analytics tracking
- [ ] Custom CSS injection

### Customizable Powered By Section
Currently hardcoded, could be made dynamic:
```sql
CREATE TABLE landing_page_features (
  id SERIAL PRIMARY KEY,
  logo_url TEXT,
  title VARCHAR(100),
  description TEXT,
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true
);
```

---

## Summary

### ✅ What's Customizable
- Main title (title1)
- Gradient subheading (title2)
- Description text (subtitle)
- Header logo (from location)

### ✅ What's Fixed
- Page layout and structure
- Powered By section content
- Button styles and behavior
- Footer copyright

### ✅ How to Customize
1. **Via POS Settings UI** - Best for non-technical users
2. **Via SQL** - Best for bulk updates or automation
3. **Via API** - Best for integrations

### ✅ Key Benefits
- No code changes required
- Real-time updates
- Location-specific branding
- Professional appearance
- Easy maintenance

**Your landing page is now fully customizable!** 🎉


