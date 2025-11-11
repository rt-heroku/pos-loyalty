# 📊 Tableau Dashboard Implementation

## Overview
Added a new **Dashboard** menu item to the Operations dropdown that displays a Tableau visualization embedded directly in the POS container.

---

## 🎯 Features

### ✅ What Was Added

1. **New Menu Item**: "Dashboard" under Operations dropdown (after Sales Report)
2. **Tableau Integration**: Embedded Tableau Embedding API 3.x
3. **Full-Screen View**: Dashboard takes full container height
4. **Responsive Design**: Adapts to screen size
5. **Loading State**: Shows spinner while Tableau API loads
6. **Location Context**: Displays selected location in header
7. **Theme Support**: Works with light/dark mode

---

## 📁 Files Created/Modified

### New Files:
- **`public/components/views/DashboardView.js`**
  - React component for Tableau dashboard
  - Dynamically loads Tableau Embedding API
  - Creates `<tableau-viz>` web component
  - Handles loading states and cleanup

### Modified Files:
- **`public/app.js`**
  - Added 'dashboard' to Operations dropdown menu
  - Updated active view state check
  - Added dashboard view rendering
  
- **`public/index.html`**
  - Added DashboardView.js script tag

---

## 🗺️ Navigation Structure

```
Operations (Dropdown)
├── Loyalty
├── Promotions  
├── Products
├── Orders
├── ─────────────── (divider)
├── Sales Report
└── Dashboard ← NEW
```

---

## 🔧 Technical Implementation

### Tableau Configuration

**Visualization URL**:
```
https://10ax.online.tableau.com/t/rcgsepulse/views/ScottsRestaurantBar/FranchiseeExecDash
```

**API Used**:
```javascript
https://10ax.online.tableau.com/javascripts/api/tableau.embedding.3.latest.min.js
```

**Web Component**:
```html
<tableau-viz 
  id="tableau-viz"
  src="https://10ax.online.tableau.com/t/rcgsepulse/views/ScottsRestaurantBar/FranchiseeExecDash"
  width="100%"
  height="100%"
  toolbar="bottom">
</tableau-viz>
```

---

## 🎨 Component Structure

### DashboardView Component

```javascript
window.Views.DashboardView = ({ selectedLocation }) => {
  // State
  const [scriptLoaded, setScriptLoaded] = React.useState(false);
  const containerRef = React.useRef(null);

  // Load Tableau API on mount
  React.useEffect(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://10ax.online.tableau.com/javascripts/api/tableau.embedding.3.latest.min.js';
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
    
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Create tableau-viz element when API loaded
  React.useEffect(() => {
    if (scriptLoaded && containerRef.current) {
      containerRef.current.innerHTML = '';
      const tableauViz = document.createElement('tableau-viz');
      tableauViz.setAttribute('src', '...');
      tableauViz.setAttribute('width', '100%');
      tableauViz.setAttribute('height', '100%');
      tableauViz.setAttribute('toolbar', 'bottom');
      containerRef.current.appendChild(tableauViz);
    }
  }, [scriptLoaded]);

  return (
    // Header with title and location badge
    // Container for Tableau visualization
    // Loading spinner while API loads
  );
};
```

---

## 🚀 How to Use

### For Users:

1. **Navigate to Dashboard**:
   - Click **Operations** in top menu
   - Select **Dashboard** from dropdown

2. **View Analytics**:
   - Dashboard loads in full-screen
   - Interact with Tableau visualizations
   - Use toolbar at bottom for controls

3. **Location Context**:
   - Selected location shown in header
   - Dashboard data filtered by location (if configured in Tableau)

### For Developers:

**To Change Tableau URL**:
```javascript
// In DashboardView.js, line ~43
tableauViz.setAttribute('src', 'YOUR_NEW_TABLEAU_URL');
```

**To Customize Size**:
```javascript
// In DashboardView.js, line ~44-45
tableauViz.setAttribute('width', '1366');  // Fixed width
tableauViz.setAttribute('height', '831');  // Fixed height
```

**To Change Toolbar Position**:
```javascript
// In DashboardView.js, line ~46
tableauViz.setAttribute('toolbar', 'top');  // or 'bottom', 'hidden'
```

---

## 🎯 Requirements

