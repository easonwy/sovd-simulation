// Debug token parsing to identify the exact issue

const testTokens = [
  // Original problematic token (missing signature)
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFkbWluIiwib2lkIjoib3JnLTEiLCJwZXJtaXNzaW9ucyI6WyJyZWFkOmRhdGEiLCJ3cml0ZTpkYXRhIiwiYWRtaW46dXNlcnMiXSwic2NvcGUiOiJhcGkiLCJqdGkiOiI2NTc0YzY1MCIsImlhdCI6MTcwMzQ1ODg5MCwiZXhwIjoxNzAzNTQ1MjkwfQ',
  
  // New proper token (with signature)
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZW1vLXVzZXItMTIzIiwiZW1haWwiOiJkZW1vQHNvdmQtZXhwbG9yZXIuY29tIiwicm9sZSI6IkRldmVsb3BlciIsIm9pZCI6ImRlbW8tb3JnLTEiLCJwZXJtaXNzaW9ucyI6WyJyZWFkOmRhdGEiLCJ3cml0ZTpkYXRhIiwicmVhZDpmYXVsdHMiXSwic2NvcGUiOiJhcGkiLCJqdGkiOiJkZW1vLXRva2VuLTEyMzQ1IiwiaWF0IjoxNzY1MjAyNjQzLCJleHAiOjE3NjUyODkwNDN9.ZHVtbXktc2lnbmF0dXJlLWZvci1kZW1v'
];

function base64UrlDecode(str) {
  try {
    str += '=='.substring(0, (4 - str.length % 4) % 4);
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    return atob(str);
  } catch (error) {
    throw new Error('Base64URL decode failed: ' + error.message);
  }
}

function parseTokenBrowser(token) {
  console.log('🎯 Parsing token:', token.substring(0, 50) + '...');
  console.log('📊 Token length:', token.length);
  
  try {
    const parts = token.split('.');
    console.log('🔍 Parts count:', parts.length);
    console.log('📋 Parts:', parts.map((p, i) => `Part ${i+1}: ${p.length} chars`));
    
    if (parts.length !== 3) {
      console.log('❌ Invalid: Expected 3 parts, got', parts.length);
      return null;
    }

    // Test each part
    parts.forEach((part, index) => {
      try {
        console.log(`Testing part ${index + 1} (${part.length} chars)...`);
        const decoded = base64UrlDecode(part);
        console.log(`✅ Part ${index + 1} decoded successfully, length:`, decoded.length);
        
        if (index === 0) {
          const header = JSON.parse(decoded);
          console.log('📋 Header content:', header);
        } else if (index === 1) {
          const payload = JSON.parse(decoded);
          console.log('📋 Payload content:', payload);
        }
      } catch (error) {
        console.log(`❌ Part ${index + 1} failed:`, error.message);
      }
    });

    return true;
  } catch (error) {
    console.log('❌ Token parsing failed:', error.message);
    return false;
  }
}

console.log('🚀 Testing token parsing...\n');

testTokens.forEach((token, index) => {
  console.log(`\n=== Test ${index + 1} ===`);
  const result = parseTokenBrowser(token);
  console.log('Result:', result ? '✅ SUCCESS' : '❌ FAILED');
});

console.log('\n🎯 Summary:');
console.log('- Token 1 (original): Missing signature (only 2 parts)');
console.log('- Token 2 (new): Complete with all 3 parts');
console.log('- The new token should work with the Token Manager!');