#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * RSA Key Pair Generation Tool
 * Used to generate RSA key pairs required for JWT signing
 */

function generateKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
}

function saveKeys(environment, publicKey, privateKey) {
  const envPath = path.join(__dirname, '..', 'secrets', environment);
  
  // 确保目录存在
  if (!fs.existsSync(envPath)) {
    fs.mkdirSync(envPath, { recursive: true });
  }
  
  const publicKeyPath = path.join(envPath, 'public.key');
  const privateKeyPath = path.join(envPath, 'private.key');
  
  fs.writeFileSync(publicKeyPath, publicKey);
  fs.writeFileSync(privateKeyPath, privateKey);
  
  console.log(`✅ ${environment} environment key pair generated:`);
  console.log(`   Public key: ${publicKeyPath}`);
  console.log(`   Private key: ${privateKeyPath}`);
  
  // 设置文件权限（仅当前用户可读写私钥）
  if (process.platform !== 'win32') {
    fs.chmodSync(privateKeyPath, 0o600);
    console.log(`   🔒 Private key file permissions set to 600`);
  }
}

function main() {
  console.log('🔑 Starting RSA key pair generation...\n');
  
  // 生成开发环境密钥对
  console.log('🛠️  Generating development environment key pair...');
  const devKeyPair = generateKeyPair();
  saveKeys('development', devKeyPair.publicKey, devKeyPair.privateKey);
  
  console.log('');
  
  // 生成生产环境密钥对
  console.log('🚀 Generating production environment key pair...');
  const prodKeyPair = generateKeyPair();
  saveKeys('production', prodKeyPair.publicKey, prodKeyPair.privateKey);
  
  console.log('\n✨ All key pairs generated successfully!');
  console.log('\n⚠️  Important reminders:');
  console.log('   - Private key files contain sensitive information, please keep them secure');
  console.log('   - Do not commit private keys to version control');
  console.log('   - Production environment private keys should use professional key management systems');
  console.log('   - Recommend regular key rotation');
}

if (require.main === module) {
  main();
}

module.exports = { generateKeyPair, saveKeys };