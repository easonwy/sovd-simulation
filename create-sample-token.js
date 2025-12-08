// Create a proper sample JWT token for testing
// This creates a token with proper structure for testing the Token Manager

// Sample JWT components
const header = {
  "alg": "RS256",
  "typ": "JWT"
};

const payload = {
  "userId": "demo-user-123",
  "email": "demo@sovd-explorer.com",
  "role": "Developer",
  "oid": "demo-org-1",
  "permissions": ["read:data", "write:data", "read:faults"],
  "scope": "api",
  "jti": "demo-token-12345",
  "iat": Math.floor(Date.now() / 1000),
  "exp": Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours from now
};

// Base64URL encoding function
function base64UrlEncode(str) {
  // Convert string to base64
  const base64 = btoa(str);
  // Convert to base64url (remove padding, replace characters)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Create the token
const encodedHeader = base64UrlEncode(JSON.stringify(header));
const encodedPayload = base64UrlEncode(JSON.stringify(payload));

// For demo purposes, we'll use a dummy signature
const dummySignature = base64UrlEncode("dummy-signature-for-demo");

const sampleToken = `${encodedHeader}.${encodedPayload}.${dummySignature}`;

console.log('🎯 Sample Token for Token Manager:');
console.log(sampleToken);
console.log('\n🔍 Token Structure:');
console.log('Header:', encodedHeader);
console.log('Payload:', encodedPayload);
console.log('Signature:', dummySignature);

// Verify the structure
const parts = sampleToken.split('.');
console.log('\n✅ Verification:');
console.log('Parts count:', parts.length);
console.log('Each part length:', parts.map(p => p.length));

// Test decoding
try {
  const decodedHeader = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
  const decodedPayload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  console.log('\n📋 Decoded Content:');
  console.log('Header:', decodedHeader);
  console.log('Payload:', decodedPayload);
} catch (e) {
  console.error('Decode error:', e.message);
}

console.log('\n🚀 Usage:');
console.log('1. Copy this token');
console.log('2. Open Token Manager in the explorer');
console.log('3. Paste the token and click decode');
console.log('4. You can then edit, encrypt, or generate new tokens');