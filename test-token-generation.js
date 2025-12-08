// Test token generation to create a proper sample token
const testPayload = {
  userId: 'test-user-123',
  email: 'test@example.com',
  role: 'Developer',
  oid: 'test-org',
  permissions: ['read:data', 'write:data'],
  scope: 'api'
};

console.log('🎯 Testing token generation...');

fetch('http://localhost:3001/api/admin/token-manager', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testPayload)
})
  .then(response => response.json())
  .then(data => {
    if (data.token) {
      console.log('✅ Generated Token:', data.token);
      console.log('🔗 Token parts count:', data.token.split('.').length);
      console.log('📋 Payload:', data.payload);
      console.log('⏰ Expires at:', data.expiresAt);
      
      // Verify the token format
      const parts = data.token.split('.');
      console.log('\n🔍 Token structure:');
      console.log('Header length:', parts[0].length);
      console.log('Payload length:', parts[1].length);
      console.log('Signature length:', parts[2].length);
      
      // Test decoding
      try {
        const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        console.log('\n✅ Decoded successfully!')
        console.log('Header:', header);
        console.log('Payload:', payload);
      } catch (e) {
        console.error('❌ Decode error:', e.message);
      }
    } else {
      console.error('❌ Token generation failed:', data.error);
    }
  })
  .catch(error => {
    console.error('❌ Network error:', error);
  });