# Top Bar & Sidebar - Visual Guide

## Complete Layout Overview

### Desktop View - Sidebar Expanded
```
┌─────────────────────────────────────────────────────────────────┐
│ [☰] [LOYALTY]          [    Search bar    ]         🔔  👤     │ ← Top Bar
├────────────────┬────────────────────────────────────────────────┤
│  🏠  Dashboard │                                                │
│  👤  Profile   │                                                │
│  👑  Loyalty   │           MAIN CONTENT AREA                    │
│  🧾  Orders    │                                                │
│  🛍️  Shop      │                                                │
│  ⚙️  Settings  │                                                │
│  ❓  Help      │                                                │
├────────────────┤                                                │
│  🚪  Sign out  │                                                │
└────────────────┴────────────────────────────────────────────────┘
   256px (64)         Content shifts with margin-left: 256px
```

### Desktop View - Sidebar Collapsed
```
┌─────────────────────────────────────────────────────────────────┐
│ [☰] [LOYALTY]          [    Search bar    ]         🔔  👤     │ ← Top Bar
├───┬─────────────────────────────────────────────────────────────┤
│🏠 │                                                             │
│👤 │                                                             │
│👑 │                MAIN CONTENT AREA                            │
│🧾 │                                                             │
│🛍️│                                                             │
│⚙️│                                                             │
│❓│                                                             │
├───┤                                                             │
│🚪│                                                             │
└───┴─────────────────────────────────────────────────────────────┘
 64px (16)       Content shifts with margin-left: 64px
```

### Mobile View - Sidebar Closed
```
┌───────────────────────┐
│ [☰] [LOYALTY]  🔔  👤 │ ← Top Bar
├───────────────────────┤
│                       │
│                       │
│   MAIN CONTENT AREA   │
│                       │
│                       │
│                       │
└───────────────────────┘
  Sidebar hidden
  Content full-width
```

### Mobile View - Sidebar Open
```
┌──────────────┬────────┐
│ 🏠 Dashboard │▓▓▓▓▓▓▓▓│ ← Dark backdrop
│ 👤 Profile   │▓▓▓▓▓▓▓▓│
│ 👑 Loyalty   │▓▓▓▓▓▓▓▓│
│ 🧾 Orders    │▓▓▓▓▓▓▓▓│
│ 🛍️ Shop      │▓▓▓▓▓▓▓▓│
│ ⚙️ Settings  │▓▓▓▓▓▓▓▓│
│ ❓ Help      │▓▓▓▓▓▓▓▓│
│──────────────│▓▓▓▓▓▓▓▓│
│ 🚪 Sign out  │▓▓▓▓▓▓▓▓│
└──────────────┴────────┘
   320px (80)   Overlay
```

---

## Top Bar Detailed View

### Desktop Layout
```
┌──────────────────────────────────────────────────────────────────┐
│  ╔═══╗  ╔═══════╗           ╔══════════════════╗      ╔═╗  ╔═╗ │
│  ║ ☰ ║  ║LOYALTY║           ║  🔍 Search...   ║      ║🔔║  ║👤║ │
│  ╚═══╝  ╚═══════╝           ╚══════════════════╝      ╚═╝  ╚═╝ │
│                                                                  │
│  ├──────────────┤            ├──────────────────┤      ├──────┤ │
│    Left (Logo)                 Center (Search)      Right (User)│
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown:

#### Left Section (flex items-center space-x-3)
```
[☰]  [LOYALTY]
 │        │
 │        └─ Logo (SVG text)
 │           - Color: #2563EB (blue-600)
 │           - Size: 20px bold
 │           - Width: 80px (w-20)
 │
 └─ Hamburger Menu
    - Icon size: 24px (h-6 w-6)
    - Padding: 8px (p-2)
    - Hover: bg-gray-100
    - Active: bg-primary-50 text-primary-600
