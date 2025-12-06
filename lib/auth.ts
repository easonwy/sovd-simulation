import { SignJWT, jwtVerify } from 'jose'

const secretString = process.env.JWT_SECRET || 'sovd-secret-key-change-in-production'
const secret = new TextEncoder().encode(secretString)

export async function issueToken(role: 'Viewer' | 'Developer' | 'Admin', expiresIn: string | number = '3600s') {
  const jwt = await new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresIn)
    .sign(secret)
  return jwt
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret)
  return payload as { role?: string; email?: string; userId?: string }
}
