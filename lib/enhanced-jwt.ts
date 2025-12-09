import { SignJWT, jwtVerify, JWTPayload, importPKCS8, importSPKI } from 'jose';

/**
 * Final Version: Edge Runtime Fully Compatible Enhanced JWT Utility Class
 * Directly uses PEM strings, doesn't depend on Node.js crypto module
 */

/**
 * Enhanced JWT Token Structure
 */
export interface EnhancedTokenPayload {
  // Basic user information
  userId: string;
  email: string;
  role: string;

  // New extended information
  oid: string;           // Organization ID, supports multi-tenant
  permissions: string[]; // Specific permission list
  denyPermissions?: string[];
  scope: string;         // Scope
  clientId?: string;     // Client ID

  // Security information
  jti: string;           // JWT ID, prevents replay attacks
  iat: number;           // Issue time
  exp: number;           // Expiration time
  nbf?: number;          // Not before time (optional)

  // Extension fields
  [key: string]: any;    // Support additional custom fields
}

/**
 * JWT Configuration Options
 */
export interface JWTOptions {
  expiresIn?: string | number;  // Expiration time, default 24 hours
  issuer?: string;              // Issuer
  audience?: string;            // Audience
  subject?: string;             // Subject
  notBefore?: string | number;  // Not before time
}

/**
 * Token Generation Result
 */
export interface TokenResult {
  token: string;
  payload: EnhancedTokenPayload;
  expiresAt: Date;
}

/**
 * Token Verification Result
 */
export interface VerificationResult {
  valid: boolean;
  payload?: EnhancedTokenPayload;
  error?: string;
  code?: string;
}

/**
 * Final Version: Edge Runtime Fully Compatible Enhanced JWT Utility Class
 */
export class EnhancedJWTFinal {
  private static instance: EnhancedJWTFinal;

