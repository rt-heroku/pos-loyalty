# 🚀 Shop System - Quick Start Guide

## 🎯 How to Test the New Shop Feature

### Prerequisites
- ✅ Database migrated (shop_system.sql)
- ✅ Server running on port 3000
- ✅ Loyalty app running on port 3001

---

## 📱 Testing on Mobile

### 1. Open the Shop
```
1. Open your browser to http://localhost:3001/loyalty
2. Login or continue as guest
3. Look at the bottom navigation bar
4. Click the "Shop" icon (4th icon from left)
```

### 2. Browse Products
```
1. Scroll through the hero section
2. Use the search bar to find products
3. Tap category pills to filter
4. Products display in a 2-column grid
5. Tap any product to customize (if modifiers exist)
```

### 3. Add to Cart
```
1. Tap "Add" on a product
2. If modifiers exist:
   - Select size (required)
   - Add toppings (optional)
   - Enter special instructions
   - Adjust quantity
   - Tap "Add to Cart - $XX.XX"
3. Cart button appears at bottom right
4. Shows item count and total
```

### 4. View Cart
```
1. Tap the floating cart button
2. Cart slides up from bottom
3. Review items
4. Adjust quantities with +/- buttons
5. Remove items with trash icon
6. Tap "Checkout"
```

### 5. Guest Checkout
```
1. Enter your information:
   - Full Name
   - Phone Number
   - Email Address
2. Choose order type:
   - Pickup (free)
   - Delivery ($5.00)
3. Select location
4. If delivery: enter address
5. Choose when:
   - ASAP (30-45 min)
   - Schedule for later
6. Select payment method
7. Add order instructions (optional)
8. Tap "Place Order"
```

### 6. Order Confirmation
```
1. See success message
2. View order number
3. See estimated time
4. Review order details
5. Tap "Order Again" to return to shop
6. Tap "View My Orders" to see order history
```

---

## 💻 Testing on Desktop

### 1. Open the Shop
```
1. Open http://localhost:3001/loyalty/shop
2. See hero section with logo and branding
3. Three-column layout:
   - Left: Categories & Search
   - Middle: Products (2+ per row)
   - Right: Cart (sticky)
```

### 2. Browse Products
```
1. Use search bar in left sidebar
2. Click category names to filter
3. Products scroll smoothly
4. Click "Add" on any product
```

### 3. Customize Product
```
1. Modal opens with product details
2. Select required modifiers (marked with *)
3. Add optional modifiers
4. Enter special instructions
5. Adjust quantity
6. Click "Add to Cart - $XX.XX"
```

### 4. Review Cart
```
1. Cart updates in right sidebar
2. Shows all items with thumbnails
3. Adjust quantities inline
4. Remove items
5. See subtotal, tax, total
6. Click "Checkout"
```

### 5. Checkout Process
```
(Same as mobile, but in a cleaner 2-column layout)
- Left: Checkout form
- Right: Order summary (sticky)
```

---

## 🧪 Test Scenarios

### Scenario 1: Quick Order (No Account)
```
✓ Browse products
✓ Add 2-3 items to cart
✓ Checkout as guest
✓ Choose pickup
✓ Pay at pickup
✓ Complete order
✓ See confirmation
```

### Scenario 2: Customized Order
```
✓ Find product with modifiers
✓ Select size: Large
✓ Add toppings: Extra Cheese, Bacon
✓ Add special instructions: "Extra sauce"
✓ Add to cart
✓ Verify price includes modifiers
✓ Complete checkout
```

### Scenario 3: Delivery Order
```
✓ Add items to cart
✓ Checkout as guest
✓ Choose delivery
✓ Enter delivery address
✓ Add delivery instructions
✓ Schedule for later (tomorrow 6 PM)
✓ Select credit card payment
✓ Complete order
```

### Scenario 4: Authenticated User
```
✓ Login to loyalty app
✓ Navigate to Shop
✓ Add items to cart
✓ Checkout (info pre-filled)
✓ See previous orders
✓ Complete order
✓ View order in dashboard
```

---

## 🔍 What to Look For

### ✅ Good Signs
- Products load quickly
- Images display correctly
- Cart updates instantly
- Modifiers show with prices
- Totals calculate correctly
- Checkout form validates
- Order confirmation appears
- Mobile gestures work smoothly
- Desktop layout is clean

