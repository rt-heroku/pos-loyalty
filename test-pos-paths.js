#!/usr/bin/env node

/**
 * Test script to verify POS app paths are working correctly
 */

const http = require('http');

const testUrl = (url, description) => {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      console.log(`✅ ${description}: ${res.statusCode} ${res.statusMessage}`);
      resolve(res.statusCode === 200);
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${description}: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log(`❌ ${description}: Timeout`);
      req.destroy();
      resolve(false);
    });
  });
};

async function testPOSPaths() {
  console.log('🧪 Testing POS App Paths...\n');
  
  const baseUrl = 'http://localhost:3000';
  const tests = [
    [`${baseUrl}/pos/index.html`, 'POS HTML file'],
    [`${baseUrl}/pos/app.js`, 'Main app script'],
    [`${baseUrl}/pos/api.js`, 'API utilities'],
    [`${baseUrl}/pos/icons.js`, 'Icons script'],
    [`${baseUrl}/pos/components/common/TabButton.js`, 'TabButton component'],
    [`${baseUrl}/pos/components/views/POSView.js`, 'POSView component'],
    [`${baseUrl}/pos/sw.js`, 'Service worker'],
    [`${baseUrl}/pos/images/logo_Mulesoft.svg`, 'Logo image'],
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const [url, description] of tests) {
    const success = await testUrl(url, description);
    if (success) passed++;
  }
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All POS paths are working correctly!');
    console.log('\n🌐 You can now access:');
    console.log('- POS App: http://localhost:3000/pos');
    console.log('- Loyalty App: http://localhost:3000/loyalty');
  } else {
    console.log('❌ Some paths are not working. Check the server logs.');
  }
}

testPOSPaths().catch(console.error);