  // Preloaded keys (Edge Runtime compatible)
  private readonly privateKeys = {
    development: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCT0Se7N57uTMDw
q/EWUJ7Z3bvAYk7ymU2AIr1XWRXvNU16ztJqvd7xCUJvToRryvXfWngV6wqA/gTs
09yhvcf9ay+4oITcuoPO48F0xJCKdafvhopwLf5RDSGZHmn6ifDhvY0hB+2+6H8s
VXhM5P1PFmce+xJGO+bkh5uXUx+HEdM+WBG3VJtAjkGsw57X8AXlgMPHZIy4RNfU
1KfazdlVVZ+X0BPm6j6AFzfQiLOeEynBZPDg+5Epm/fdeTvLVrvJtlBZzY+Hmhdu
9vfHZuNOFMxR6q/uQfHg7+aR0xf7QN/+hkZCp3Ewcs+HZKajGzZ9CIOwMzENtelx
RGoxmzIBAgMBAAECggEAA8hyTR0NDPm7ZV1tJ95L1nURiUiqzxQj0t/wuxPNVygk
0bwJ0BAIbOBJCjq28mBJHxx8Xsk7ZVY674mzh5MpE2ADImU/STvfxDN5f8DJFzYQ
JHXrxJe0vsPIhJft6+rMVqaofjwq9jwShyKv173ziqre3EDeNJxzWg1rarnGoIkH
CCkGETIJkX3QGLJUHJmEqW3W6H7FKZbVUkBfo+g0T5+cIDYE8fxbLN0GINEeQyzS
Cj4cbSbtj0LmwgUDnoFb4BlLLrZhH+1nlL1yErJNDWZgqtWyVGyOru7I0aU6uQce
KYeQ/9g4q2tGqZTidmYh3Ka8ihsRETKkflO8YJHeHQKBgQDMUzEd2ZErBSb4um3W
i/ZMwulkIjxj5f3+bh2+US8eF5AhKpaeBePK4VxiuyV05RdmQ5U4rrX44KaPz8Wn
eE4q0a5Fz5/4lDGbGwZWowqTqrUaw0QpZa+Hs1/ICm0cmDkxxFhoDKOGtH5huUuU
NbrW+INXKi8k5xVXNJWxm7rllQKBgQC5M2oTUBspLZICFhms1Y1kR8t71KyUrTAo
t9ifPWeZMVgYiOegYsqsD1dHu8tANEIhuzjk/dPGu3AK2Kiu6tQA0MeMxWOvGJG7
nAQKx217c2HR9XfVYxSEIHEPAmlSYqJ1FStiIsAH/y/7DGb7t+JMZUEIhtbN4BRt
ThXoC44nvQKBgQDCUsiexAHdcVv8KIo4BwrrPGBt/GWE+QLUjPO6wklWjEBmWrO+
fImFtUmBGM3p28uiVdpAe2DT3wxqL8eim7dz39Gn0WwqJP78rfocQZnYkP0HA/j6
ihwjqkQI42mcTWXv3/XYl1Sa02RzGqA3x9X3h4iaSKNnrGLOelN4BEz+9QKBgDKA
aamQi4eEDK+S9TdjGGZDCaLf0JvOSjagQ2rQ5MIqaXpvQrJCnj+jA0rlU7xTQ8FM
+2u+J5SmohvjDsR79omuZOvnG5KwoXTGS3fg/+LNCNynEiFXHk4VRp8wKiY0DVbe
CfF9xl2n4Z6UuDRl5Uitx7kag9KqCwfvZhvbos0FAoGBAJIZliAEecLCmrEXmPc4
fmrizSR4l0im1kOWXmeH8rwYYoYxCtJGYu8DDuanz6KeHC/8Ke0BV8XGS7UftUIk
hinrmlbFtzhUGMoc2V4LkpEbfj3Bboyi7GjO1EPmAPWfgg55ElZrq9ugCG8TTP4P
ogwvftBQBoMGLvKcCyD1xWzp
-----END PRIVATE KEY-----`,
    production: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCT0Se7N57uTMDw
q/EWUJ7Z3bvAYk7ymU2AIr1XWRXvNU16ztJqvd7xCUJvToRryvXfWngV6wqA/gTs
09yhvcf9ay+4oITcuoPO48F0xJCKdafvhopwLf5RDSGZHmn6ifDhvY0hB+2+6H8s
VXhM5P1PFmce+xJGO+bkh5uXUx+HEdM+WBG3VJtAjkGsw57X8AXlgMPHZIy4RNfU
1KfazdlVVZ+X0BPm6j6AFzfQiLOeEynBZPDg+5Epm/fdeTvLVrvJtlBZzY+Hmhdu
9vfHZuNOFMxR6q/uQfHg7+aR0xf7QN/+hkZCp3Ewcs+HZKajGzZ9CIOwMzENtelx
RGoxmzIBAgMBAAECggEAA8hyTR0NDPm7ZV1tJ95L1nURiUiqzxQj0t/wuxPNVygk
0bwJ0BAIbOBJCjq28mBJHxx8Xsk7ZVY674mzh5MpE2ADImU/STvfxDN5f8DJFzYQ
JHXrxJe0vsPIhJft6+rMVqaofjwq9jwShyKv173ziqre3EDeNJxzWg1rarnGoIkH
CCkGETIJkX3QGLJUHJmEqW3W6H7FKZbVUkBfo+g0T5+cIDYE8fxbLN0GINEeQyzS
Cj4cbSbtj0LmwgUDnoFb4BlLLrZhH+1nlL1yErJNDWZgqtWyVGyOru7I0aU6uQce
KYeQ/9g4q2tGqZTidmYh3Ka8ihsRETKkflO8YJHeHQKBgQDMUzEd2ZErBSb4um3W
i/ZMwulkIjxj5f3+bh2+US8eF5AhKpaeBePK4VxiuyV05RdmQ5U4rrX44KaPz8Wn
eE4q0a5Fz5/4lDGbGwZWowqTqrUaw0QpZa+Hs1/ICm0cmDkxxFhoDKOGtH5huUuU
NbrW+INXKi8k5xVXNJWxm7rllQKBgQC5M2oTUBspLZICFhms1Y1kR8t71KyUrTAo
t9ifPWeZMVgYiOegYsqsD1dHu8tANEIhuzjk/dPGu3AK2Kiu6tQA0MeMxWOvGJG7
nAQKx217c2HR9XfVYxSEIHEPAmlSYqJ1FStiIsAH/y/7DGb7t+JMZUEIhtbN4BRt
ThXoC44nvQKBgQDCUsiexAHdcVv8KIo4BwrrPGBt/GWE+QLUjPO6wklWjEBmWrO+
fImFtUmBGM3p28uiVdpAe2DT3wxqL8eim7dz39Gn0WwqJP78rfocQZnYkP0HA/j6
ihwjqkQI42mcTWXv3/XYl1Sa02RzGqA3x9X3h4iaSKNnrGLOelN4BEz+9QKBgDKA
aamQi4eEDK+S9TdjGGZDCaLf0JvOSjagQ2rQ5MIqaXpvQrJCnj+jA0rlU7xTQ8FM
+2u+J5SmohvjDsR79omuZOvnG5KwoXTGS3fg/+LNCNynEiFXHk4VRp8wKiY0DVbe
CfF9xl2n4Z6UuDRl5Uitx7kag9KqCwfvZhvbos0FAoGBAJIZliAEecLCmrEXmPc4
fmrizSR4l0im1kOWXmeH8rwYYoYxCtJGYu8DDuanz6KeHC/8Ke0BV8XGS7UftUIk
hinrmlbFtzhUGMoc2V4LkpEbfj3Bboyi7GjO1EPmAPWfgg55ElZrq9ugCG8TTP4P
ogwvftBQBoMGLvKcCyD1xWzp
-----END PRIVATE KEY-----`
  };

