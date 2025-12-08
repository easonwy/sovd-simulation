import { NextRequest } from 'next/server'

/**
 * Request Utility Functions
 * Used to extract various information from requests
 */

/**
 * Get client IP address
 */
export function getClientIp(req: NextRequest): string {
  // Check various possible IP address headers
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip',
    'x-forwarded',
    'forwarded-for',
    'forwarded',
    'x-cluster-client-ip',
    'x-proxyuser-ipi'
  ]

  for (const header of headers) {
    const value = req.headers.get(header)
    if (value) {
      // If multiple IPs are included, take the first one
      return value.split(',')[0].trim()
    }
  }

  // If none are found, return empty string
  return ''
}

/**
 * Get user agent string
 */
export function getUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || ''
}

/**
 * Get request referrer
 */
export function getReferer(req: NextRequest): string {
  return req.headers.get('referer') || req.headers.get('referrer') || ''
}

/**
 * Get request origin domain
 */
export function getOrigin(req: NextRequest): string {
  return req.headers.get('origin') || ''
}

/**
 * Get request hostname
 */
export function getHost(req: NextRequest): string {
  return req.headers.get('host') || ''
}

/**
 * Get full request URL
 */
export function getFullUrl(req: NextRequest): string {
  const protocol = req.headers.get('x-forwarded-proto') || 'http'
  const host = getHost(req)
  const url = req.nextUrl.pathname + req.nextUrl.search
  return `${protocol}://${host}${url}`
}

/**
 * Get request content type
 */
export function getContentType(req: NextRequest): string {
  return req.headers.get('content-type') || ''
}

/**
 * Get request content length
 */
export function getContentLength(req: NextRequest): number {
  const length = req.headers.get('content-length')
  return length ? parseInt(length, 10) : 0
}

/**
 * Get request Accept header
 */
export function getAccept(req: NextRequest): string {
  return req.headers.get('accept') || ''
}

/**
 * Get request Accept-Language header
 */
export function getAcceptLanguage(req: NextRequest): string {
  return req.headers.get('accept-language') || ''
}

/**
 * Get request Accept-Encoding header
 */
export function getAcceptEncoding(req: NextRequest): string {
  return req.headers.get('accept-encoding') || ''
}

/**
 * Get request Authorization header
 */
export function getAuthorization(req: NextRequest): string {
  return req.headers.get('authorization') || ''
}

/**
 * Get request X-Requested-With header (usually used to determine if it's an AJAX request)
 */
export function isAjaxRequest(req: NextRequest): boolean {
  return req.headers.get('x-requested-with') === 'XMLHttpRequest'
}

/**
 * Get request cookie
 */
export function getCookie(req: NextRequest, name: string): string {
  const cookie = req.headers.get('cookie')
  if (!cookie) return ''

  const cookies = cookie.split(';')
  for (const c of cookies) {
    const [key, value] = c.trim().split('=')
    if (key === name) {
      return decodeURIComponent(value || '')
    }
  }

  return ''
}

/**
 * Get all cookies
 */
export function getAllCookies(req: NextRequest): Record<string, string> {
  const cookie = req.headers.get('cookie')
  if (!cookie) return {}

  const cookies: Record<string, string> = {}
  const pairs = cookie.split(';')
  
  for (const pair of pairs) {
    const [key, value] = pair.trim().split('=')
    if (key) {
      cookies[key] = decodeURIComponent(value || '')
    }
  }

  return cookies
}

/**
 * Get request header information
 */
export function getHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {}
  
  req.headers.forEach((value, key) => {
    headers[key] = value
  })

  return headers
}

/**
 * Get request method
 */
export function getMethod(req: NextRequest): string {
  return req.method
}

/**
 * Get request path
 */
export function getPathname(req: NextRequest): string {
  return req.nextUrl.pathname
}

/**
 * Get query parameters
 */
export function getQueryParams(req: NextRequest): Record<string, string> {
  const params: Record<string, string> = {}
  
  req.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value
  })

  return params
}

/**
 * Get specific query parameter
 */
export function getQueryParam(req: NextRequest, name: string): string {
  return req.nextUrl.searchParams.get(name) || ''
}

/**
 * Determine if request is HTTPS
 */
export function isHttps(req: NextRequest): boolean {
  const proto = req.headers.get('x-forwarded-proto')
  return proto === 'https' || req.nextUrl.protocol === 'https:'
}

/**
 * Get request source information summary
 */
export function getRequestDigest(req: NextRequest): {
  ip: string
  userAgent: string
  method: string
  path: string
  query: string
  timestamp: number
} {
  return {
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
    method: getMethod(req),
    path: getPathname(req),
    query: req.nextUrl.search,
    timestamp: Date.now()
  }
}