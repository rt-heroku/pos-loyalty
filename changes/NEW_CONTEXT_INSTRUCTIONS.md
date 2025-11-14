# 🎯 NEW CONTEXT WINDOW INSTRUCTIONS

## 📝 TASK SUMMARY
Implement a complete DoorDash-style UI redesign for the shop page in the loyalty app.

---

## ✅ CURRENT STATUS (What's Working)

### Shop Functionality
- ✅ Products API working (32 products loading successfully)
- ✅ Categories API working (8 categories, dynamically generated from `products.category`)
- ✅ Products display correctly, grouped by category
- ✅ Add to cart functionality works
- ✅ Cart state management functional
- ✅ Build succeeds (`npm run build` passes)

### Technical Details
- **Shop Page**: `loyalty-app/src/app/shop/page.tsx` (1131 lines)
- **Products API**: `server.js` line 681 (public, no auth required)
- **Categories API**: `server.js` line 5963 (public, dynamically generates from `products.category`)
- **Database**: Products table has `category` VARCHAR column (not a separate categories table)
- **Frontend**: Uses `window.location.origin` for API calls, routes through Next.js API layer

---

## 🎨 WHAT NEEDS TO BE DONE

### 🔴 CRITICAL: Read This File First
**`SHOP_REDESIGN_SPEC.md`** - Complete design specification with:
- Layout specifications
- Component designs with exact measurements
- Color palette (DoorDash red #EB1700)
- Responsive breakpoints
- Implementation checklist

### 🎯 Main Tasks (in order)

1. **Collapsed Sidebar** (Desktop)
   - Icons only: 🏠 🍔 🍗 🥤 🌭 👶 🍟 🍰
   - Logo moved to right of hamburger menu
   - Expands on hover

2. **Clean Top Bar**
   - Search bar moved to center
   - Cart icon on right with badge
   - Remove all dark theme elements

3. **Remove Blue/Purple Banner**
   - Replace with clean, modern design
   - No gradients

4. **Horizontal Category Filters** (DoorDash style)
   - Sticky on desktop
   - Horizontal scroll
   - Active category highlighted

5. **Clean Product Grid**
   - Image-heavy cards
   - Quick add to cart button
   - Price prominent
   - Clean spacing

6. **Floating Cart Button** (Mobile)
   - Fixed bottom button
   - Shows item count and total
   - Slide-up cart panel

7. **Light Theme Only**
   - Remove ALL dark mode elements
   - Enforce light theme on shop pages

---

## 📁 KEY FILES TO MODIFY

### Primary Files
- `loyalty-app/src/app/shop/page.tsx` - Main shop page (1131 lines)
- `loyalty-app/src/components/layout/Sidebar.tsx` - Sidebar component
- `loyalty-app/src/components/layout/TopNav.tsx` - Top navigation

### Reference Files
- `SHOP_REDESIGN_SPEC.md` - Complete design spec (READ THIS FIRST!)
- `server.js` - Backend APIs (lines 681, 5963)

---

## 🚨 IMPORTANT TECHNICAL NOTES

### Database Schema
- **NO separate categories table** - categories are dynamically generated from `products.category`
- Products table structure:
  ```sql
  id, name, description, price, sku, stock, is_active, category (VARCHAR),
  main_image_url, created_at, updated_at
  ```

### API Endpoints (Public, No Auth)
```javascript
// Categories - Dynamically generated
GET /api/categories
// Returns: [{id, name, description, display_order, is_active, product_count}]

// Products - Filtered by category name
GET /api/products?active=true&category_id=1
// Filters by: p.category === category.name (NOT category_id!)
```

### Frontend Filtering Logic
```javascript
// CORRECT (current implementation):
products.filter(p => p.category === category.name)

// WRONG (will break):
products.filter(p => p.category_id === category.id)
```

### Theme Enforcement
```javascript
// Shop pages must enforce light theme:
document.documentElement.classList.remove('dark');
document.body.classList.remove('dark');
document.documentElement.setAttribute('data-theme', 'light');
localStorage.setItem('shop-theme', 'light');
```

---

## 🎨 DESIGN REQUIREMENTS

### Colors (DoorDash Style)
- **Primary Red**: `#EB1700` (DoorDash red)
- **Background**: `#FFFFFF` (white)
- **Text**: `#191919` (near black)
- **Gray**: `#F7F7F7` (light gray backgrounds)
- **Border**: `#E8E8E8` (subtle borders)

### Layout (Desktop)
```
┌─────────┬──────────────────────────┬─────────┐
│ Sidebar │    Top Bar (Search)      │  Cart   │
│ (Icons) ├──────────────────────────┤  Badge  │
│   🏠    │  Category Filters →→→    │         │
│   🍔    ├──────────────────────────┴─────────┤
│   🍗    │                                     │
│   🥤    │     Product Grid (2-4 cols)        │
│   🌭    │                                     │
│   👶    │                                     │
│   🍟    │                                     │
│   🍰    │                                     │
└─────────┴─────────────────────────────────────┘
```

### Layout (Mobile)
```
┌─────────────────────────────────────┐
│  ☰  Logo        🔍        🛒 (3)   │
├─────────────────────────────────────┤
│  Category Filters →→→               │
├─────────────────────────────────────┤
│                                     │
│     Product Grid (1-2 cols)        │
│                                     │
│                                     │
└─────────────────────────────────────┘
        Floating Cart Button ↑
```

---

## ✅ TESTING CHECKLIST

Before marking complete, verify:
- [ ] Products load and display correctly
- [ ] Categories filter products properly
- [ ] Add to cart works
- [ ] Cart badge shows correct count
- [ ] Search bar is centered
- [ ] Sidebar collapses to icons only
- [ ] No dark theme elements visible
- [ ] Mobile floating cart works
- [ ] Responsive on all screen sizes
- [ ] Build succeeds (`npm run build`)
- [ ] No React warnings in console
- [ ] All API calls succeed (200 status)

---

## 🚀 GETTING STARTED

1. **Read** `SHOP_REDESIGN_SPEC.md` first
2. **Review** current `loyalty-app/src/app/shop/page.tsx`
3. **Start** with collapsed sidebar
4. **Then** move to top bar redesign
5. **Next** implement category filters
6. **Finally** clean up product grid and mobile cart

---

## 💡 HELPFUL CONTEXT

### Why This Redesign?
- Current UI has dark theme elements (unwanted)
- Blue/purple banner looks dated
- Full-width sidebar wastes space
- Need modern, clean, DoorDash-style interface

### What's Already Fixed
- ✅ Products API returns correct data
- ✅ Categories dynamically generated
- ✅ Frontend filtering logic corrected
- ✅ Build errors resolved
- ✅ All API routes properly configured

### What NOT to Change
- ❌ Database schema (products.category is VARCHAR)
- ❌ Backend API endpoints (working correctly)
- ❌ Cart state management logic
- ❌ Product filtering logic (uses category.name)

---

## 📞 QUESTIONS?

If you encounter issues:
1. Check `SHOP_REDESIGN_SPEC.md` for design details
2. Verify API calls return 200 status
3. Check console for React warnings
4. Ensure light theme is enforced
5. Test on both desktop and mobile

---

**Ready to start? Read `SHOP_REDESIGN_SPEC.md` and begin with the collapsed sidebar!** 🚀