### Prerequisites:
- ✅ Location must be selected
- ✅ User must have access to Operations menu
- ✅ Internet connection (for Tableau API)

### Browser Support:
- ✅ Modern browsers with ES6 module support
- ✅ Web Components support
- ✅ Tested on Chrome, Firefox, Safari, Edge

---

## 🐛 Troubleshooting

### Dashboard Not Loading?

**Check Console for Errors**:
```javascript
// Should see:
✅ Tableau Embedding API loaded
📊 Initializing Tableau visualization
```

**Common Issues**:

1. **Script Failed to Load**:
   - Check internet connection
   - Verify Tableau URL is accessible
   - Check browser console for CORS errors

2. **Blank Dashboard**:
   - Ensure Tableau visualization is published
   - Check Tableau URL is correct
   - Verify permissions on Tableau side

3. **Dashboard Not Responsive**:
   - Check container has proper height
   - Verify width/height are set to 100%

---

## 📊 Dashboard Features

### What Users Can Do:

- **Interactive Filters**: Click on data points to filter
- **Drill Down**: Explore detailed data
- **Export**: Download data/images (if enabled)
- **Refresh**: Update data in real-time
- **Zoom**: Pan and zoom on visualizations

### Toolbar Options (Bottom):

- 🔄 Refresh data
- 📥 Download
- 🔍 Search/Filter
- ⚙️ Settings
- ℹ️ Info

---

## 🔐 Security Considerations

### Current Implementation:
- ✅ Tableau URL is public (embedded)
- ✅ No authentication required for viewing
- ✅ Script loaded from official Tableau CDN

### For Production:
- 🔒 Consider Tableau authentication
- 🔒 Implement row-level security in Tableau
- 🔒 Use trusted tickets for SSO
- 🔒 Restrict access by user role

---

## 🎨 Customization Options

### Header Customization:
```javascript
// In DashboardView.js, modify header section
React.createElement('h1', {
  className: '...'
}, 'Your Custom Title'),
```

### Loading Message:
```javascript
// In DashboardView.js, modify loading section
React.createElement('p', {
  className: '...'
}, 'Your Custom Loading Message'),
```

### Container Styling:
```javascript
// In DashboardView.js, modify main container
className: 'flex-1 p-6 overflow-hidden bg-gray-50 dark:bg-gray-900'
```

---

## 📈 Future Enhancements

### Potential Improvements:

1. **Multiple Dashboards**:
   - Add dropdown to select different Tableau views
   - Store user's preferred dashboard

2. **Filters Integration**:
   - Pass location/date filters to Tableau
   - Sync POS filters with dashboard

3. **Permissions**:
   - Restrict dashboard access by role
   - Different dashboards for different roles

4. **Performance**:
   - Cache Tableau API script
   - Preload dashboard on app start

5. **Analytics**:
   - Track dashboard usage
   - Log user interactions

---

## 🧪 Testing

### Manual Testing Steps:

1. ✅ Click Operations → Dashboard
2. ✅ Verify loading spinner appears
3. ✅ Verify Tableau dashboard loads
4. ✅ Test interactions (filters, drill-down)
5. ✅ Switch locations and verify header updates
6. ✅ Test in light/dark mode
7. ✅ Test on mobile/tablet/desktop
8. ✅ Test with slow internet connection

### Console Checks:
```javascript
// Should NOT see:
❌ Failed to load Tableau Embedding API
❌ tableau-viz is not defined
❌ CORS errors

// Should see:
✅ Tableau Embedding API loaded
✅ 📊 Initializing Tableau visualization
```

---

## 📝 Notes

- Dashboard requires an active internet connection
- Tableau API is loaded dynamically (not bundled)
- Script is cleaned up when component unmounts
- Dashboard respects POS theme settings
- Location context is displayed but not passed to Tableau (can be enhanced)

---

## 🎓 Resources

- [Tableau Embedding API v3 Documentation](https://help.tableau.com/current/api/embedding_api/en-us/index.html)
- [Tableau Web Components](https://help.tableau.com/current/api/embedding_api/en-us/docs/embedding_api_web_comp.html)
- [Tableau JavaScript API Reference](https://help.tableau.com/current/api/embedding_api/en-us/reference/index.html)

---

**Implementation Date**: November 11, 2025  
**Author**: Rodrigo Torres  
**Version**: 1.0.0

