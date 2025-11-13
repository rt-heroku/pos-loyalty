# 🧪 Shop Page Testing Guide

## Quick Start

```bash
cd /Users/rodrigo.torres/mulesoft-work/unified-pos-loyalty
npm start
# Visit: http://localhost:3000/loyalty/shop
```

---

## ✅ Visual Checklist

### Top Navigation
- [ ] White background with subtle shadow
- [ ] Logo visible on left
- [ ] Search bar centered (rounded, gray background)
- [ ] Cart icon on right with red badge
- [ ] Badge shows correct item count
- [ ] All elements properly aligned

### Collapsed Sidebar (Desktop Only)
- [ ] 60px wide on left side
- [ ] Icons visible: 🏠 🍔 🍗 🥤 🌭 👶 🍟 🍰
- [ ] "All Items" home icon at top
- [ ] Active category has red background (#EB1700)
- [ ] Hover shows gray background
- [ ] Smooth transitions

### Location Bar
- [ ] Gray background below top nav
- [ ] Shows location icon (📍)
- [ ] Displays "Delivering to: [Location Name]"
- [ ] Text properly styled

### Category Filters
- [ ] Horizontal scrolling row
- [ ] Pill-shaped buttons
- [ ] Active category: black background, white text
- [ ] Inactive: white background, gray border
- [ ] Product count shown in parentheses
- [ ] Scrollbar hidden
- [ ] Smooth scroll on mobile

### Product Grid
- [ ] 4 columns on desktop (>1024px)
- [ ] 3 columns on tablet (768-1024px)
- [ ] 2 columns on mobile (<768px)
- [ ] Equal spacing between cards (20px gaps)
- [ ] Cards have subtle borders
- [ ] Hover adds shadow effect

### Product Cards
- [ ] Image displayed with 16:9 aspect ratio
- [ ] Fallback icon for missing images
- [ ] Product name (2 lines max)
- [ ] Price in large bold text
- [ ] Red "Add" button (#EB1700)
- [ ] Button hover darkens to #D01500
- [ ] Out of stock overlay (if applicable)
- [ ] All text readable

### Floating Cart Button (Mobile)
- [ ] Only visible on mobile (<1024px)
- [ ] Fixed at bottom of screen
- [ ] Dark background (#191919)
- [ ] Shows "View Cart (X items)"
- [ ] Shows total price
- [ ] Full width with margins

### Cart Slide-Out Panel
- [ ] Opens when cart clicked
- [ ] Slides in from right
- [ ] White background
- [ ] Close button (X) in header
- [ ] "Clear" button visible when items present
- [ ] Item count in header

### Cart Items
- [ ] Product image thumbnail
- [ ] Product name
- [ ] Modifiers listed (if any)
- [ ] Special instructions (if any)
- [ ] Quantity controls (- / + buttons)
- [ ] Remove button (trash icon)
- [ ] Price per item
- [ ] All items properly spaced

### Cart Footer
- [ ] Subtotal calculated correctly
- [ ] Tax calculated (8.5%)
- [ ] Total = Subtotal + Tax
- [ ] Red checkout button
- [ ] Button hover effect works

### Product Customization Modal
- [ ] Opens for products with modifiers
- [ ] White background, rounded corners
- [ ] Product info displayed clearly
- [ ] Modifier groups properly labeled
- [ ] Required modifiers marked with red *
- [ ] Radio buttons for single selection
- [ ] Checkboxes for multiple selection
- [ ] Selected modifiers have red border/background
- [ ] Special instructions textarea
- [ ] Quantity selector with +/- buttons
- [ ] Price updates dynamically
- [ ] "Add to Cart" button shows total price

### Empty States
- [ ] Empty cart shows icon + message
- [ ] "Continue Shopping" button works
- [ ] No products found shows message
- [ ] All empty states properly centered

---

## 🔧 Functionality Tests

### Search
1. [ ] Type in search bar
2. [ ] Products filter in real-time
3. [ ] Category filters respect search
4. [ ] Clear search shows all products
5. [ ] Case-insensitive search works

### Category Filtering
1. [ ] Click "All Items" shows all products
2. [ ] Click category filters to that category
3. [ ] Sidebar icon click filters correctly
4. [ ] Horizontal filter click filters correctly
5. [ ] Product count updates correctly
6. [ ] Smooth scroll to category section

### Add to Cart
1. [ ] Click "Add" on simple product
2. [ ] Product added to cart immediately
3. [ ] Cart badge count increases
4. [ ] Cart panel opens automatically
5. [ ] Item appears in cart list

### Product Customization
1. [ ] Click product with modifiers
2. [ ] Modal opens with product details
3. [ ] Select required modifiers
4. [ ] Price updates with selections
5. [ ] Add special instructions
6. [ ] Adjust quantity
7. [ ] Click "Add to Cart"
8. [ ] Modal closes
9. [ ] Items added to cart

### Cart Management
1. [ ] Increase quantity with + button
2. [ ] Decrease quantity with - button
3. [ ] Price recalculates correctly
4. [ ] Remove item with trash icon
5. [ ] Clear cart removes all items
6. [ ] Empty cart shows empty state

### Checkout Flow
1. [ ] Click "Checkout" button
2. [ ] Redirects to checkout page
3. [ ] Cart data persists

---

## 📱 Responsive Tests

### Desktop (>1024px)
- [ ] Sidebar visible and fixed
- [ ] 4 column product grid
- [ ] Search bar properly sized
- [ ] No floating cart button
- [ ] Cart slides from right

### Tablet (768-1024px)
- [ ] Sidebar hidden
- [ ] 3 column product grid
- [ ] Horizontal filters scroll
- [ ] Floating cart button appears
- [ ] Layout adapts smoothly

### Mobile (<768px)
- [ ] Hamburger menu visible
- [ ] 2 column product grid
- [ ] Search bar full width
- [ ] Category filters scroll
- [ ] Floating cart button full width
- [ ] Cart slides up from bottom

### Touch Interactions
- [ ] All buttons have proper touch targets
- [ ] Horizontal scroll works smoothly
- [ ] Modal gestures work (swipe to close)
- [ ] No accidental clicks

---

## 🎨 Style Verification

### Colors
- [ ] No blue colors visible (replaced with red)
- [ ] DoorDash red (#EB1700) used for:
  - Add buttons
  - Cart badge
  - Active sidebar icon
  - Required field indicators
  - Checkout button
- [ ] Dark gray (#191919) used for:
  - Primary text
  - Active category filters
  - Floating cart button
- [ ] Light gray backgrounds (#F5F5F5, #F9F9F9)
- [ ] White cards and panels

### Dark Theme Removal
- [ ] NO dark: classes visible in output
- [ ] Background always white/light gray
- [ ] Text always dark gray/black
- [ ] No dark mode toggle
- [ ] Consistent light theme across all states

### Typography
- [ ] Headings are bold
- [ ] Buttons are semibold
- [ ] Body text is medium weight
- [ ] All text is readable
- [ ] No text cutoff or overflow

### Spacing
- [ ] Consistent padding in cards
- [ ] Equal gaps in grid
- [ ] Proper margins around sections
- [ ] No elements touching edges
- [ ] Comfortable whitespace

---

## ⚡ Performance Tests

### Loading
- [ ] Page loads in < 2 seconds
- [ ] Products appear quickly
- [ ] Images load progressively
- [ ] No flash of unstyled content
- [ ] Smooth transitions

### Interactions
- [ ] Button clicks respond instantly
- [ ] Cart updates smoothly
- [ ] Modal opens/closes smoothly
- [ ] Category filter is instant
- [ ] Search filters without lag

### Animations
- [ ] Slide-in animation is smooth (0.3s)
- [ ] Hover effects are smooth
- [ ] Active scale works (0.95)
- [ ] No janky animations
- [ ] 60fps on interactions

---

## 🐛 Edge Cases

### Empty Data
- [ ] 0 products: Shows "No products" message
- [ ] 0 categories: Doesn't crash
- [ ] Empty cart: Shows empty state
- [ ] Missing images: Shows placeholder

### Large Data
- [ ] 100+ products: Renders smoothly
- [ ] 20 cart items: Scrolls properly
- [ ] Long product names: Truncates correctly
- [ ] Large prices: Formats properly

### Extreme Cases
- [ ] Product with $0 price
- [ ] Product with very long name
- [ ] Category with 0 products
- [ ] Cart with same item multiple times

---

## 🌐 Browser Tests

### Chrome/Edge
- [ ] All features work
- [ ] Animations smooth
- [ ] Layout correct

### Safari
- [ ] All features work
- [ ] Webkit-specific styles work
- [ ] Touch events work on iOS

### Firefox
- [ ] All features work
- [ ] Layout matches other browsers
- [ ] Scrolling smooth

---

## ✅ Final Verification

### Build
```bash
cd loyalty-app
npm run build
```
- [ ] Build succeeds with no errors
- [ ] No TypeScript errors
- [ ] No React warnings
- [ ] Production bundle optimized

### Console
- [ ] No JavaScript errors
- [ ] No React warnings
- [ ] No 404 errors
- [ ] API calls succeed (200 status)
- [ ] No CORS issues

### Network
- [ ] Products API returns 200
- [ ] Categories API returns 200
- [ ] Shop settings API returns 200
- [ ] Images load successfully
- [ ] No unnecessary requests

---

## 📊 Success Criteria

### Visual
- ✅ Matches DoorDash aesthetic
- ✅ Clean, modern, minimal
- ✅ No dark theme elements
- ✅ Red accent color throughout
- ✅ Professional appearance

### Functional
- ✅ All features work correctly
- ✅ Cart management perfect
- ✅ Checkout flow works
- ✅ Search and filter work
- ✅ Mobile experience excellent

### Technical
- ✅ Build succeeds
- ✅ No linter errors
- ✅ No console errors
- ✅ Performance good
- ✅ Responsive on all screens

---

## 🚀 Ready to Ship

When all items are checked:
1. ✅ Code reviewed
2. ✅ Tests pass
3. ✅ Build succeeds
4. ✅ Deployed to staging
5. ✅ QA approval
6. ✅ Deploy to production

---

**Happy Testing! 🎉**

