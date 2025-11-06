#!/usr/bin/env node

/**
 * Test script to verify unified POS & Loyalty app setup
 * This script tests the basic configuration without starting servers
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Unified POS & Loyalty App Setup...\n');

// Test 1: Check if required files exist
const requiredFiles = [
  'package.json',
  'server.js',
  'Procfile',
  'app.json',
  'env.example',
  'loyalty-app/package.json',
  'loyalty-app/next.config.js'
];

console.log('📁 Checking required files...');
let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Test 2: Check package.json configuration
console.log('\n📦 Checking package.json configuration...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check for required dependencies
  const requiredDeps = ['http-proxy-middleware', 'concurrently'];
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep} dependency found`);
    } else {
      console.log(`❌ ${dep} dependency missing`);
      allFilesExist = false;
    }
  });
  
  // Check for required scripts
  const requiredScripts = ['start:production', 'dev', 'build'];
  requiredScripts.forEach(script => {
    if (packageJson.scripts[script]) {
      console.log(`✅ ${script} script found`);
    } else {
      console.log(`❌ ${script} script missing`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
  allFilesExist = false;
}

// Test 3: Check Next.js configuration
console.log('\n⚛️ Checking Next.js configuration...');
try {
  const nextConfig = fs.readFileSync('loyalty-app/next.config.js', 'utf8');
  if (nextConfig.includes("basePath: '/loyalty'")) {
    console.log('✅ basePath configured for /loyalty');
  } else {
    console.log('❌ basePath not configured correctly');
    allFilesExist = false;
  }
  
  if (nextConfig.includes("assetPrefix: '/loyalty'")) {
    console.log('✅ assetPrefix configured for /loyalty');
  } else {
    console.log('❌ assetPrefix not configured correctly');
    allFilesExist = false;
  }
} catch (error) {
  console.log('❌ Error reading Next.js config:', error.message);
  allFilesExist = false;
}

// Test 4: Check Express server configuration
console.log('\n🚀 Checking Express server configuration...');
try {
  const serverJs = fs.readFileSync('server.js', 'utf8');
  if (serverJs.includes('createProxyMiddleware')) {
    console.log('✅ Proxy middleware imported');
  } else {
    console.log('❌ Proxy middleware not imported');
    allFilesExist = false;
  }
  
  if (serverJs.includes("app.use('/loyalty', loyaltyProxy)")) {
    console.log('✅ Loyalty proxy route configured');
  } else {
    console.log('❌ Loyalty proxy route not configured');
    allFilesExist = false;
  }
  
  if (serverJs.includes("app.use('/pos', express.static")) {
    console.log('✅ POS static files configured for /pos path');
  } else {
    console.log('❌ POS static files not configured correctly');
    allFilesExist = false;
  }
} catch (error) {
  console.log('❌ Error reading server.js:', error.message);
  allFilesExist = false;
}

// Test 5: Check Heroku configuration
console.log('\n☁️ Checking Heroku configuration...');
try {
  const procfile = fs.readFileSync('Procfile', 'utf8');
  if (procfile.includes('npm run start:production')) {
    console.log('✅ Procfile configured for unified deployment');
  } else {
    console.log('❌ Procfile not configured correctly');
    allFilesExist = false;
  }
  
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  if (appJson.name.includes('Unified')) {
    console.log('✅ app.json configured for unified app');
  } else {
    console.log('❌ app.json not configured correctly');
    allFilesExist = false;
  }
} catch (error) {
  console.log('❌ Error reading Heroku config:', error.message);
  allFilesExist = false;
}

// Summary
console.log('\n📊 Setup Test Summary:');
if (allFilesExist) {
  console.log('🎉 All tests passed! The unified app is ready for deployment.');
  console.log('\n📋 Next steps:');
  console.log('1. Copy env.example to .env and configure your environment variables');
  console.log('2. Run "npm run dev" to test locally');
  console.log('3. Deploy to Heroku using the unified configuration');
  console.log('\n🌐 Expected URLs:');
  console.log('- POS App: http://localhost:3000/pos');
  console.log('- Loyalty App: http://localhost:3000/loyalty');
} else {
  console.log('❌ Some tests failed. Please check the configuration.');
  process.exit(1);
}