```

#### Center Section (flex-1 max-w-2xl mx-8)
```
┌────────────────────────────────────┐
│ 🔍  Search...                      │
└────────────────────────────────────┘
│
├─ Search Icon (left-3)
│  - Size: 20px (h-5 w-5)
│  - Color: gray-400
│
├─ Input Field
│  - Padding: 10px 16px (py-2.5 pl-11 pr-4)
│  - Border: gray-300
│  - Rounded: xl (12px)
│  - Focus: blue-500 ring
│
└─ Max Width: 672px (max-w-2xl)
```

#### Right Section (flex items-center space-x-2)
```
[🔔]  [👤]
 │     │
 │     └─ Avatar
 │        - Size: 36x36px (h-9 w-9)
 │        - Rounded: full
 │        - Gradient: blue-500 to blue-600
 │        - Click: Opens user menu
 │
 └─ Notifications
    - Icon size: 20px (h-5 w-5)
    - Badge: 8px red dot (top-right)
    - Click: Opens notifications dropdown
```

---

## Sidebar Detailed View

### Collapsed State (Desktop)
```
┌────┐
│ [◀]│ ← Toggle button (absolute position)
├────┤
│    │
│ 🏠 │ ← Dashboard icon only
│    │   Tooltip on hover: "Dashboard"
├────┤
│    │
│ 👤 │ ← Profile
│    │   Tooltip: "Profile"
├────┤
│    │
│ 👑 │ ← Loyalty
│    │   Tooltip: "Loyalty"
├────┤
│    │
│ 🧾 │ ← Orders
│    │   Tooltip: "Orders"
├────┤
│    │
│ 🛍️ │ ← Shop
│    │   Tooltip: "Shop"
├────┤
│    │
│ ⚙️ │ ← Settings
│    │   Tooltip: "Settings"
├────┤
│    │
│ ❓ │ ← Help
│    │   Tooltip: "Help"
├────┤
│    │
│ 🚪 │ ← Sign out
│    │   Tooltip: "Sign out"
└────┘

Width: 64px (w-16)
Icon size: 24px (h-6 w-6)
Padding: 12px vertical (py-3)
```

### Expanded State (Desktop)
```
┌──────────────────┐
│              [▶] │ ← Toggle button
├──────────────────┤
│                  │
│  🏠  Dashboard   │ ← Icon + Label
│                  │
├──────────────────┤
│                  │
│  👤  Profile     │
│                  │
├──────────────────┤
│                  │
│  👑  Loyalty     │ ← Active state (blue bg)
│                  │
├──────────────────┤
│                  │
│  🧾  Orders      │
│                  │
├──────────────────┤
│                  │
│  🛍️  Shop        │
│                  │
├──────────────────┤
│                  │
│  ⚙️  Settings    │
│                  │
├──────────────────┤
│                  │
│  ❓  Help        │
│                  │
├──────────────────┤
│                  │
│  🚪  Sign out    │
│                  │
└──────────────────┘

Width: 256px (w-64)
Icon size: 24px (h-6 w-6)
Label: text-sm font-medium
Spacing: mr-3 between icon and label
```

### Toggle Button Detail
```
     Sidebar
        │
        ▼
┌───────────┐
│           │
│         ● │ ← Toggle button
│           │   Position: absolute
└───────────┘   Right: -12px
                Top: 80px
                Size: 24px (h-6 w-6)
                Background: white
                Border: gray-200
                Shadow: md
                Hover: bg-gray-50

Icon: ChevronLeft
Collapsed: rotate-180deg
Transition: all 300ms
```

### Tooltip (Collapsed Mode)
```
┌────┐           ┌───────────┐
│    │           │ Dashboard │
│ 🏠 │  ───────▶ └───────────┘
│    │              │
└────┘              └─ Appears on hover
                      - Background: gray-900
                      - Text: white
                      - Padding: 8px 12px
                      - Border-radius: 8px
                      - Arrow: 8px triangle
                      - Position: left-full ml-2
                      - Z-index: 50
```

---

## Interactive States

### Menu Item - Default State
```
┌──────────────────┐
│  🏠  Dashboard   │ ← Gray icon, dark text
└──────────────────┘
   Icon: text-gray-500
   Text: text-gray-700
   Background: transparent
