# Promotions Grouping and Filtering Update

## Summary
Updated the promotions display across all views to group promotions into "My Enrolled Promotions" and "Available Promotions", and added proper filtering to ensure only active promotions within their date range are displayed.

## Changes Made

### 1. Loyalty Page (`loyalty-app/src/app/loyalty/page.tsx`)
**Location:** Promotions tab section

**Changes:**
- Added `CheckCircle` icon import from `lucide-react`
- Implemented client-side filtering to ensure promotions meet criteria:
  - `is_active = true`
  - Current date is between `start_date_time` (or `start_date`) and `end_date_time` (or `end_date`)
- Grouped promotions into two sections:
  - **My Enrolled Promotions**: Shows promotions where `is_enrolled = true`
    - Green border and background styling
    - Shows "✓ Enrolled" badge
    - Displays enrollment date
  - **Available Promotions**: Shows promotions where `is_enrolled = false`
    - Standard gray border styling
    - Available to all members

**UI Improvements:**
- Each section has a distinct header with icon and count
- Section descriptions explain what each category contains
- Promotion cards show relevant dates and point values
- Empty state message when no promotions are available

### 2. Customer 360 Modal (`public/components/modals/Customer360Modal.js`)
**Location:** `renderPromotionsTab()` function

**Changes:**
- Added client-side filtering before grouping promotions:
  - Filters out inactive promotions
  - Filters out promotions outside their date range
  - Validates both `start_date_time`/`start_date` and `end_date_time`/`end_date` fields
- Groups filtered promotions by `promotion_source`:
  - `customer`: My Enrolled Promotions
  - `tier`: Tier Member Promotions (tier-specific)
  - `general`: Available Promotions (general)

**Note:** This view maintains the three-way grouping (customer/tier/general) as it provides more granular information in the 360 view.

### 3. Backend API Updates (`server.js`)

#### Endpoint: `/api/customers/:id/promotions` (Line 7197)
**Changes:**
- Added date range filtering to all three promotion queries:

**Customer-specific promotions:**
```sql
AND (p.start_date_time IS NULL OR p.start_date_time <= NOW())
AND (p.end_date_time IS NULL OR p.end_date_time >= NOW())
```

**Tier promotions:**
```sql
AND (p.start_date_time IS NULL OR p.start_date_time <= NOW())
AND (p.end_date_time IS NULL OR p.end_date_time >= NOW())
```

**General promotions:**
```sql
AND (p.start_date_time IS NULL OR p.start_date_time <= NOW())
AND (p.end_date_time IS NULL OR p.end_date_time >= NOW())
```

**Existing filters maintained:**
- All queries already checked `p.is_active = true`

#### Endpoint: `/api/loyalty/:loyaltyNumber/promotions` (Line 3368)
**Status:** ✅ Already properly filtered
- Already includes `is_active = true` check
- Already includes date range validation
- No changes needed

### 4. POS Customer Management View (`public/components/views/LoyaltyView.js`)
**Location:** Customer search results promotions section (around line 673)

**Changes:**
- Wrapped promotions rendering in IIFE to add filtering logic
- Added the same client-side filtering as other views:
  - Active status check
  - Date range validation for both start and end dates
- Grouped promotions into two sections:
  - **My Enrolled Promotions**: Green styling with "✓" icon
  - **Available Promotions**: Standard styling with Tag icon
- Each section has:
  - Count in the header
  - Descriptive subtitle
  - Proper spacing between sections

**UI Consistency:**
- Matches the styling and structure of the loyalty page
- Maintains the existing promotion card design
- Shows progress bars for enrolled promotions with targets

## Filtering Logic

### Date Validation
All views now check:
1. **Start Date**: If `start_date_time` or `start_date` exists, it must be <= current date
2. **End Date**: If `end_date_time` or `end_date` exists, it must be >= current date
3. **Active Status**: `is_active` must be `true`

### Backend + Frontend Defense
- **Backend**: Filters at the database query level for performance
- **Frontend**: Additional client-side filtering for safety and immediate feedback

## Testing Checklist

### Loyalty Page (`/loyalty/loyalty`)
- [ ] Enrolled promotions appear in "My Enrolled Promotions" section
- [ ] Available promotions appear in "Available Promotions" section
- [ ] Only active promotions within date range are shown
- [ ] Promotion counts are correct in section headers
- [ ] Empty state shows when no promotions available

### Customer 360 Modal (POS)
- [ ] Three promotion sections appear correctly (customer/tier/general)
- [ ] Only active and date-valid promotions are shown
- [ ] Enrolled badge appears on customer promotions
- [ ] Promotion cards display all relevant information

### Customer Search Results (POS)
- [ ] Promotions are grouped by enrollment status
- [ ] Filtering works correctly
- [ ] Section headers show correct counts
- [ ] Visual distinction between enrolled and available promotions

## Database Schema Reference

### Relevant Tables
- `promotions`: Main promotions table with `is_active`, `start_date_time`, `end_date_time`
- `customer_promotions`: Enrollment records linking customers to promotions
- `loyalty_tier_promotions`: Tier-specific promotion assignments

### Key Fields
- `promotions.is_active`: Boolean flag for promotion status
- `promotions.start_date_time` / `start_date`: Promotion start date
- `promotions.end_date_time` / `end_date`: Promotion end date
- `customer_promotions.is_enrollment_active`: Whether customer enrollment is active
- `promotion_source`: Frontend grouping field ('customer', 'tier', 'general')

## Notes

1. **Date Field Flexibility**: Code handles both `_time` suffixed fields (datetime) and regular date fields for compatibility
2. **Null Date Handling**: NULL start dates are treated as "starts immediately", NULL end dates as "no expiration"
3. **Performance**: Backend filtering reduces data transfer and improves client performance
4. **Consistency**: All views now use the same filtering and grouping logic
5. **Visual Distinction**: Enrolled promotions use green accents, available use blue/gray tones

## Files Modified

1. `loyalty-app/src/app/loyalty/page.tsx` - Loyalty page promotions tab
2. `public/components/modals/Customer360Modal.js` - Customer 360 view modal
3. `server.js` - Backend API endpoint `/api/customers/:id/promotions`
4. `public/components/views/LoyaltyView.js` - POS customer search promotions

