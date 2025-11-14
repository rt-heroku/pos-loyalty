# Location Bar & Store Selector - Visual Guide

## Before & After Comparison

### ❌ BEFORE: Location Bar (Old Design)
```
┌─────────────────────────────────────────────────────────────────┐
│ 📍 Delivering to: Manhattan Flagship                            │
└─────────────────────────────────────────────────────────────────┘
```
- Store name was plain text (not clickable)
- No cart visible
- No way to change store

---

### ✅ AFTER: Location Bar (New Design)
```
┌─────────────────────────────────────────────────────────────────┐
│ 📍 Delivering to: Manhattan Flagship 🔵    🛒 Cart (2)         │
│                    └─ Blue link (clickable)       └─ Badge      │
└─────────────────────────────────────────────────────────────────┘
```
- **Left**: Location icon + "Delivering to:" + clickable blue store link
- **Right**: Cart icon + "Cart" text + badge with item count
- Store name opens store selector modal
- Cart opens cart slide-out panel

---

## Store Selector Modal Layout

### Modal Structure
```
┌───────────────────────────────────────────────────────────────────┐
│  Store Locator                                            ✕       │
│  Find stores near you and book services                          │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🔍 [Search stores by name, city, or address...] [📍 Use My     │
│                                                     Location]     │
│                                                                   │
│  Stores (3)                                                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Manhattan Flagship ⭐ 4.8 (156)                 ✓ Selected  │ │
│  │ 📍 New York, NY                                  Directions  │ │
│  │ ● Open  🕐 09:00 - 17:00                                    │ │
│  │ [Repair] [Maintenance] [Installation]                       │ │
│  │ 🅿️ Parking  📶 WiFi  ♿ Accessible                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Downtown Service Center ⭐ 4.8 (156)   Pickup at Downtown  │ │
│  │ 📍 New York, NY                           Service Center    │ │
│  │ ● Open  🕐 09:00 - 17:00                      Directions    │ │
│  │ [Repair] [Maintenance] [Installation]                       │ │
│  │ 🅿️ Parking  📶 WiFi  ♿ Accessible                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Brooklyn Branch ⭐ 4.6 (128)           Pickup at Brooklyn   │ │
│  │ 📍 Brooklyn, NY                               Branch        │ │
│  │ ● Open  🕐 10:00 - 18:00                      Directions    │ │
│  │ [Repair] [Maintenance]                                       │ │
│  │ 📶 WiFi  ♿ Accessible                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## User Interaction Flow

### Scenario 1: Viewing Cart
```
Step 1: User is on shop page
┌─────────────────────────────────────────────┐
│ 📍 Delivering to: Manhattan Flagship   🛒 Cart (2) │ ← CLICK HERE
└─────────────────────────────────────────────┘

Step 2: Cart slide-out panel opens
┌────────────────────────────────────────────────────────────┐
│                                         ┌─────────────────┐ │
│                                         │ Your Cart (2)  │ │
│                                         │                 │ │
│                                         │ • Classic Burger│ │
│                                         │   $12.99       │ │
│                                         │                 │ │
│                                         │ • Pepperoni... │ │
│                                         │   $14.99       │ │
│                                         │                 │ │
│                                         │ Total: $27.98  │ │
│                                         │                 │ │
│                                         │ [Checkout]     │ │
│                                         └─────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

### Scenario 2: Changing Store
```
Step 1: User clicks store name
┌─────────────────────────────────────────────┐
│ 📍 Delivering to: Manhattan Flagship   🛒 Cart (2) │
│                    └─ CLICK HERE                    │
└─────────────────────────────────────────────┘

Step 2: Store selector modal opens
[Full modal interface shown above]

Step 3: User clicks "Pickup at Brooklyn Branch"
┌─────────────────────────────────────────────┐
│ Brooklyn Branch ⭐ 4.6 (128)                │
│ [Pickup at Brooklyn Branch] ← CLICK HERE   │
└─────────────────────────────────────────────┘

Step 4: Modal closes, location bar updates
┌─────────────────────────────────────────────┐
│ 📍 Delivering to: Brooklyn Branch   🛒 Cart (2) │ ← UPDATED!
└─────────────────────────────────────────────┘
```

---

## Key Features Demonstrated

### 1. Cart in Location Bar
- **Icon**: Shopping cart SVG
- **Text**: "Cart"
- **Badge**: Shows item count (e.g., "2")
- **Position**: Right side of location bar
- **Action**: Opens cart slide-out on click

