import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SignJWT, jwtVerify } from 'jose'
import { serialize } from 'cookie'
import { createHash, timingSafeEqual } from 'node:crypto'
import { HttpError } from './http.js'
import { sql } from './db.js'

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

function matchesHash(providedHash: Buffer, expectedHash: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(expectedHash)) return false
  const expected = Buffer.from(expectedHash, 'hex')
  return providedHash.length === expected.length && timingSafeEqual(providedHash, expected)
}

async function validApiKey(req: VercelRequest): Promise<boolean> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return false

  const providedKey = header.slice('Bearer '.length).trim()
  const providedHash = createHash('sha256').update(providedKey).digest()
  const providedHashHex = providedHash.toString('hex')

  // Preserve the original environment key and optionally accept a comma/space-separated
  // set during migration. Environment keys intentionally have no automatic expiry.
  const environmentHashes = [
    process.env.API_KEY_HASH,
    ...(process.env.API_KEY_HASHES?.split(/[,\s]+/) ?? []),
  ].filter((hash): hash is string => Boolean(hash))

  if (environmentHashes.some((hash) => matchesHash(providedHash, hash))) return true

  // Named agent keys are independently revocable and remain active until their
  // explicit expiration date, so issuing one never disables another.
  const rows = await sql`
    select id from api_keys
    where key_hash = ${providedHashHex}
      and revoked_at is null
      and (expires_at is null or expires_at > now())
    limit 1
  `
  if (!rows[0]) return false

  await sql`update api_keys set last_used_at = now() where id = ${rows[0].id}`
  return true
}

/** Guards CRM API routes: accepts either an admin session cookie or a Bearer API key. */
export async function requireAuth(req: VercelRequest, _res: VercelResponse): Promise<void> {
  if (await hasValidSession(req)) return
  if (await validApiKey(req)) return
  throw new HttpError(401, 'Unauthorized.')
}
