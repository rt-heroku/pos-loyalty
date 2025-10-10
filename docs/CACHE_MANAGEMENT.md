# Cache Management Guide

## Overview

This document explains how to manage browser caching issues in the POS system, particularly during development when JavaScript files are frequently updated.

## The Problem

During development, browsers often cache JavaScript files, which can cause:
- Old versions of the application to load
- New features not appearing until hard refresh
- Inconsistent behavior between different refresh methods
- MuleSoft configuration not loading properly

## Solutions Implemented

### 1. Cache-Busting Query Parameters

All JavaScript files now include version parameters:
```html
<script src="/api.js?v=20250111-001"></script>
<script src="/components/views/SettingsView.js?v=20250111-001"></script>
```

### 2. Server-Side Cache Control Headers

The server now sends appropriate cache control headers:
- **JavaScript files**: `no-cache, no-store, must-revalidate`
- **Static assets**: `public, max-age=3600` (1 hour cache)

### 3. HTML Meta Tags

The HTML file includes cache control meta tags:
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
```

### 4. Automated Version Update Script

A Node.js script automatically updates cache versions:
```bash
npm run update-cache
# or
npm run clear-cache
```

## Usage

### For Development

1. **After making changes to JavaScript files:**
   ```bash
   npm run clear-cache
   ```

2. **Manual version update:**
   ```bash
   node update-cache-version.js
   ```

3. **Browser refresh methods:**
   - **Hard refresh**: `Shift + CMD + R` (bypasses cache)
   - **Regular refresh**: `CMD + R` (respects cache)
   - **Clear cache**: Use browser dev tools

### For Production

1. **Deploy with new version:**
   ```bash
   npm run update-cache
   git add .
   git commit -m "Update cache version"
   git push
   ```

2. **Monitor cache behavior:**
   - Check browser dev tools Network tab
   - Verify files load with 200 status (not 304)
   - Test with different browsers

## Troubleshooting

### Issue: MuleSoft configuration not loading

**Symptoms:**
- MuleSoft section appears empty
- Settings don't persist between refreshes
- Hard refresh works, regular refresh doesn't

**Solutions:**
1. Run `npm run clear-cache`
2. Hard refresh browser (`Shift + CMD + R`)
3. Check browser dev tools for cached files
4. Clear browser cache manually

### Issue: New features not appearing

**Symptoms:**
- Code changes not visible
- Old UI elements still present
- JavaScript errors in console

**Solutions:**
1. Update cache version: `npm run update-cache`
2. Hard refresh browser
3. Check if files are loading with correct version
4. Verify server is serving updated files

### Issue: Inconsistent behavior

**Symptoms:**
- Different behavior between browsers
- Some users see old version, others see new
- Random loading of old/new versions

**Solutions:**
1. Ensure all team members run `npm run clear-cache`
2. Check server cache headers are correct
3. Verify CDN/proxy cache settings
4. Test in incognito/private browsing mode

## Best Practices

### Development
- Always run `npm run clear-cache` after significant changes
- Use hard refresh during development
- Monitor browser dev tools Network tab
- Test in multiple browsers

### Production
- Update cache version before each deployment
- Monitor cache hit rates
- Use proper cache headers for static assets
- Implement cache invalidation strategies

### Team Collaboration
- Communicate when cache versions are updated
- Include cache version in commit messages
- Document any cache-related issues
- Share troubleshooting steps

## Technical Details

### Version Format
Cache versions use format: `YYYYMMDD-HHMM`
- Example: `20250111-1430` (January 11, 2025 at 2:30 PM)

### Files Affected
- All `.js` files in `/public/`
- All `.jsx` files in `/public/components/`
- Main application files: `app.js`, `api.js`, `icons.js`, etc.

### Server Configuration
Cache control is configured in `server.js`:
```javascript
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js') || path.endsWith('.jsx')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
}));
```

## Future Improvements

1. **Automatic versioning**: Integrate with build process
2. **Content-based hashing**: Use file content hash as version
3. **Service worker**: Implement proper cache management
4. **CDN integration**: Configure CDN cache policies
5. **Monitoring**: Add cache hit/miss monitoring

---

**Author:** Rodrigo Torres  
**Version:** 1.0.0  
**Created:** January 11, 2025