  private readonly publicKeys = {
    development: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAk9Enuzee7kzA8KvxFlCe
2d27wGJO8plNgCK9V1kV7zVNes7Sar3e8QlCb06Ea8r131p4FesKgP4E7NPcob3H
/WsvuKCE3LqDzuPBdMSQinWn74aKcC3+UQ0hmR5p+onw4b2NIQftvuh/LFV4TOT9
TxZnHvsSRjvm5Iebl1MfhxHTPlgRt1SbQI5BrMOe1/AF5YDDx2SMuETX1NSn2s3Z
VVWfl9AT5uo+gBc30IiznhMpwWTw4PuRKZv33Xk7y1a7ybZQWc2Ph5oXbvb3x2bj
ThTMUeqv7kHx4O/mkdMX+0Df/oZGQqdxMHLPh2Smoxs2fQiDsDMxDbXpcURqMZsy
AQIDAQAB
-----END PUBLIC KEY-----`,
    production: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAk9Enuzee7kzA8KvxFlCe
2d27wGJO8plNgCK9V1kV7zVNes7Sar3e8QlCb06Ea8r131p4FesKgP4E7NPcob3H
/WsvuKCE3LqDzuPBdMSQinWn74aKcC3+UQ0hmR5p+onw4b2NIQftvuh/LFV4TOT9
TxZnHvsSRjvm5Iebl1MfhxHTPlgRt1SbQI5BrMOe1/AF5YDDx2SMuETX1NSn2s3Z
VVWfl9AT5uo+gBc30IiznhMpwWTw4PuRKZv33Xk7y1a7ybZQWc2Ph5oXbvb3x2bj
ThTMUeqv7kHx4O/mkdMX+0Df/oZGQqdxMHLPh2Smoxs2fQiDsDMxDbXpcURqMZsy
AQIDAQAB
-----END PUBLIC KEY-----`
  };

  private constructor() { }

  static getInstance(): EnhancedJWTFinal {
    if (!EnhancedJWTFinal.instance) {
      EnhancedJWTFinal.instance = new EnhancedJWTFinal();
    }
    return EnhancedJWTFinal.instance;
  }

  /**
   * Get current environment
   */
  getCurrentEnvironment(): string {
    return process.env.NODE_ENV === 'production' ? 'production' : 'development';
  }

