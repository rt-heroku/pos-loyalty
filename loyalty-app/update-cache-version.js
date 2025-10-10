#!/usr/bin/env node

/**
 * Cache Version Update Script for Customer Loyalty App
 * 
 * This script automatically updates the cache-busting version numbers
 * in the service worker to force browsers to reload cached content.
 * 
 * Usage:
 *   node update-cache-version.js
 * 
 * @author Rodrigo Torres
 * @version 1.0.0
 * @since 2025-01-25
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
    
    return `v${year}${month}${day}-${hour}${minute}`;
}

// Update cache version in service worker
function updateCacheVersion() {
    const swPath = path.join(__dirname, 'public', 'sw.js');
    
    if (!fs.existsSync(swPath)) {
        console.log('⚠️  sw.js not found at:', swPath);
        console.log('📝 This is normal during initial build. Skipping cache version update.');
        return;
    }
    
    const newVersion = generateVersion();
    console.log(`🔄 Updating cache version to: ${newVersion}`);
    
    try {
        let content = fs.readFileSync(swPath, 'utf8');
        
        // Replace the CACHE_VERSION constant
        const versionRegex = /const CACHE_VERSION = '[^']+';/;
        const updatedContent = content.replace(versionRegex, `const CACHE_VERSION = '${newVersion}';`);
        
        // Check if any replacements were made
        if (content === updatedContent) {
            console.log('⚠️  No version found to update');
            return;
        }
        
        // Write the updated content back to the file
        fs.writeFileSync(swPath, updatedContent, 'utf8');
        
        console.log('✅ Successfully updated cache version in sw.js');
        console.log(`📝 New version: ${newVersion}`);
        console.log('🌐 Browsers will now load the latest content');
        
    } catch (error) {
        console.error('❌ Error updating cache version:', error.message);
        process.exit(1);
    }
}

// Main execution
if (require.main === module) {
    console.log('🚀 Cache Version Update Script - Customer Loyalty App');
    console.log('====================================================');
    updateCacheVersion();
}

module.exports = { generateVersion, updateCacheVersion };