### 2. Clickable Store Link
- **Color**: Blue (#2563EB - blue-600)
- **Hover**: Underline + darker blue
- **Action**: Opens store selector modal
- **Text**: Current store name (e.g., "Manhattan Flagship")

### 3. Store Selector Modal
- **Width**: Max 1280px (5xl), responsive
- **Height**: Max 90vh, scrollable
- **Backdrop**: Semi-transparent black overlay
- **Close**: X button or click backdrop

### 4. Store Cards
- **Highlight**: Selected store has blue border + light blue background
- **Hover**: Gray border on non-selected stores
- **Info**: Rating, address, hours, services, amenities
- **Actions**: "Pickup at [Store]" button + Directions button

---

## Responsive Behavior

### Desktop (1024px+)
```
┌────────────────────────────────────────────────────────────────┐
│ 📍 Delivering to: Manhattan Flagship             🛒 Cart (2)   │
└────────────────────────────────────────────────────────────────┘
```
- Full width location bar
- Cart always visible on right
- Store selector modal is wide and spacious

### Tablet (768px - 1023px)
```
┌──────────────────────────────────────────────────────┐
│ 📍 Delivering to: Manhattan Flagship    🛒 Cart (2)  │
└──────────────────────────────────────────────────────┘
```
- Slightly compressed but readable
- Modal adjusts to screen width

### Mobile (<768px)
```
┌────────────────────────────────────────┐
│ 📍 Delivering to:              🛒 (2)  │
│    Manhattan Flagship                  │
└────────────────────────────────────────┘
```
- Store name may wrap on very small screens
- Cart text hides, only icon + badge shown
- Modal takes full width with padding

---

## Color Scheme

### Location Bar:
- **Background**: Gray-50 (#F9FAFB)
- **Border**: Gray-200 (#E5E7EB)
- **Text**: Gray-700 (#374151)
- **Store Link**: Blue-600 (#2563EB)
- **Store Link Hover**: Blue-700 (#1D4ED8)

### Cart Badge:
- **Background**: Blue-600 (#2563EB)
- **Text**: White (#FFFFFF)
- **Border Radius**: Full (rounded-full)

### Store Selector Modal:
- **Background**: White (#FFFFFF)
- **Backdrop**: Black 50% opacity
- **Border Radius**: 24px (rounded-3xl)
- **Shadow**: 2xl shadow

### Store Cards:
- **Default Border**: Gray-200 (#E5E7EB)
- **Selected Border**: Blue-600 (#2563EB)
- **Selected Background**: Blue-50 (#EFF6FF)
- **Hover Border**: Gray-300 (#D1D5DB)

### Buttons:
- **Primary (Pickup)**: Blue-600 background, white text
- **Secondary (Directions)**: White background, gray border

---

## Typography

### Location Bar:
- **"Delivering to:"**: Font-medium, text-gray-700
- **Store Name**: Font-semibold, text-blue-600

### Modal:
- **Title**: 2xl, font-bold, text-gray-900
- **Subtitle**: text-gray-600
- **Store Name**: lg, font-bold, text-gray-900
- **Address**: text-gray-600
- **Status**: xs, font-medium, green-800
- **Services**: xs, font-medium, blue-700

---

## Icons Used

### Location Bar:
- 📍 Location pin (Heroicons)
- 🛒 Shopping cart (Heroicons)

### Modal:
- 🔍 Search (Heroicons)
- 📍 Location pin (Heroicons)
- ⭐ Star (Unicode)
- 🕐 Clock (Heroicons)
- ✓ Checkmark (Unicode)
- ✕ Close (Heroicons)
- 🅿️ Parking (Unicode)
- 📶 WiFi (Unicode)
- ♿ Accessible (Unicode)

---

## State Management

```typescript
// Current selected store
const [selectedStore, setSelectedStore] = useState<string>('Manhattan Flagship');

// Show/hide store selector modal
const [showStoreSelector, setShowStoreSelector] = useState(false);

// User clicks store name
onClick={() => setShowStoreSelector(true)}

// User selects a store
onSelectStore={(storeName) => {
  setSelectedStore(storeName);
  setShowStoreSelector(false);
}}
```

---

## Animation & Transitions

### Location Bar:
- Store link hover: `transition-colors` (smooth color change)
- Cart button hover: `transition-colors` (smooth color change)

### Modal:
- Backdrop fade-in: Instant (can add transition if desired)
- Store cards hover: `transition-all` (border and background)
- Buttons: `transition-all` (background and scale)

### Cart Badge:
- Always visible when cart has items
- Updates instantly when items added/removed

---

## Accessibility

### Keyboard Navigation:
- All buttons are keyboard accessible
- Modal can be closed with ESC key (future enhancement)
- Tab order follows logical flow

### Screen Readers:
- Store link announces "Link, [Store Name]"
- Cart button announces "Button, Cart, 2 items"
- Modal title announces "Store Locator"

### Color Contrast:
- All text meets WCAG AA standards
- Blue links have sufficient contrast
- Badges are high contrast (blue/white)

---

## Future Enhancements

### Location Bar:
- [ ] Add delivery/pickup toggle
- [ ] Show estimated delivery time
- [ ] Add "Change" text next to store name

### Store Selector:
- [ ] Add map view (Google Maps)
- [ ] Filter by services offered
- [ ] Filter by amenities
- [ ] Sort by distance, rating, or name
- [ ] Show real-time availability
- [ ] Add favorites/recent stores

### Cart Badge:
- [ ] Animate when items added
- [ ] Show mini cart preview on hover
- [ ] Display total price

---

**Everything is now implemented and ready for testing!** 🎉

