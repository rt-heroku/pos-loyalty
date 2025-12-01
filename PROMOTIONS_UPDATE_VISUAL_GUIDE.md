# Promotions Grouping - Visual Guide

## Overview
This document provides a visual comparison of the promotions display before and after the update.

---

## 📍 Location: `/loyalty/loyalty` - Promotions Tab

### ❌ BEFORE
```
┌─────────────────────────────────────────────────────┐
│  My Promotions (11)                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │ Promotion  │  │ Promotion  │  │ Promotion  │  │
│  │    #1      │  │    #2      │  │    #3      │  │
│  │            │  │            │  │            │  │
│  │ ✓ Enrolled │  │            │  │ ✓ Enrolled │  │
│  └────────────┘  └────────────┘  └────────────┘  │
│                                                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │ Promotion  │  │ Promotion  │  │ Promotion  │  │
│  │    #4      │  │    #5      │  │    #6      │  │
│  │            │  │            │  │            │  │
│  │            │  │ ✓ Enrolled │  │            │  │
│  └────────────┘  └────────────┘  └────────────┘  │
│                                                     │
│  ... (all mixed together)                          │
│                                                     │
└─────────────────────────────────────────────────────┘

Issues:
- No clear separation between enrolled and available
- May show inactive or expired promotions
- Hard to identify which promotions you're in
```

### ✅ AFTER
```
┌─────────────────────────────────────────────────────┐
│  ✓ My Enrolled Promotions (1)                      │
│  Promotions you're currently enrolled in           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────┐                      │
│  │ $100 OFF - Silver Status │ [Green Border]       │
│  │                          │                      │
│  │ Get %100 off on original │                      │
│  │ price products           │                      │
│  │                          │                      │
│  │ ✓ Enrolled              │                      │
│  │ Enrolled: 12/1/2025     │                      │
│  │ 📅 Until: 12/31/2025    │                      │
│  └──────────────────────────┘                      │
│                                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  🎁 Available Promotions (11)                       │
│  General promotions available to all members        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │ $150 OFF   │  │ Double Pts │  │ 20% OFF    │  │
│  │            │  │            │  │            │  │
│  │ 150 Points │  │ 200 Points │  │ 100 Points │  │
│  │ Until:     │  │ Until:     │  │ Until:     │  │
│  │ 1/15/2026  │  │ 2/28/2026  │  │ 12/31/2025 │  │
│  └────────────┘  └────────────┘  └────────────┘  │
│                                                     │
│  ... (more available promotions)                   │
│                                                     │
└─────────────────────────────────────────────────────┘

Benefits:
✓ Clear visual separation
✓ Easy to see your enrolled promotions
✓ Only shows active promotions within date range
✓ Section counts help track promotions
```

---

## 📍 Location: Customer 360° View (POS Modal)

### ❌ BEFORE
```
┌─────────────────────────────────────────────────────┐
│  Promotions Tab                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [All promotions listed together]                  │
│  - Customer promotions                             │
│  - Tier promotions                                 │
│  - General promotions                              │
│  - May include expired promotions                  │
│  - May include inactive promotions                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### ✅ AFTER
```
┌─────────────────────────────────────────────────────┐
│  ✓ My Enrolled Promotions (1)                      │
│  Promotions you're currently enrolled in           │
├─────────────────────────────────────────────────────┤
│  [Customer-specific enrolled promotions]           │
│  - Green styling                                   │
│  - Shows enrollment date                           │
│  - Shows progress (if applicable)                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  👑 Silver Member Promotions (3)                    │
│  Exclusive promotions for your membership tier     │
├─────────────────────────────────────────────────────┤
│  [Tier-specific promotions]                        │
│  - Purple styling                                  │
│  - Exclusive to tier                               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  🏷️ Available Promotions (11)                       │
│  General promotions available to all members       │
├─────────────────────────────────────────────────────┤
│  [General promotions]                              │
│  - Blue styling                                    │
│  - Available to everyone                           │
└─────────────────────────────────────────────────────┘

Benefits:
✓ Three-way grouping for detailed view
✓ Tier-specific promotions clearly identified
✓ Only active, valid promotions shown
✓ Visual hierarchy matches importance
```

---

## 📍 Location: POS Customer Search Results

### ❌ BEFORE
```
When searching for a customer:

