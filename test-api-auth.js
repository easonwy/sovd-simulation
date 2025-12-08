#!/usr/bin/env node

/**
 * API Authentication Test
 * Tests the complete flow of token generation and API access.
 */

const http = require('http');
const https = require('https');

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testFullAuthFlow() {
  console.log('🔐 Testing full authentication flow...\n');
  
  try {
    // 1. Generate Token
    console.log('1️⃣ Generating access token...');
    const tokenResponse = await makeRequest('http://localhost:3000/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        role: 'Developer',
        grant_type: 'client_credentials',
        expires_in: '1h'
      })
    });
    
    if (tokenResponse.status !== 200) {
      console.log('❌ Token generation failed');
      console.log(`   Status code: ${tokenResponse.status}`);
      console.log(`   Response: ${tokenResponse.body}`);
      return;
    }
    
    const tokenData = JSON.parse(tokenResponse.body);
    const { access_token } = tokenData;
    
    console.log('✅ Token generated successfully');
    console.log(`   Token: ${access_token.substring(0, 50)}...`);
    console.log(`   Type: ${tokenData.token_type}`);
    console.log(`   Expires in: ${tokenData.expires_in} seconds`);
    console.log(`   Permissions count: ${tokenData.permissions.length}`);
    
    // 2. Access API with Token
    console.log('\n2️⃣ Accessing API with token...');
    
    const apiEndpoints = [
      '/v1/App',
      '/v1/App/test-app/data',
      '/v1/App/test-app/faults'
    ];
    
    for (const endpoint of apiEndpoints) {
      console.log(`\n   Testing ${endpoint}...`);
      
      try {
        const apiResponse = await makeRequest(`http://localhost:3000${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Accept': 'application/json'
          }
        });
        
        console.log(`   Status code: ${apiResponse.status}`);
        
        if (apiResponse.status === 200) {
          console.log('   ✅ Access successful');
          try {
            const data = JSON.parse(apiResponse.body);
            console.log(`   Data type: ${Array.isArray(data) ? 'array' : typeof data}`);
            console.log(`   Data length: ${Array.isArray(data) ? data.length : Object.keys(data).length}`);
          } catch (e) {
            console.log('   Raw response data');
          }
        } else if (apiResponse.status === 403) {
          console.log('   ❌ Insufficient permissions');
          try {
            const errorData = JSON.parse(apiResponse.body);
            console.log(`   Error: ${errorData.message}`);
          } catch (e) {
            console.log(`   Raw error: ${apiResponse.body}`);
          }
        } else {
          console.log('   ⚠️  Other error');
          console.log(`   Response: ${apiResponse.body}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`);
      }
    }
    
    // 3. Test invalid Token
    console.log('\n3️⃣ Testing invalid token...');
    const invalidTokenResponse = await makeRequest('http://localhost:3000/v1/App', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token-12345',
        'Accept': 'application/json'
      }
    });
    
    console.log(`   Invalid token status code: ${invalidTokenResponse.status}`);
    if (invalidTokenResponse.status === 401) {
      console.log('   ✅ Invalid token correctly rejected');
    } else {
      console.log('   ⚠️  Unexpected response');
    }
    
    // 4. Test access without Token
    console.log('\n4️⃣ Testing access without token...');
    const noTokenResponse = await makeRequest('http://localhost:3000/v1/App', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log(`   No token status code: ${noTokenResponse.status}`);
    if (noTokenResponse.status === 401) {
      console.log('   ✅ Access without token correctly rejected');
    } else {
      console.log('   ⚠️  Unexpected response');
    }
    
    console.log('\n✅ Full authentication flow test completed');
    
  } catch (error) {
    console.error('🔥 Test failed:', error);
  }
}

// Main function
async function main() {
  console.log('🚀 SOVD API Authentication Flow Test Tool');
  console.log('=====================================\n');
  
  // Check service status
  try {
    const response = await makeRequest('http://localhost:3000/v1/App');
    console.log('✅ Service is running\n');
  } catch (error) {
    console.error('❌ Could not connect to the service, please ensure the service is running');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }
  
  await testFullAuthFlow();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testFullAuthFlow };