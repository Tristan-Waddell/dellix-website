#!/usr/bin/env node
// Creates a named, independently revocable API key in Postgres.
// The raw key is shown once; only its SHA-256 hash is stored.
import { randomBytes, createHash } from 'node:crypto'
import { neon } from '@neondatabase/serverless'

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? fallback : process.argv[index + 1]
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set. Run with `node --env-file=.env ...`.')
  process.exit(1)
}

const name = option('name', 'Agent API key')?.trim()
const days = Number(option('days', '365'))

if (!name) {
  console.error('--name cannot be empty.')
  process.exit(1)
}
if (!Number.isInteger(days) || days < 90 || days > 730) {
  console.error('--days must be a whole number from 90 to 730.')
  process.exit(1)
}

const rawKey = `dlx_${randomBytes(24).toString('hex')}`
const keyHash = createHash('sha256').update(rawKey).digest('hex')
const keyPrefix = rawKey.slice(0, 12)
const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
const sql = neon(connectionString)

const rows = await sql`
  insert into api_keys (name, key_prefix, key_hash, expires_at)
  values (${name}, ${keyPrefix}, ${keyHash}, ${expiresAt.toISOString()})
  returning id, name, key_prefix, expires_at, created_at
`

console.log(JSON.stringify({
  api_key: rows[0],
  key: rawKey,
  warning: 'Save this key now. It cannot be recovered later.',
}, null, 2))
