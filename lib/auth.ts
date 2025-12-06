import { SignJWT, jwtVerify } from 'jose'

const secretString = process.env.SOVD_JWT_SECRET || 'dev-secret'
const secret = new TextEncoder().encode(secretString)

export async function issueToken(role: 'Viewer' | 'Developer' | 'Admin', expiresIn: string | number = '3600s') {
  const jwt = await new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('sovd-simulator')
    .setExpirationTime(expiresIn)
    .sign(secret)
  return jwt
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret, { issuer: 'sovd-simulator' })
  return payload as { role?: string }
}
