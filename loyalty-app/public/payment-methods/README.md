# Payment Method Images 💳

## Required PNG Files

Place your payment method PNG images in this directory:

### File Names (exact):
1. `credit-card.png` - Credit/Debit card icon
2. `cash.png` - Cash icon
3. `pay-at-pickup.png` - Store/pickup icon
4. `apple-pay.png` - Apple Pay logo
5. `paypal.png` - PayPal logo (**NEW!**)

### Specifications:
- **Format**: PNG with transparency
- **Size**: 80x80 pixels (displayed at 40x40px for retina)
- **Background**: Transparent preferred
- **Style**: Clean, recognizable icons/logos

### Quick Access:
These images will be accessible at:
```
http://localhost:3000/payment-methods/credit-card.png
http://localhost:3000/payment-methods/paypal.png
etc...
```

### After Adding Images:
1. Run the SQL migration: `db/update_payment_method_icons.sql`
2. Restart the dev server
3. Go to checkout page to see them!

---

**Need images?** See `PAYMENT_METHOD_IMAGES_SETUP.md` in the project root for download sources.

