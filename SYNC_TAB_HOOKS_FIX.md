# Sync Tab React Hooks Fix

## Date: November 24, 2025

## Issue
**Error**: `Rendered more hooks than during the previous render`

This error occurred when clicking on the Sync tab in the Customer 360 Modal.

## Root Cause

**Violation of React Rules of Hooks**: State hooks were being declared inside the `renderSyncTab()` function, which is called conditionally based on which tab is active.

### Problematic Code:
```javascript
const renderSyncTab = () => {
    const [syncing, setSyncing] = React.useState(false);      // ❌ WRONG
    const [lastSync, setLastSync] = React.useState(null);     // ❌ WRONG
    
    const handleRefreshAll = async () => {
        // ...
    };
    // ...
}
```

### Why This Is Wrong:
1. React hooks **must** be called at the top level of the component
2. Hooks **cannot** be called conditionally or inside nested functions
3. Hooks **must** be called in the same order on every render
4. When `activeTab !== 'sync'`, these hooks weren't called, causing a mismatch in hook count

## The Fix

Moved the state declarations to the top level of the component, alongside other state hooks:

### Corrected Code:
```javascript
window.Modals.Customer360Modal = ({ customer, isOpen, onClose }) => {
    // All hooks at top level ✅
    const [activeTab, setActiveTab] = React.useState('info');
    const [loading, setLoading] = React.useState(false);
    const [promotions, setPromotions] = React.useState([]);
    const [vouchers, setVouchers] = React.useState([]);
    const [onlineOrders, setOnlineOrders] = React.useState([]);
    const [salesforceOrders, setSalesforceOrders] = React.useState([]);
    const [transactions, setTransactions] = React.useState([]);
    const [customerAvatar, setCustomerAvatar] = React.useState(null);
    const [syncing, setSyncing] = React.useState(false);      // ✅ CORRECT
    const [lastSync, setLastSync] = React.useState(null);     // ✅ CORRECT
    
    // ... rest of component
    
    const renderSyncTab = () => {
        // Now just uses the state from above
        const handleRefreshAll = async () => {
            setSyncing(true);
            // ...
        };
        // ...
    };
};
```

## Rules of Hooks (Refresher)

React has strict rules for hooks:

1. ✅ **Only call hooks at the top level** - Don't call hooks inside loops, conditions, or nested functions
2. ✅ **Only call hooks from React functions** - Call them from React function components or custom hooks
3. ✅ **Call hooks in the same order** - React relies on the order hooks are called to maintain state

## Benefits of the Fix

1. **Stable Hook Order**: Hooks are now called in the same order on every render
2. **No Conditional Calls**: State exists regardless of active tab
3. **Proper State Management**: State persists when switching between tabs
4. **Better Performance**: State doesn't reset when changing tabs and coming back

## Files Modified

1. `/public/components/modals/Customer360Modal.js`
   - Moved `syncing` state to top level (line ~30)
   - Moved `lastSync` state to top level (line ~31)
   - Removed state declarations from `renderSyncTab()` function

## Testing Checklist

- [x] No React Hooks errors in console
- [x] Sync tab opens without errors
- [x] Can switch between tabs without errors
- [x] Refresh All Data button works
- [x] Sync with Salesforce button works
- [x] Loading states work correctly
- [x] Last sync timestamp persists between tab changes

## Additional Notes

This is a common React mistake when building complex UIs with conditional rendering. The fix demonstrates the importance of:
- Understanding React's component lifecycle
- Following the Rules of Hooks strictly
- Declaring all state at the component's top level
- Testing tab/view switching thoroughly

## References

- [React Hooks Rules](https://react.dev/reference/rules/rules-of-hooks)
- [useState Hook](https://react.dev/reference/react/useState)
- [Component State](https://react.dev/learn/state-a-components-memory)

