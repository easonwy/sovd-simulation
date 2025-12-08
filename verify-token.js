#!/usr/bin/env node

/**
 * Token Verification Tool
 * Used to verify if the generated token is valid.
 */

const { verifyEnhancedToken } = require('./lib/enhanced-jwt');

async function verifyToken(token) {
  console.log('🔍 Verifying token validity...\n');
  
  try {
    const result = await verifyEnhancedToken(token);
    
    if (result.valid) {
      console.log('✅ Token verification successful!');
      console.log('User Information:');
      console.log(`   - User ID: ${result.payload.userId}`);
      console.log(`   - Email: ${result.payload.email}`);
      console.log(`   - Role: ${result.payload.role}`);
      console.log(`   - Organization ID: ${result.payload.oid}`);
      console.log(`   - Permissions Count: ${result.payload.permissions.length}`);
      console.log(`   - Scope: ${result.payload.scope}`);
      console.log(`   - Client ID: ${result.payload.clientId || 'None'}`);
      console.log(`   - JWT ID: ${result.payload.jti}`);
      console.log(`   - Issued At: ${new Date(result.payload.iat * 1000).toISOString()}`);
      console.log(`   - Expiration Time: ${new Date(result.payload.exp * 1000).toISOString()}`);
      
      // Check if expired
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = result.payload.exp - now;
      
      if (timeLeft > 0) {
        console.log(`   - Time left: ${Math.floor(timeLeft / 60)} minutes ${timeLeft % 60} seconds`);
      } else {
        console.log(`   - ⚠️  Token has expired: ${Math.abs(timeLeft)} seconds ago`);
      }
      
    } else {
      console.log('❌ Token verification failed!');
      console.log(`Error code: ${result.code}`);
      console.log(`Error message: ${result.error}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('🔥 Error during token verification process:', error);
    return { valid: false, error: error.message };
  }
}

// Main function
async function main() {
  // You can use the token generated in the previous step for testing here
  const testToken = process.argv[2];
  
  if (!testToken) {
    console.log('Usage: node verify-token.js <jwt_token>');
    console.log('Example: node verify-token.js eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...');
    return;
  }
  
  await verifyToken(testToken);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { verifyToken };