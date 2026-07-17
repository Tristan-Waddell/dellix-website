#!/usr/bin/env node
// Generates a new CLI/agent API key. Save the raw key somewhere safe (it's shown once) —
// only the hash is stored in the API_KEY_HASH env var.
import { randomBytes, createHash } from 'node:crypto'

const rawKey = `dlx_${randomBytes(24).toString('hex')}`
const hash = createHash('sha256').update(rawKey).digest('hex')

console.log('API key (give this to the CLI / your agent, shown once):\n')
console.log(`  ${rawKey}\n`)
console.log('Add this to your env (.env locally, and Vercel project settings):\n')
console.log(`  API_KEY_HASH=${hash}\n`)