```

### Menu Item - Hover State
```
┌──────────────────┐
│  🏠  Dashboard   │ ← Darker icon, dark text
└──────────────────┘   Light gray background
   Icon: text-gray-700
   Text: text-gray-900
   Background: bg-gray-100
```

### Menu Item - Active State
```
┌──────────────────┐
│  👑  Loyalty     │ ← Blue icon, blue text
└──────────────────┘   Light blue background
   Icon: text-blue-600
   Text: text-blue-700
   Background: bg-blue-50
```

---

## Animations & Transitions

### Sidebar Collapse/Expand
```
Expanded (256px)  ──────▶  Collapsed (64px)
                  300ms
                  ease-in-out

Content Margin:
256px  ──────▶  64px
       300ms
       ease-in-out
```

### Mobile Sidebar Slide In/Out
```
Hidden (-100%)  ──────▶  Visible (0%)
                300ms
                ease-in-out

Backdrop:
transparent  ──────▶  bg-black/50
             300ms
```

### Tooltip Fade In/Out
```
Hidden (opacity-0)  ──────▶  Visible (opacity-100)
                    200ms
                    ease

Position:
- Always left-full ml-2
- Vertical center: top-1/2 -translate-y-1/2
```

### Button Hover Effects
```
Default  ──────▶  Hover
         200ms
         transition-colors

Example:
bg-transparent  ──────▶  bg-gray-100
text-gray-700   ──────▶  text-gray-900
```

---

## Responsive Breakpoints

### Mobile (<1024px)
```
Top Bar:
- Hamburger + Logo on left
- Search hidden (can add in future)
- Bell + Avatar on right

Sidebar:
- Hidden by default
- Slides in on hamburger click
- Full overlay with backdrop
- Width: 320px (w-80)
- Close button visible

Content:
- Full width (no margin)
- Shifts when sidebar opens
```

### Desktop (≥1024px)
```
Top Bar:
- Hamburger + Logo on left
- Search centered (max-w-2xl)
- Bell + Avatar on right

Sidebar:
- Always visible
- Collapsible (64px ↔ 256px)
- Toggle button visible
- Tooltips in collapsed mode
- No close button

Content:
- Margin adjusts automatically
- ml-16 (collapsed) or ml-64 (expanded)
- Smooth transition (300ms)
```

---

## Color Palette

### Primary Colors
```
Blue (Primary):
- blue-500: #3B82F6
- blue-600: #2563EB (logo, active icons)
- blue-700: #1D4ED8 (active text)
- blue-50:  #EFF6FF (active background)

Gray (Neutral):
- gray-50:  #F9FAFB (app background)
- gray-100: #F3F4F6 (hover background)
- gray-200: #E5E7EB (borders)
- gray-300: #D1D5DB (input border)
- gray-400: #9CA3AF (placeholder)
- gray-500: #6B7280 (default icons)
- gray-600: #4B5563 (default buttons)
- gray-700: #374151 (default text)
- gray-900: #111827 (tooltip background)

Red (Notifications):
- red-500:  #EF4444 (notification dot)
- red-600:  #DC2626 (logout hover)
- red-50:   #FEF2F2 (logout hover bg)
```

### Gradients
```
Avatar Gradient:
from-blue-500 to-blue-600

Example:
background: linear-gradient(
  to bottom right,
  #3B82F6,
  #2563EB
);
```

---

## Spacing System

### Top Bar
```
Height: 64px (h-16)
Padding X: 16-32px (px-4 sm:px-6 lg:px-8)
Section Spacing: 12px (space-x-3, space-x-2)

Logo:
- Height: 32px (h-8)
- Width: 80px (w-20)

Search:
- Max Width: 672px (max-w-2xl)
- Margin X: 32px (mx-8)

Avatar:
- Size: 36x36px (h-9 w-9)

Bell Icon:
- Size: 20x20px (h-5 w-5)
```

### Sidebar
```
Collapsed Width: 64px (w-16)
Expanded Width: 256px (w-64)
Mobile Width: 320px (w-80)

