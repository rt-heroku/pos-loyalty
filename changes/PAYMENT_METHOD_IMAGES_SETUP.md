# Payment Method Images Setup Guide 🎨

## 📁 Directory Structure

Place your PNG images in the following directory:

```
unified-pos-loyalty/
└── loyalty-app/
    └── public/
        └── payment-methods/          ← CREATE THIS FOLDER
            ├── credit-card.png       ← Your PNG files go here
            ├── cash.png
            ├── pay-at-pickup.png
            ├── apple-pay.png
            └── paypal.png
```

---

## 📸 Image File Names & Specifications

### Required Images:

| Payment Method     | File Name              | Recommended Size |
|--------------------|------------------------|------------------|
| Credit Card        | `credit-card.png`      | 80x80px         |
| Cash on Delivery   | `cash.png`             | 80x80px         |
| Pay at Pickup      | `pay-at-pickup.png`    | 80x80px         |
| Apple Pay          | `apple-pay.png`        | 80x80px         |
| **PayPal (NEW)**   | `paypal.png`           | 80x80px         |

### Image Guidelines:
- ✅ **Format**: PNG (with transparency)
- ✅ **Size**: 80x80px (will be displayed at 40x40px for retina displays)
- ✅ **Background**: Transparent or white
- ✅ **Style**: Clean, recognizable icons/logos
- ✅ **File naming**: lowercase with hyphens (e.g., `credit-card.png`)

---

## 🗄️ Database Update

### Step 1: Create the public directory for images
```bash
mkdir -p loyalty-app/public/payment-methods
```

### Step 2: Add PayPal and update icon paths in database
```sql
-- First, update existing payment methods to use image paths
UPDATE payment_methods 
SET icon = '/payment-methods/credit-card.png' 
WHERE code = 'credit_card';

UPDATE payment_methods 
SET icon = '/payment-methods/cash.png' 
WHERE code = 'cash';

UPDATE payment_methods 
SET icon = '/payment-methods/pay-at-pickup.png' 
WHERE code = 'pay_at_pickup';

UPDATE payment_methods 
SET icon = '/payment-methods/apple-pay.png' 
WHERE code = 'apple_pay';

-- Add PayPal payment method
INSERT INTO payment_methods (name, code, description, requires_online_payment, display_order, icon)
VALUES ('PayPal', 'paypal', 'Pay securely with PayPal', true, 5, '/payment-methods/paypal.png')
ON CONFLICT (code) 
DO UPDATE SET 
  icon = EXCLUDED.icon,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  requires_online_payment = EXCLUDED.requires_online_payment,
  display_order = EXCLUDED.display_order;
```

---

## 💻 Code Update

### Checkout Page Component
The component needs to be updated to use Next.js Image component instead of emoji icons:

```typescript
{method.icon && (
  <div className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-lg flex-shrink-0">
    {method.icon.startsWith('/') ? (
      <Image
        src={method.icon}
        alt={method.name}
        width={40}
        height={40}
        className="object-contain"
      />
    ) : (
      <span className="text-2xl">{method.icon}</span>
    )}
  </div>
)}
```

This allows backward compatibility - if the icon is a path (starts with `/`), it displays an image; otherwise, it displays the text/emoji.

---

## 📦 Installation Steps

### 1. Create the directory:
```bash
cd /Users/rodrigo.torres/mulesoft-work/unified-pos-loyalty/loyalty-app
mkdir -p public/payment-methods
```

### 2. Add your PNG images to the directory:
```
loyalty-app/public/payment-methods/
  - credit-card.png
  - cash.png
  - pay-at-pickup.png
  - apple-pay.png
  - paypal.png
```

### 3. Run the database migration:
```bash
psql YOUR_DATABASE_URL -f db/update_payment_method_icons.sql
```

### 4. Restart the app:
```bash
cd loyalty-app
npm run dev
```

---

## 🎨 Where to Get Images

### Option 1: Official Brand Assets
- **PayPal**: https://www.paypal.com/us/webapps/mpp/logos-buttons
- **Apple Pay**: https://developer.apple.com/apple-pay/marketing/
- **Visa/Mastercard**: Official brand guidelines

### Option 2: Icon Libraries
- **Flaticon**: https://www.flaticon.com/
- **Icons8**: https://icons8.com/
- **The Noun Project**: https://thenounproject.com/

### Option 3: Create Custom Icons
- Use Figma, Sketch, or Adobe Illustrator
- Export as PNG with transparency
- Ensure proper sizing (80x80px)

---

## 🔍 Visual Example

### Before (Emoji):
```
┌─────────────────────────────┐
│ ○ 💳 Credit Card            │  ← Text emoji
│ ○ 💵 Cash on Delivery       │
│ ○ 🏪 Pay at Pickup          │
│ ○ 🍎 Apple Pay              │
└─────────────────────────────┘
```

### After (PNG Images):
```
┌─────────────────────────────┐
│ ○ [💳] Credit Card          │  ← Actual PNG logo
│ ○ [💵] Cash on Delivery     │
│ ○ [🏪] Pay at Pickup        │
│ ○ [🍎] Apple Pay            │
│ ● [PP] PayPal               │  ← NEW!
└─────────────────────────────┘
```

---

## 🧪 Testing

### Checklist:
1. ✅ Images appear in checkout page
2. ✅ Images load correctly (no 404 errors)
3. ✅ Images scale properly on different screen sizes
4. ✅ PayPal appears as a payment option
5. ✅ Transparent backgrounds work correctly
6. ✅ Images look good on both light and dark backgrounds

### Test URL:
```
http://localhost:3000/loyalty/shop/checkout
```

### Browser Console:
Check for any image loading errors:
```javascript
// Should see no errors like:
// GET http://localhost:3000/payment-methods/paypal.png 404
```

---

## 🎯 Quick Reference

### File Locations:
```
Images:     loyalty-app/public/payment-methods/*.png
SQL:        db/update_payment_method_icons.sql
Component:  loyalty-app/src/app/shop/checkout/page.tsx
```

### Access in Browser:
```
http://localhost:3000/payment-methods/credit-card.png
http://localhost:3000/payment-methods/paypal.png
```

### Database Table:
```sql
SELECT id, name, code, icon 
FROM payment_methods 
ORDER BY display_order;
```

---

## 🚨 Troubleshooting

### Issue 1: Images not loading
**Solution**: Check that the path starts with `/payment-methods/` (not `./` or relative path)

### Issue 2: Images blurry
**Solution**: Ensure images are 80x80px (2x the display size for retina)

### Issue 3: PayPal not appearing
**Solution**: 
1. Check database was updated: `SELECT * FROM payment_methods WHERE code = 'paypal';`
2. Clear browser cache
3. Restart dev server

### Issue 4: Transparent backgrounds show as black
**Solution**: Ensure PNG has alpha channel, not white background saved as PNG

---

## 📋 Summary

### What You Need to Do:

1. **Create folder**:
   ```bash
   mkdir -p loyalty-app/public/payment-methods
   ```

2. **Add 5 PNG files** (80x80px each):
   - `credit-card.png`
   - `cash.png`
   - `pay-at-pickup.png`
   - `apple-pay.png`
   - `paypal.png`

3. **Run SQL migration**:
   ```bash
   psql YOUR_DB -f db/update_payment_method_icons.sql
   ```

4. **Update component** (I'll do this for you)

5. **Test in browser**

---

**Ready to implement!** Let me know when you've added the images and I'll update the code! 🚀

