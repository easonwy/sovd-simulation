#!/usr/bin/env node

/**
 * Token Generation Error Test Script
 * Used to diagnose specific reasons for token generation failure
 */

const http = require('http');
const https = require('https');

async function testTokenEndpoint() {
  console.log('🧪 开始测试Token生成接口...\n');
  
  const startTime = Date.now();
  
  try {
    // Test data
    const testCases = [
      {
        name: 'Basic token request',
        data: JSON.stringify({
          role: 'Viewer',
          grant_type: 'client_credentials',
          expires_in: '1h'
        }),
        contentType: 'application/json'
      },
      {
        name: 'Form format request',
        data: 'role=Developer&grant_type=client_credentials&expires_in=2h',
        contentType: 'application/x-www-form-urlencoded'
      },
      {
        name: 'Admin role request',
        data: JSON.stringify({
          role: 'Admin',
          grant_type: 'client_credentials',
          expires_in: '24h'
        }),
        contentType: 'application/json'
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 Test case: ${testCase.name}`);
      console.log(`📤 Request data: ${testCase.data}`);
      
      try {
        const response = await makeRequest('http://localhost:3000/v1/token', {
          method: 'POST',
          headers: {
            'Content-Type': testCase.contentType,
            'Accept': 'application/json'
          },
          body: testCase.data
        });

        console.log(`📊 Status code: ${response.status}`);
        console.log(`📨 Response headers: ${JSON.stringify(response.headers, null, 2)}`);
        console.log(`📝 Response body: ${response.body}`);
        
        if (response.status === 200) {
          const tokenData = JSON.parse(response.body);
          console.log(`✅ Token generation successful:`);
          console.log(`   - Token type: ${tokenData.token_type}`);
          console.log(`   - Expiration time: ${tokenData.expires_in} seconds`);
          console.log(`   - Permission count: ${tokenData.permissions?.length || 0}`);
          console.log(`   - Scope: ${tokenData.scope}`);
        } else {
          console.log(`❌ Token generation failed`);
          try {
            const errorData = JSON.parse(response.body);
            console.log(`   - Error code: ${errorData.error}`);
            console.log(`   - Error description: ${errorData.error_description}`);
          } catch (e) {
            console.log(`   - Raw response: ${response.body}`);
          }
        }
      } catch (error) {
        console.log(`❌ Request exception: ${error.message}`);
        console.log(`   - Error stack: ${error.stack}`);
      }
      
      // Wait 1 second before testing next case
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error('🔥 Test script execution failed:', error);
  } finally {
    const duration = Date.now() - startTime;
    console.log(`\n⏱️  Total test duration: ${duration}ms`);
  }
}

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      method: options.method,
      headers: options.headers
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

// Check if service is running
async function checkService() {
  try {
    const response = await makeRequest('http://localhost:3000/v1/App', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.status === 401) {
      console.log('✅ Service is running, authentication required (this is normal)');
      return true;
    } else if (response.status === 200) {
      console.log('✅ Service is running, no authentication required');
      return true;
    } else {
      console.log(`⚠️  Service returned unexpected status code: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Cannot connect to service, please ensure service is running');
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('🔍 SOVD Token Generation Interface Error Diagnostic Tool');
  console.log('=====================================\n');
  
  // Check service status
  const serviceRunning = await checkService();
  if (!serviceRunning) {
    console.log('\n💡 Please start service first: npm run dev');
    process.exit(1);
  }
  
  await testTokenEndpoint();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testTokenEndpoint, checkService };