Item Padding:
- Vertical: 12px (py-3)
- Horizontal: 12px (px-3)
- Icon-Label Gap: 12px (space-x-3, mr-3)

Toggle Button:
- Size: 24x24px (h-6 w-6)
- Position Right: -12px (-right-3)
- Position Top: 80px (top-20)

Tooltip:
- Padding: 8px 12px (px-3 py-2)
- Margin Left: 8px (ml-2)
- Arrow Size: 8px (w-2 h-2)
```

---

## Z-Index Layers

```
Layer 50: Sidebar (mobile overlay)
Layer 40: Backdrop (mobile)
Layer 30: Top Bar (sticky)
Layer 20: Dropdowns (notifications, user menu)
Layer 10: Tooltips
Layer 1:  Content
```

---

## Accessibility

### Keyboard Navigation
```
Tab: Navigate through interactive elements
Enter/Space: Activate buttons
Escape: Close sidebar (mobile)
Shift+Tab: Navigate backwards
```

### ARIA Labels
```
Hamburger Button:
aria-label="Toggle menu"

Toggle Button (Desktop):
aria-label="Expand sidebar" (collapsed)
aria-label="Collapse sidebar" (expanded)

Close Button (Mobile):
aria-label="Close menu"
```

### Focus States
```
All interactive elements have focus states:
- Outline: focus:outline-none
- Ring: focus:ring-2 focus:ring-blue-500
- Border: focus:border-transparent
```

### Screen Reader Support
```
- Semantic HTML (nav, aside, button)
- Descriptive text for icons
- ARIA labels where needed
- Focus management on open/close
```

---

## Performance Optimization

### CSS
```
✅ Hardware-accelerated transitions
✅ transform (not left/width for sliding)
✅ opacity for fade effects
✅ will-change for animations
```

### JavaScript
```
✅ localStorage polling: 100ms interval
✅ Debounced resize handler
✅ Conditional rendering (mobile overlay)
✅ Event delegation where possible
```

### React
```
✅ useState for local state
✅ useEffect for side effects
✅ Memoized callbacks (where needed)
✅ No unnecessary re-renders
```

---

## Browser DevTools Tips

### Inspect Sidebar State
```javascript
// Check localStorage
localStorage.getItem('sidebarCollapsed')
// Returns: "true" or "false"

// Toggle from console
localStorage.setItem('sidebarCollapsed', 'true')
window.location.reload()
```

### CSS Classes to Watch
```css
/* Sidebar width */
.lg\:w-16   /* Collapsed: 64px */
.lg\:w-64   /* Expanded: 256px */

/* Content margin */
.lg\:ml-16  /* Content margin when collapsed */
.lg\:ml-64  /* Content margin when expanded */
.lg\:ml-0   /* Content margin when closed */

/* Tooltip visibility */
.opacity-0  /* Hidden */
.opacity-100 /* Visible on hover */
```

### Animation Timing
```css
/* All transitions */
.duration-300 /* 300ms for collapse/expand */
.duration-200 /* 200ms for hover effects */

.ease-in-out  /* Sidebar transitions */
.transition-all /* Apply to all properties */
```

---

## Common Use Cases

### 1. User wants more screen space
```
Action: Click toggle button (chevron)
Result: Sidebar collapses to icons only
Effect: Content expands (gain 192px width)
Saved: State persists after refresh
```

### 2. User on mobile device
```
Action: Click hamburger menu
Result: Sidebar slides in with backdrop
Action: Navigate to page
Result: Sidebar auto-closes
```

### 3. User needs help identifying icon
```
Context: Sidebar is collapsed
Action: Hover over icon
Result: Tooltip appears with label
Duration: Appears immediately on hover
```

### 4. User searches for content
```
Location: Top bar center
Action: Click search input
Result: Focus with blue ring
Type: Search query
Result: (Future: Live search results)
```

---

**Implementation Complete!** ✅  
**All visuals documented!** 📐  
**Ready for development handoff!** 🚀

