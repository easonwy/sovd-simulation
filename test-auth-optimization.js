#!/usr/bin/env node

/**
 * Authentication Module Optimization Test Script
 * Used to validate the functionality of the new JWT and permission system
 */

const https = require('https')
const http = require('http')
const url = require('url')

// Test configuration
const BASE_URL = 'http://localhost:3000'
const TEST_EMAIL = 'test@example.com'
const TEST_PASSWORD = 'password123'

// Color output (simple color functions)
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`
}

/**
 * HTTP request utility functions
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(options.url || `${BASE_URL}${options.path}`)
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.path,
      method: options.method || 'GET',
      headers: options.headers || {}
    }

    const req = http.request(requestOptions, (res) => {
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      })
      res.on('end', () => {
        try {
          const parsedBody = JSON.parse(body)
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsedBody
          })
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          })
        }
      })
    })

    req.on('error', (err) => {
      reject(err)
    })

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

/**
 * Test 1: Token generation and verification
 */
async function testTokenGeneration() {
  console.log(colors.cyan('\n🧪 Test 1: Token generation and verification'))
  
  try {
    // Use simplified token interface to generate token
    const response = await makeRequest({
      path: '/v1/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      role: 'Admin',
      grant_type: 'client_credentials'
    })

    console.log(`状态码: ${response.status}`)
    
    if (response.status === 200) {
      console.log(colors.green('✅ Token generation successful'))
      console.log('Token info:', JSON.stringify(response.body, null, 2))
      return response.body.access_token
    } else {
      console.log(colors.red('❌ Token generation failed'))
      console.log('Error:', response.body)
      return null
    }
  } catch (error) {
    console.log(colors.red('❌ Token generation error:'), error.message)
    return null
  }
}

/**
 * Test 2: Permission check
 */
async function testPermissionCheck(token) {
  console.log(colors.cyan('\n🧪 Test 2: Permission check'))
  
  if (!token) {
    console.log(colors.yellow('⚠️  Skip permission test (no token)'))
    return
  }

  const testCases = [
    { method: 'GET', path: '/v1/App', expected: true },
    { method: 'POST', path: '/v1/App', expected: true },
    { method: 'DELETE', path: '/v1/App', expected: true } // Admin should have permission
  ]

  for (const testCase of testCases) {
    try {
      const response = await makeRequest({
        path: testCase.path,
        method: testCase.method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const passed = response.status === 200 === testCase.expected
      const status = passed ? colors.green('✅') : colors.red('❌')
      
      console.log(`${status} ${testCase.method} ${testCase.path} - Status code: ${response.status}`)
      
      if (response.status === 403) {
        console.log(colors.yellow('Permission error details:'), response.body)
      }
    } catch (error) {
      console.log(colors.red(`❌ ${testCase.method} ${testCase.path} - Error: ${error.message}`))
    }
  }
}

/**
 * Test 3: Token parsing
 */
async function testTokenParsing(token) {
  console.log(colors.cyan('\n🧪 Test 3: Token parsing'))
  
  if (!token) {
    console.log(colors.yellow('⚠️  Skip token parsing test (no token)'))
    return
  }

  try {
    // Use web token tool API to parse token
    const response = await makeRequest({
      path: '/api/admin/token-tool/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      token: token
    })

    console.log(`状态码: ${response.status}`)
    
    if (response.status === 200) {
      console.log(colors.green('✅ Token parsing successful'))
      console.log('Parsing result:', JSON.stringify(response.body, null, 2))
    } else {
      console.log(colors.red('❌ Token parsing failed'))
      console.log('Error:', response.body)
    }
  } catch (error) {
    console.log(colors.red('❌ Token parsing error:'), error.message)
  }
}

/**
 * Test 4: Error handling
 */
async function testErrorHandling() {
  console.log(colors.cyan('\n🧪 Test 4: Error handling'))
  
  const testCases = [
    {
      name: 'Invalid token',
      request: {
        path: '/v1/App',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid_token'
        }
      }
    },
    {
      name: 'Missing token',
      request: {
        path: '/v1/App',
        method: 'GET'
      }
    }
  ]

  for (const testCase of testCases) {
    try {
      const response = await makeRequest(testCase.request)
      
      console.log(`${testCase.name}:`)
      console.log(`  Status code: ${response.status}`)
      console.log(`  Error info:`, response.body)
      
      // Check if error info is detailed
      const hasDetailedError = response.body && (
        response.body.code ||
        response.body.details ||
        response.body.message
      )
      
      if (hasDetailedError) {
        console.log(colors.green('  ✅ Error info detailed'))
      } else {
        console.log(colors.yellow('  ⚠️  Error info not detailed enough'))
      }
    } catch (error) {
      console.log(colors.red(`  ❌ ${testCase.name} error: ${error.message}`))
    }
  }
}

/**
 * Test 5: Performance testing
 */
async function testPerformance(token) {
  console.log(colors.cyan('\n🧪 Test 5: Performance testing'))
  
  if (!token) {
    console.log(colors.yellow('⚠️  Skip performance test (no token)'))
    return
  }

  const iterations = 10
  const times = []

  console.log(`Executing ${iterations} permission checks...`)

  for (let i = 0; i < iterations; i++) {
    const start = Date.now()
    
    try {
      await makeRequest({
        path: '/v1/App',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const duration = Date.now() - start
      times.push(duration)
    } catch (error) {
      console.log(colors.red(`Request ${i + 1} failed: ${error.message}`))
    }
  }

  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)
    
    console.log(colors.cyan('Performance results:'))
    console.log(`  Average response time: ${avgTime.toFixed(2)}ms`)
    console.log(`  Fastest response time: ${minTime}ms`)
    console.log(`  Slowest response time: ${maxTime}ms`)
    
    if (avgTime < 50) {
      console.log(colors.green('  ✅ Excellent performance'))
    } else if (avgTime < 100) {
      console.log(colors.yellow('  ⚠️  Average performance'))
    } else {
      console.log(colors.red('  ❌ Poor performance'))
    }
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log(colors.blue('🚀 SOVD Authentication Module Optimization Test Started'))
  console.log(colors.blue('================================'))
  
  try {
    // Test 1: Generate token
    const token = await testTokenGeneration()
    
    // Test 2: Permission check
    await testPermissionCheck(token)
    
    // Test 3: Token parsing
    await testTokenParsing(token)
    
    // Test 4: Error handling
    await testErrorHandling()
    
    // Test 5: Performance testing
    await testPerformance(token)
    
    console.log(colors.green('\n✅ All tests completed!'))
    
  } catch (error) {
    console.log(colors.red('\n❌ Test failed:'), error.message)
  }
}

// 检查服务器是否可用
async function checkServer() {
  try {
    const response = await makeRequest({ path: '/', method: 'GET' })
    return response.status === 200 || response.status === 404 // 404 also indicates server is running
  } catch (error) {
    return false
  }
}

// 主程序
async function main() {
  console.log(colors.blue('🔍 Checking server status...'))
  
  const serverAvailable = await checkServer()
  
  if (!serverAvailable) {
    console.log(colors.red('❌ Server not running, please start development server first: npm run dev'))
    process.exit(1)
  }
  
  console.log(colors.green('✅ Server running normally'))
  
  // Wait for server to fully start
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Run tests
  await runTests()
}

// 运行主程序
main().catch(error => {
  console.error(colors.red('Program error:'), error)
  process.exit(1)
})