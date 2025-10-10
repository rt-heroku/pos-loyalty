#!/usr/bin/env node

/**
 * Simple JavaScript Syntax Checker
 * Author: Rodrigo Torres
 * Description: Checks JavaScript files for syntax errors before deployment
 */

const fs = require('fs');
const path = require('path');

function checkSyntax(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Use Node.js to check syntax directly
        const { spawn } = require('child_process');
        const nodeProcess = spawn('node', ['-c', filePath]);
        
        let errorOutput = '';
        
        nodeProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        nodeProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${filePath} - Syntax OK`);
            } else {
                console.log(`❌ ${filePath} - Syntax Error:`);
                console.log(errorOutput);
                process.exit(1);
            }
        });
        
    } catch (error) {
        console.log(`❌ ${filePath} - Error reading file:`, error.message);
        process.exit(1);
    }
}

// Check all JavaScript files in public directory
const publicDir = path.join(__dirname, 'public');
const jsFiles = [];

function findJsFiles(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            findJsFiles(filePath);
        } else if (file.endsWith('.js')) {
            jsFiles.push(filePath);
        }
    }
}

findJsFiles(publicDir);

console.log('🔍 Checking JavaScript syntax...\n');

let checkedFiles = 0;
let totalFiles = jsFiles.length;

for (const jsFile of jsFiles) {
    checkSyntax(jsFile);
    checkedFiles++;
    
    if (checkedFiles === totalFiles) {
        console.log(`\n✅ All ${totalFiles} files passed syntax check!`);
    }
}
