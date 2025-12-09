// Test script for Token Manager functionality
const testToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFkbWluIiwib2lkIjoib3JnLTEiLCJwZXJtaXNzaW9ucyI6WyJyZWFkOmRhdGEiLCJ3cml0ZTpkYXRhIiwiYWRtaW46dXNlcnMiXSwic2NvcGUiOiJhcGkiLCJqdGkiOiI2NTc0YzY1MCIsImlhdCI6MTcwMzQ1ODg5MCwiZXhwIjoxNzAzNTQ1MjkwfQ';

console.log('🚀 Testing Token Manager API...');
console.log('Test Token:', testToken.substring(0, 50) + '...');

// Test the API endpoint
fetch(`http://localhost:3001/api/admin/token-manager?token=${encodeURIComponent(testToken)}`)
  .then(response => response.json())
  .then(data => {
    console.log('✅ Token decode response:');
    console.log('Header:', data.header);
    console.log('Payload:', data.payload);
    console.log('Is Valid:', data.isValid);
    console.log('Error:', data.error);
  })
  .catch(error => {
    console.error('❌ Error testing token manager:', error);
  });

// Test token generation
const testPayload = {
  userId: 'test-user-123',
  email: 'test@example.com',
  role: 'Developer',
  oid: 'test-org',
  permissions: ['read:data', 'write:data'],
  scope: 'api'
};

fetch('http://localhost:3001/api/admin/token-manager', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testPayload)
})
  .then(response => response.json())
  .then(data => {
    console.log('✅ Token generation response:');
    console.log('Generated Token:', data.token?.substring(0, 50) + '...');
    console.log('Expires At:', data.expiresAt);
  })
  .catch(error => {
    console.error('❌ Error testing token generation:', error);
  });

console.log('🎯 Token Manager Interface:');
console.log('- Access via Explorer header button (purple icon)');
console.log('- Or visit: http://localhost:3001/explorer/token-manager');
console.log('- Features: Decrypt, Edit, Encrypt, Generate new tokens');