┌─────────────────────────────────────────────────────┐
│  Available Promotions                               │
├─────────────────────────────────────────────────────┤
│  [All promotions mixed together]                   │
│  - Enrolled and available not separated            │
│  - May show expired/inactive promotions            │
└─────────────────────────────────────────────────────┘
```

### ✅ AFTER
```
When searching for a customer:

┌─────────────────────────────────────────────────────┐
│  ✓ My Enrolled Promotions (1)                      │
│  Promotions you're currently enrolled in           │
├─────────────────────────────────────────────────────┤
│  [Enrolled promotions with green styling]          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  🏷️ Available Promotions (11)                       │
│  General promotions available to all members       │
├─────────────────────────────────────────────────────┤
│  [Available promotions with standard styling]      │
└─────────────────────────────────────────────────────┘

Benefits:
✓ Matches loyalty page styling
✓ Clear grouping in search results
✓ Only active promotions shown
```

---

## 🔍 Filtering Logic (All Views)

### Promotions are now filtered to show ONLY promotions where:

```javascript
✓ is_active = true
✓ start_date <= today (if start_date exists)
✓ end_date >= today (if end_date exists)
```

### This filtering happens in TWO places:

1. **Backend (Database Query)**
   ```sql
   WHERE p.is_active = true
     AND (p.start_date_time IS NULL OR p.start_date_time <= NOW())
     AND (p.end_date_time IS NULL OR p.end_date_time >= NOW())
   ```

2. **Frontend (JavaScript)**
   ```javascript
   const activePromotions = promotions.filter(promo => {
     if (!promo.is_active) return false;
     if (promo.start_date_time && new Date(promo.start_date_time) > now) return false;
     if (promo.end_date_time && new Date(promo.end_date_time) < now) return false;
     return true;
   });
   ```

---

## 🎨 Visual Design Changes

### Color Scheme

**Enrolled Promotions:**
- Border: Green (#10b981 / green-500)
- Background: Light green (#f0fdf4 / green-50)
- Badge: Dark green with white text
- Icon: Green checkmark (✓)

**Available Promotions:**
- Border: Gray (#e5e7eb / gray-200)
- Background: Light gray (#f9fafb / gray-50)
- No badge
- Icon: Blue gift box (🎁) or tag (🏷️)

**Tier Promotions (360 View Only):**
- Border: Purple
- Background: Light purple
- Icon: Purple crown (👑) or award

### Section Headers

Each section now has:
- Icon in a rounded circle
- Bold title with count: "My Enrolled Promotions (1)"
- Subtitle explaining the section
- Proper spacing between sections

---

## 📊 Data Flow

```
1. User visits page
   ↓
2. Frontend fetches promotions from API
   ↓
3. Backend queries database WITH filters
   - is_active = true
   - Date range validation
   ↓
4. Frontend receives filtered data
   ↓
5. Frontend applies additional filtering (safety)
   ↓
6. Promotions grouped by enrollment status
   ↓
7. Rendered in separate sections with styling
```

---

## ✅ What This Fixes

1. **Clarity**: Users can immediately see which promotions they're enrolled in
2. **Accuracy**: Only active, current promotions are displayed
3. **Organization**: Logical grouping makes it easier to browse
4. **Consistency**: Same grouping across all views (loyalty page, 360 view, search)
5. **Visual Hierarchy**: Green = enrolled (action taken), Blue = available (action possible)

---

## 🧪 Testing Scenarios

### Scenario 1: Customer with Enrolled Promotions
- Should see "My Enrolled Promotions" section with 1+ cards
- Should see "Available Promotions" section with remaining promotions
- Enrolled cards should have green styling and badge

### Scenario 2: Customer with No Enrolled Promotions
- Should NOT see "My Enrolled Promotions" section
- Should see "Available Promotions" section with all active promotions

### Scenario 3: Expired Promotion
- If promotion end_date is in the past
- Should NOT appear in any list

### Scenario 4: Future Promotion
- If promotion start_date is in the future
- Should NOT appear in any list

### Scenario 5: Inactive Promotion
- If is_active = false
- Should NOT appear in any list

---

## 📝 Summary

**Before**: One mixed list of all promotions, possibly including expired/inactive ones

**After**: 
- Clearly separated "My Enrolled" and "Available" sections
- Only active promotions within their date range
- Visual distinction with colors and icons
- Consistent across all views

