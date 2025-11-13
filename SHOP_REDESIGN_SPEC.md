# 🎨 Shop Page Redesign Specification
## DoorDash-Style Modern UI

---

## 📋 Overview

Complete redesign of the shop page to match DoorDash's clean, modern aesthetic with:
- Collapsed sidebar with icons
- Floating cart button
- Clean, minimal design
- No dark theme elements
- Better product grid and filters

---

## 🎯 Layout Structure

### Desktop Layout (1024px+)
```
┌─────────────────────────────────────────────────────────┐
│  [☰] [Logo]    [Search Bar - Centered]    [🛒 Cart (2)] │ ← Top Bar (white, shadow)
├─────────────────────────────────────────────────────────┤
│                                                           │
│  [📍] Location: Manhattan Flagship                        │ ← Location Bar
│                                                           │
├──┬────────────────────────────────────────────────────┤
│  │                                                       │
│🏠│  Categories (horizontal scroll)                      │
│🍔│  [All] [Burgers] [Chicken] [Combos] ...             │
│🍗│                                                       │
│🥤│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│🌭│  │ Image  │ │ Image  │ │ Image  │ │ Image  │       │
│👶│  │ Name   │ │ Name   │ │ Name   │ │ Name   │       │
│🍟│  │ $12.99 │ │ $12.99 │ │ $12.99 │ │ $12.99 │       │
│🍰│  │  [+]   │ │  [+]   │ │  [+]   │ │  [+]   │       │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │
└──┴────────────────────────────────────────────────────┘
```

### Mobile Layout (<768px)
```
┌─────────────────────────────┐
│ [☰] [Logo]  [Search] [🛒 2] │ ← Top Bar
├─────────────────────────────┤
│ 📍 Manhattan Flagship       │
├─────────────────────────────┤
│ [All] [Burgers] [Chicken]   │ ← Horizontal scroll
├─────────────────────────────┤
│ ┌───────┐ ┌───────┐        │
│ │ Image │ │ Image │        │
│ │ Name  │ │ Name  │        │
│ │ $12.99│ │ $12.99│        │
│ │  [+]  │ │  [+]  │        │
│ └───────┘ └───────┘        │
└─────────────────────────────┘
     ↑
   [🛒 View Cart (2) - $24.98] ← Floating button
```

---

## 🎨 Component Specifications

### 1. Top Navigation Bar
**Style:**
- Background: `#FFFFFF`
- Height: `64px`
- Box Shadow: `0 2px 8px rgba(0,0,0,0.08)`
- Sticky: `position: sticky; top: 0; z-index: 50`

**Layout:**
```
[☰ Menu] [🦘 Logo] ──────── [Search Bar] ──────── [🛒 Cart Badge]
  60px      120px              flexible                80px
```

**Elements:**
- **Hamburger Menu**: Opens/closes sidebar
  - Icon: 24x24px
  - Color: `#191919`
  - Hover: `#00000080`

- **Logo**: Always visible
  - Max width: 120px
  - Height: 40px
  - Clickable → Home

- **Search Bar**: Centered, flexible width
  - Max width: `600px`
  - Background: `#F5F5F5`
  - Border radius: `24px`
  - Padding: `12px 20px`
  - Placeholder: "Search menu..."
  - Icon: 🔍 on left

- **Cart Button**: Badge with count
  - Icon: 🛒 24x24px
  - Badge: Red circle with white text
  - Shows item count
  - Click → Opens cart panel

---

### 2. Collapsed Sidebar
**Collapsed State (Default):**
- Width: `60px`
- Background: `#FFFFFF`
- Border right: `1px solid #E5E5E5`
- Icons only, no text

**Icons (Top to Bottom):**
```
🏠 Home
🍔 Burgers
🍗 Chicken
🥤 Drinks
🌭 Hot Dogs
👶 Kids
🍟 Sides
🍰 Sweets
```

**Hover State:**
- Icon background: `#F5F5F5`
- Border radius: `8px`
- Smooth transition

**Active State:**
- Background: `#EB1700` (DoorDash red)
- Icon color: `#FFFFFF`

**Expanded State (on hover - optional):**
- Width: `240px`
- Shows icon + text
- Smooth transition: `0.3s ease`

---

### 3. Location Bar
**Style:**
- Background: `#F9F9F9`
- Padding: `12px 20px`
- Border bottom: `1px solid #E5E5E5`

**Content:**
```
📍 Delivering to: Manhattan Flagship
```

---

### 4. Category Filter (Horizontal Scroll)
**Style:**
- Background: `#FFFFFF`
- Padding: `16px 20px`
- Border bottom: `1px solid #E5E5E5`
- Overflow-x: `scroll`
- Hide scrollbar

**Category Pills:**
- Default:
  - Background: `#FFFFFF`
  - Border: `1px solid #E5E5E5`
  - Border radius: `20px`
  - Padding: `8px 16px`
  - Color: `#191919`

- Active:
  - Background: `#191919`
  - Color: `#FFFFFF`
  - No border

- Hover:
  - Border color: `#191919`

**Layout:**
```
[All Items] [Burgers (12)] [Chicken (8)] [Combos (5)] ...
```

---

### 5. Product Grid
**Grid Layout:**
- Desktop: 4 columns
- Tablet: 3 columns
- Mobile: 2 columns
- Gap: `20px`
- Padding: `20px`

**Product Card:**
```
┌────────────────┐
│                │
│  Product Image │ ← 16:9 aspect ratio
│                │
├────────────────┤
│ Product Name   │ ← 2 lines max, ellipsis
│ $12.99         │ ← Bold, large
│                │
│    [+ Add]     │ ← Button, full width
└────────────────┘
```

