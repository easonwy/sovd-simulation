/**
 * Token Generation Error Debugger
 * Used to capture detailed error information
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateEnhancedToken } from '@/lib/enhanced-jwt'
import { PrismaClient } from '@prisma/client'
import { keyManager } from '@/lib/key-manager'

const prisma = new PrismaClient()

// Detailed error capture function
async function debugTokenGeneration(payload: any, options: any) {
  console.log('=== Token Generation Debug Information ===');
  console.log('Time:', new Date().toISOString());
  console.log('Environment variable NODE_ENV:', process.env.NODE_ENV);
  console.log('Environment variable DATABASE_URL:', process.env.DATABASE_URL);
  
  try {
    // 1. Check key manager status
    console.log('\n1. Check key manager status:');
    const currentEnv = keyManager.getCurrentEnvironment();
    console.log('   Current environment:', currentEnv);
    console.log('   Keys exist:', keyManager.hasKeys(currentEnv));
    
    if (!keyManager.hasKeys(currentEnv)) {
      console.log('   ⚠️  Keys do not exist, attempting to reload...');
      await keyManager.loadKeys(currentEnv);
      console.log('   Keys exist after reload:', keyManager.hasKeys(currentEnv));
    }
    
    // 2. Check key files
    console.log('\n2. Check key files:');
    const fs = require('fs');
    const path = require('path');
    const keysPath = path.join(process.cwd(), 'secrets', currentEnv);
    
    const privateKeyPath = path.join(keysPath, 'private.key');
    const publicKeyPath = path.join(keysPath, 'public.key');
    
    console.log('   Private key file path:', privateKeyPath);
    console.log('   Public key file path:', publicKeyPath);
    console.log('   Private key file exists:', fs.existsSync(privateKeyPath));
    console.log('   Public key file exists:', fs.existsSync(publicKeyPath));
    
    if (fs.existsSync(privateKeyPath)) {
      const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
      console.log('   Private key length:', privateKey.length);
      console.log('   Private key format correct:', privateKey.includes('BEGIN PRIVATE KEY') || privateKey.includes('BEGIN RSA PRIVATE KEY'));
    }
    
    // 3. Check database connection
    console.log('\n3. Check database connection:');
    try {
      await prisma.$connect();
      console.log('   Database connection successful');
      
      // Check permissions table
      const permissionCount = await prisma.permission.count();
      console.log('   Permission record count:', permissionCount);
      
      if (permissionCount === 0) {
        console.log('   ⚠️  Permissions table is empty, this may be normal');
      }
      
    } catch (dbError) {
      console.log('   ❌ Database connection failed:', dbError.message);
      throw dbError;
    }
    
    // 4. Try to get role permissions
    console.log('\n4. Try to get role permissions:');
    const role = payload.role || 'Viewer';
    console.log('   Role:', role);
    
    const permissions = await getRolePermissions(role);
    console.log('   Retrieved permission count:', permissions.length);
    console.log('   Permission list:', permissions);
    
    // 5. Try to generate token
    console.log('\n5. Try to generate token:');
    console.log('   Token payload:', JSON.stringify(payload, null, 2));
    console.log('   Token options:', JSON.stringify(options, null, 2));
    
    const tokenResult = await generateEnhancedToken(payload, options);
    console.log('   ✅ Token generation successful');
    console.log('   Token length:', tokenResult.token.length);
    console.log('   Expiration time:', tokenResult.expiresAt);
    
    return tokenResult;
    
  } catch (error) {
    console.log('\n❌ Token generation failed:');
    console.log('   Error type:', error.constructor.name);
    console.log('   Error message:', error.message);
    console.log('   Error stack:', error.stack);
    
    // Special error handling
    if (error.message.includes('key')) {
      console.log('   🔑 Key-related issue detected');
    }
    if (error.message.includes('permission')) {
      console.log('   🔒 Permission-related issue detected');
    }
    if (error.message.includes('database')) {
      console.log('   💾 Database-related issue detected');
    }
    
    throw error;
  } finally {
    console.log('\n=== Debug information end ===');
    await prisma.$disconnect();
  }
}

/**
 * Get role permission list (copied from route.ts)
 */
async function getRolePermissions(role: string): Promise<string[]> {
  try {
    // Get role permissions from database
    const rolePermissions = await prisma.permission.findMany({
      where: { role },
      select: { method: true, pathPattern: true }
    });

    // Convert to permission string format
    const permissions = rolePermissions.map(perm => 
      `${perm.method}:${perm.pathPattern}`
    );

    // 添加基础权限
    const basePermissions = getBasePermissions(role);
    
    return [...new Set([...basePermissions, ...permissions])];
  } catch (error) {
    console.error('Failed to get role permissions:', error);
    return getBasePermissions(role);
  }
}

/**
 * Get base permissions (copied from route.ts)
 */
function getBasePermissions(role: string): string[] {
  const basePerms = {
    'Viewer': [
      'GET:/v1/App',
      'GET:/v1/App/*/data',
      'GET:/v1/App/*/faults'
    ],
    'Developer': [
      'GET:/v1/App',
      'POST:/v1/App',
      'GET:/v1/App/*/data',
      'POST:/v1/App/*/data',
      'PUT:/v1/App/*/data',
      'GET:/v1/App/*/faults',
      'POST:/v1/App/*/faults',
      'DELETE:/v1/App/*/faults',
      'GET:/v1/App/*/lock'
    ],
    'Admin': ['*'] // Admin has all permissions
  }

  return basePerms[role as keyof typeof basePerms] || [];
}

// Create a new debug route handler function
export async function POST(req: NextRequest) {
  console.log('\n🚀 收到Token生成请求 (调试模式)');
  
  try {
    const ct = req.headers.get('content-type');
    const raw = await req.text();
    
    console.log('Request header Content-Type:', ct);
    console.log('Raw request body:', raw);
    
    let body: Record<string, string>;
    
    // Parse request body
    if (ct && ct.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(raw);
      body = {};
      params.forEach((v, k) => (body[k] = v));
      console.log('Parsed form data:', body);
    } else {
      try {
        body = JSON.parse(raw);
        console.log('Parsed JSON data:', body);
      } catch (e) {
        console.log('JSON parsing failed, using empty object');
        body = {};
      }
    }
    
    const role = (body.role || 'Viewer') as 'Viewer' | 'Developer' | 'Admin';
    const grant = body.grant_type || 'client_credentials';
    const expiresIn = body.expires_in || '1h';
    
    console.log(`Extracted parameters - role: ${role}, grant: ${grant}, expiresIn: ${expiresIn}`);
    
    if (!grant) {
      console.log('❌ Missing grant_type');
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    // Use debug function to generate token
    const tokenResult = await debugTokenGeneration({
      userId: 'system',
      email: 'system@sovd.local',
      role,
      oid: 'default',
      permissions: [], // Will be obtained inside function
      scope: 'api:access',
      clientId: 'sovd-cli'
    }, {
      expiresIn,
      issuer: 'sovd-system',
      audience: 'sovd-api'
    });

    console.log('✅ Token generation completed, preparing response');
    
    return NextResponse.json({
      access_token: tokenResult.token,
      token_type: 'Bearer',
      expires_in: Math.floor((tokenResult.expiresAt.getTime() - Date.now()) / 1000),
      scope: 'api:access',
      permissions: tokenResult.payload.permissions
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Token generation request processing failed:', error);
    console.error('Error details:', {
      name: error.constructor.name,
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json({
      error: 'token_generation_failed',
      error_description: 'Failed to generate access token',
      debug: {
        error_type: error.constructor.name,
        error_message: error.message
      }
    }, { status: 500 });
  }
}