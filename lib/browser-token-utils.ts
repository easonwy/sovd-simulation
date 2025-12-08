/**
 * Browser-compatible token utilities
 * Uses browser APIs instead of Node.js Buffer
 */

import type { EnhancedTokenPayload } from './enhanced-jwt'

/**
 * Normalize/sanitize a token string for parsing
 */
export function normalizeToken(token: string): string {
  if (!token) return ''
  let t = token.trim()
  // Remove optional Bearer prefix
  if (t.toLowerCase().startsWith('bearer ')) {
    t = t.slice(7)
  }
  // Remove all whitespace characters (spaces, newlines, tabs)
  t = t.replace(/\s+/g, '')
  return t
}

/**
 * Base64URL decode for browsers
 */
function base64UrlDecode(str: string): string {
  str += '=='.substring(0, (4 - str.length % 4) % 4)
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  try {
    return atob(str)
  } catch (error) {
    throw new Error('Failed to decode base64url string')
  }
}

/**
 * Parse JWT token in browser environment
 */
export function parseTokenBrowser(token: string): EnhancedTokenPayload | null {
  try {
    const normalized = normalizeToken(token)
    const parts = normalized.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Decode payload (second part)
    const payloadJson = base64UrlDecode(parts[1])
    return JSON.parse(payloadJson) as EnhancedTokenPayload
  } catch (error) {
    console.error('Token parsing error:', error)
    return null
  }
}

/**
 * Parse JWT header in browser environment
 */
export function parseHeaderBrowser(token: string): any {
  try {
    const normalized = normalizeToken(token)
    const parts = normalized.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Decode header (first part)
    const headerJson = base64UrlDecode(parts[0])
    return JSON.parse(headerJson)
  } catch (error) {
    console.error('Header parsing error:', error)
    return null
  }
}

/**
 * Validate JWT format
 */
export function isValidJWTFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }

  const normalized = normalizeToken(token)
  const parts = normalized.split('.')
  if (parts.length !== 3) {
    return false
  }

  // Check if each part is base64url encoded
  try {
    parts.forEach(part => {
      if (!part) throw new Error('Empty part')
      // Try to decode each part
      base64UrlDecode(part)
    })
    return true
  } catch {
    return false
  }
}

/**
 * Extract token parts without full parsing
 */
export function extractTokenParts(token: string): { header: string; payload: string; signature: string } | null {
  try {
    const normalized = normalizeToken(token)
    const parts = normalized.split('.')
    if (parts.length !== 3) {
      return null
    }

    return {
      header: parts[0],
      payload: parts[1],
      signature: parts[2] || ''
    }
  } catch {
    return null
  }
}

export function decodeSignature(token: string): { base64: string; bytes: Uint8Array; hex: string } | null {
  const normalized = normalizeToken(token)
  const parts = normalized.split('.')
  if (parts.length !== 3) return null
  const sig = parts[2] || ''
  if (!sig) return null
  let b64 = sig.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4
  if (pad) b64 += '='.repeat(4 - pad)
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  let hex = ''
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0')
  return { base64: b64, bytes, hex }
}
