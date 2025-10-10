#!/usr/bin/env node

/**
 * Cache Version Update Script
 * 
 * This script automatically updates the cache-busting version numbers
 * in the index.html file to force browsers to reload JavaScript files.
 * 
 * Usage:
 *   node update-cache-version.js
 * 
 * @author Rodrigo Torres
 * @version 1.0.0
 * @since 2025-01-11
 */

const fs = require('fs');
const path = require('path');

// Generate a new version string based on current timestamp
function generateVersion() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}-${hour}${minute}`;
}

// Update cache version in index.html
function updateCacheVersion() {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html not found at:', indexPath);
        process.exit(1);
    }
    
    const newVersion = generateVersion();
    console.log(`🔄 Updating cache version to: ${newVersion}`);
    
    try {
        let content = fs.readFileSync(indexPath, 'utf8');
        
        // Replace all version parameters in script tags
        const versionRegex = /(\?v=)[0-9]{8}-[0-9]{4}/g;
        const updatedContent = content.replace(versionRegex, `$1${newVersion}`);
        
        // Check if any replacements were made
        if (content === updatedContent) {
            console.log('⚠️  No version parameters found to update');
            return;
        }
        
        // Write the updated content back to the file
        fs.writeFileSync(indexPath, updatedContent, 'utf8');
        
        console.log('✅ Successfully updated cache version in index.html');
        console.log(`📝 New version: ${newVersion}`);
        console.log('🌐 Browsers will now load the latest JavaScript files');
        
    } catch (error) {
        console.error('❌ Error updating cache version:', error.message);
        process.exit(1);
    }
}

// Main execution
if (require.main === module) {
    console.log('🚀 Cache Version Update Script');
    console.log('==============================');
    updateCacheVersion();
}

module.exports = { generateVersion, updateCacheVersion };