**Card Style:**
- Background: `#FFFFFF`
- Border: `1px solid #E5E5E5`
- Border radius: `12px`
- Hover: `box-shadow: 0 4px 12px rgba(0,0,0,0.1)`
- Transition: `0.2s ease`

**Image:**
- Aspect ratio: `16:9`
- Object fit: `cover`
- Border radius: `12px 12px 0 0`

**Name:**
- Font size: `16px`
- Font weight: `600`
- Color: `#191919`
- Line height: `1.4`
- Max lines: 2
- Overflow: `ellipsis`

**Price:**
- Font size: `18px`
- Font weight: `700`
- Color: `#191919`
- Margin top: `8px`

**Add Button:**
- Background: `#EB1700` (DoorDash red)
- Color: `#FFFFFF`
- Border radius: `8px`
- Padding: `10px`
- Font weight: `600`
- Hover: `#D01500`
- Active: Scale `0.95`

---

### 6. Floating Cart Button (Mobile)
**Position:**
- Fixed bottom: `20px`
- Left: `20px`
- Right: `20px`
- Z-index: `40`

**Style:**
```
┌─────────────────────────────────────┐
│ 🛒  View Cart (2 items)    $24.98  │
└─────────────────────────────────────┘
```

- Background: `#191919`
- Color: `#FFFFFF`
- Border radius: `12px`
- Padding: `16px 20px`
- Font weight: `600`
- Box shadow: `0 4px 12px rgba(0,0,0,0.2)`
- Pulse animation when items added

**Click Action:**
- Slides up cart panel from bottom
- Overlay background: `rgba(0,0,0,0.5)`

---

### 7. Cart Slide-Out Panel
**Desktop:**
- Slides from right
- Width: `400px`
- Height: `100vh`
- Background: `#FFFFFF`
- Box shadow: `-4px 0 12px rgba(0,0,0,0.1)`

**Mobile:**
- Slides from bottom
- Height: `80vh`
- Border radius: `16px 16px 0 0`

**Content:**
```
┌────────────────────────────┐
│ Your Cart (2)          [×] │ ← Header
├────────────────────────────┤
│                            │
│ [img] Burger        $12.99 │
│       Qty: 1         [−][+]│
│                            │
│ [img] Fries          $4.99 │
│       Qty: 1         [−][+]│
│                            │
├────────────────────────────┤
│ Subtotal          $17.98   │
│ Tax                $1.53   │
│ Total             $19.51   │
├────────────────────────────┤
│    [Checkout →]            │ ← Big button
└────────────────────────────┘
```

---

## 🎨 Color Palette

### Primary Colors
- **DoorDash Red**: `#EB1700` (buttons, accents)
- **Dark Gray**: `#191919` (text, active states)
- **Light Gray**: `#F5F5F5` (backgrounds)
- **Border Gray**: `#E5E5E5` (dividers)
- **White**: `#FFFFFF` (cards, panels)

### Text Colors
- **Primary**: `#191919`
- **Secondary**: `#6B6B6B`
- **Disabled**: `#B0B0B0`

### Shadows
- **Card**: `0 2px 8px rgba(0,0,0,0.08)`
- **Hover**: `0 4px 12px rgba(0,0,0,0.1)`
- **Float**: `0 4px 12px rgba(0,0,0,0.2)`

---

## 🚫 What to Remove

1. **Dark Theme Elements**
   - All `dark:` Tailwind classes
   - Dark mode toggles
   - Dark color variables

2. **Hero Banner**
   - Blue/purple gradient
   - Large hero section
   - Marketing text

3. **Old Sidebar**
   - Full-width sidebar
   - Text-heavy navigation
   - Dark backgrounds

4. **Desktop Cart Panel**
   - Replace with floating button
   - Use slide-out instead

---

## ✅ Implementation Checklist

### Phase 1: Structure
- [ ] Create new top navigation component
- [ ] Create collapsed sidebar component
- [ ] Remove hero banner
- [ ] Add location bar

### Phase 2: Categories & Products
- [ ] Horizontal category scroll
- [ ] Product grid layout
- [ ] Product card design
- [ ] Add to cart button

### Phase 3: Cart
- [ ] Floating cart button (mobile)
- [ ] Cart slide-out panel
- [ ] Cart item cards
- [ ] Checkout button

### Phase 4: Polish
- [ ] Remove all dark theme
- [ ] Add animations
- [ ] Test responsive
- [ ] Fix any bugs

---

## 📱 Responsive Breakpoints

- **Mobile**: `< 768px`
  - 2 column grid
  - Floating cart button
  - Hamburger menu

- **Tablet**: `768px - 1024px`
  - 3 column grid
  - Collapsed sidebar
  - Floating cart button

- **Desktop**: `> 1024px`
  - 4 column grid
  - Collapsed sidebar
  - Cart slide-out

---

## 🎯 Key Features

1. **Clean & Minimal** - No clutter, focus on products
2. **Fast Navigation** - Horizontal category scroll
3. **Easy Cart Access** - Always visible, one click
4. **Mobile-First** - Optimized for touch
5. **No Dark Mode** - Consistent light theme
6. **DoorDash Aesthetic** - Red accents, clean typography

---

## 📝 Notes

- Use Next.js `<Image>` component for optimization
- Implement lazy loading for products
- Add skeleton loaders for better UX
- Use Framer Motion for smooth animations
- Test on real devices before finalizing

---

**Ready to implement? Review this spec and let me know if you want any changes!**