  /**
   * Generate enhanced JWT token
   * Directly uses PEM strings, jose library will handle automatically
   */
  async generateToken(
    payload: Omit<EnhancedTokenPayload, 'jti' | 'iat' | 'exp' | 'nbf'>,
    options: JWTOptions = {}
  ): Promise<TokenResult> {
    try {
      const currentEnv = this.getCurrentEnvironment();
      const privateKeyPem = this.privateKeys[currentEnv as keyof typeof this.privateKeys];
      const privateKey = await importPKCS8(privateKeyPem, 'RS256');

      const now = Math.floor(Date.now() / 1000);

      // Generate JWT ID
      const jti = this.generateJTI();

      // Set expiration time (default 24 hours)
      const expiresIn = options.expiresIn || '24h';
      const exp = now + this.parseExpiresIn(expiresIn);

      // Build complete payload
      const fullPayload = {
        ...payload,
        jti,
        iat: now,
        exp,
        nbf: options.notBefore ? now + this.parseExpiresIn(options.notBefore) : undefined
      } as EnhancedTokenPayload;

      // Create JWT
      const jwt = new SignJWT(fullPayload)
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
        .setIssuedAt(now)
        .setExpirationTime(exp)
        .setJti(jti);

      // Set optional claims
      if (options.issuer) jwt.setIssuer(options.issuer);
      if (options.audience) jwt.setAudience(options.audience);
      if (options.subject) jwt.setSubject(options.subject);
      if (fullPayload.nbf) jwt.setNotBefore(fullPayload.nbf);

      // Sign with imported key
      const token = await jwt.sign(privateKey);

      return {
        token,
        payload: fullPayload,
        expiresAt: new Date(exp * 1000)
      };
    } catch (error) {
      console.error('Token generation failed:', error);
      throw new Error(`Failed to generate token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify JWT token
   * Directly uses PEM strings, jose library will handle automatically
   */
  async verifyToken(token: string): Promise<VerificationResult> {
    try {
      const currentEnv = this.getCurrentEnvironment();
      const publicKeyPem = this.publicKeys[currentEnv as keyof typeof this.publicKeys];
      const publicKey = await importSPKI(publicKeyPem, 'RS256');

      // Verify with imported key
      const result = await jwtVerify(token, publicKey, {
        algorithms: ['RS256']
      });

      // Convert to enhanced payload format
      const payload = result.payload as EnhancedTokenPayload;

      // Additional verification logic
      if (this.isTokenExpired(payload)) {
        return {
          valid: false,
          error: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        };
      }

      if (this.isTokenNotYetValid(payload)) {
        return {
          valid: false,
          error: 'Token not yet valid',
          code: 'TOKEN_NOT_YET_VALID'
        };
      }

      return {
        valid: true,
        payload
      };
    } catch (error) {
      let errorMessage = 'Invalid token';
      let errorCode = 'INVALID_TOKEN';

      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          errorMessage = 'Token has expired';
          errorCode = 'TOKEN_EXPIRED';
        } else if (error.message.includes('signature')) {
          errorMessage = 'Invalid token signature';
          errorCode = 'INVALID_SIGNATURE';
        } else if (error.message.includes('malformed')) {
          errorMessage = 'Malformed token';
          errorCode = 'MALFORMED_TOKEN';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        valid: false,
        error: errorMessage,
        code: errorCode
      };
    }
  }

  /**
   * Parse token (without signature verification)
   */
  parseToken(token: string): EnhancedTokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      // Decode payload (second part)
      const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
      return JSON.parse(payloadJson) as EnhancedTokenPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(
    oldToken: string,
    options: JWTOptions = {}
  ): Promise<TokenResult> {
    const verification = await this.verifyToken(oldToken);

    if (!verification.valid || !verification.payload) {
      throw new Error('Cannot refresh invalid token');
    }

    // Extract old payload, remove time-related fields
    const { jti, iat, exp, nbf, ...payload } = verification.payload;

    // Generate new token
    return this.generateToken(payload, options);
  }

  /**
   * Generate JWT ID
   */
  private generateJTI(): string {
    // Simple UUID v4 implementation
    const segments = [];
    for (let i = 0; i < 4; i++) {
      segments.push(Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0'));
    }
    return `${segments[0]}${segments[1]}-${segments[2]}-${segments[3]}-${Date.now().toString(16)}`;
  }

  /**
   * Parse expiration time
   */
  private parseExpiresIn(expiresIn: string | number): number {
    if (typeof expiresIn === 'number') {
      return expiresIn;
    }

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiresIn format: ${expiresIn}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers = {
      s: 1,      // seconds
      m: 60,     // minutes
      h: 3600,   // hours
      d: 86400   // days
    };

    return value * multipliers[unit as keyof typeof multipliers];
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(payload: EnhancedTokenPayload): boolean {
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }

  /**
   * Check if token is not yet valid
   */
  private isTokenNotYetValid(payload: EnhancedTokenPayload): boolean {
    if (!payload.nbf) {
      return false;
    }
    const now = Math.floor(Date.now() / 1000);
    return payload.nbf > now;
  }
}

// 创建单例实例
export const enhancedJWTFinal = EnhancedJWTFinal.getInstance();

// 为了方便使用，导出一些快捷函数
export async function generateEnhancedToken(
  payload: Omit<EnhancedTokenPayload, 'jti' | 'iat' | 'exp' | 'nbf'>,
  options?: JWTOptions
): Promise<TokenResult> {
  return enhancedJWTFinal.generateToken(payload, options);
}

export async function verifyEnhancedToken(token: string): Promise<VerificationResult> {
  return enhancedJWTFinal.verifyToken(token);
}

export function parseEnhancedToken(token: string): EnhancedTokenPayload | null {
  return enhancedJWTFinal.parseToken(token);
}

export async function refreshEnhancedToken(
  oldToken: string,
  options?: JWTOptions
): Promise<TokenResult> {
  return enhancedJWTFinal.refreshToken(oldToken, options);
}
