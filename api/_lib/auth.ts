import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SignJWT, jwtVerify } from 'jose'
import { serialize } from 'cookie'
import { createHash, timingSafeEqual } from 'node:crypto'
import { HttpError } from './http.ts'

const SESSION_COOKIE = 'dellix_session'
const SESSION_TTL = '7d'
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

function sessionSecretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new HttpError(500, 'SESSION_SECRET is not configured.')
  return new TextEncoder().encode(secret)
}

export async function createSessionCookie(): Promise<string> {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(sessionSecretKey())

  return serialize(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export function clearSessionCookie(): string {
  return serialize(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

/** Returns true if the request carries a valid admin session cookie. */
export async function hasValidSession(req: VercelRequest): Promise<boolean> {
  const token = req.cookies?.[SESSION_COOKIE]
  if (!token) return false
  try {
    await jwtVerify(token, sessionSecretKey())
    return true
  } catch {
    return false
  }
}

function validApiKey(req: VercelRequest): boolean {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return false
  const expectedHash = process.env.API_KEY_HASH
  if (!expectedHash) return false

  const providedKey = header.slice('Bearer '.length).trim()
  const providedHash = createHash('sha256').update(providedKey).digest()
  const expected = Buffer.from(expectedHash, 'hex')

  if (providedHash.length !== expected.length) return false
  return timingSafeEqual(providedHash, expected)
}

/** Guards CRM API routes: accepts either an admin session cookie or a Bearer API key. */
export async function requireAuth(req: VercelRequest, _res: VercelResponse): Promise<void> {
  if (await hasValidSession(req)) return
  if (validApiKey(req)) return
  throw new HttpError(401, 'Unauthorized.')
}