### ❌ Issues to Report
- Products not loading
- Images broken or slow
- Cart not updating
- Modifier prices wrong
- Checkout errors
- Payment method issues
- Order not created
- Mobile layout broken
- Desktop cart not sticky

---

## 🐛 Troubleshooting

### Products Not Loading
```bash
# Check API endpoint
curl http://localhost:3000/api/products?active=true

# Should return array of products
```

### Shop Settings Not Loading
```bash
# Check shop settings
curl http://localhost:3000/api/shop/settings

# Should return hero settings and logo
```

### Order Creation Fails
```bash
# Check database connection
psql $DATABASE_URL -c "SELECT * FROM orders LIMIT 1;"

# Check if tables exist
psql $DATABASE_URL -c "\dt orders"
psql $DATABASE_URL -c "\dt order_items"
```

### Modifiers Not Showing
```bash
# Check if product has modifiers
curl http://localhost:3000/api/products/1/modifiers

# Should return array of modifier groups
```

---

## 📊 Database Queries for Testing

### Check Orders
```sql
-- View all online orders
SELECT * FROM orders 
WHERE origin IN ('mobile', 'online') 
ORDER BY order_date DESC;

-- View order with items
SELECT 
  o.*,
  json_agg(oi.*) as items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.order_number = 'ORD-20251112-0001'
GROUP BY o.id;
```

### Check Modifiers
```sql
-- View all modifier groups
SELECT * FROM product_modifier_groups;

-- View modifiers for a group
SELECT * FROM product_modifiers WHERE group_id = 1;

-- View products with modifiers
SELECT 
  p.name,
  pmg.name as modifier_group
FROM products p
JOIN product_modifier_group_links pmgl ON p.id = pmgl.product_id
JOIN product_modifier_groups pmg ON pmgl.modifier_group_id = pmg.id;
```

### Check Payment Methods
```sql
-- View all payment methods
SELECT * FROM payment_methods WHERE is_active = true;
```

---

## 🎨 UI Testing Checklist

### Mobile (< 768px)
- [ ] Bottom nav shows Shop icon
- [ ] Hero section displays correctly
- [ ] Search bar is full width
- [ ] Category pills scroll horizontally
- [ ] Products in 2-column grid
- [ ] Product cards look good
- [ ] Cart button floats at bottom right
- [ ] Cart slides up smoothly
- [ ] Checkout form is easy to use
- [ ] Keyboard doesn't cover inputs

### Tablet (768px - 1024px)
- [ ] Layout adapts smoothly
- [ ] Products in 3-4 column grid
- [ ] Navigation is accessible
- [ ] Forms are well-spaced

### Desktop (> 1024px)
- [ ] Three-column layout
- [ ] Left sidebar is sticky
- [ ] Right cart is sticky
- [ ] Products in 2+ columns
- [ ] Hover effects work
- [ ] Modals are centered
- [ ] Forms are well-organized

---

## 🎯 Success Criteria

### Must Work
1. ✅ Browse products
2. ✅ Add to cart
3. ✅ Customize with modifiers
4. ✅ Guest checkout
5. ✅ Order creation
6. ✅ Order confirmation

### Should Work
7. ✅ Authenticated checkout
8. ✅ Delivery orders
9. ✅ Scheduled orders
10. ✅ Previous orders
11. ✅ Mobile cart slide-up
12. ✅ Desktop sticky cart

### Nice to Have
13. ⏳ Order tracking
14. ⏳ Push notifications
15. ⏳ Reorder from history
16. ⏳ Saved payment methods

---

## 📝 Test Results Template

```
## Test Session: [Date/Time]
Tester: [Your Name]
Device: [Mobile/Tablet/Desktop]
Browser: [Chrome/Safari/Firefox]

### Scenarios Tested
- [ ] Quick Order (No Account)
- [ ] Customized Order
- [ ] Delivery Order
- [ ] Authenticated User

### Issues Found
1. [Description]
   - Severity: [Low/Medium/High]
   - Steps to reproduce:
   - Expected:
   - Actual:

2. [Description]
   ...

### What Worked Well
- [Feature 1]
- [Feature 2]
...

### Suggestions
- [Improvement 1]
- [Improvement 2]
...
```

---

## 🚀 Next Steps

After testing:
1. Report any issues found
2. Suggest improvements
3. Test on real mobile devices
4. Test with real products
5. Test with multiple users
6. Load test with many orders

---

**Happy Testing! 🎉**

