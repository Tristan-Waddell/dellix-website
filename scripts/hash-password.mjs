#!/usr/bin/env node
// Hashes an admin password for the ADMIN_PASSWORD_HASH env var.
// Usage: node scripts/hash-password.mjs 'your-password'
import bcrypt from 'bcryptjs'

const password = process.argv[2]
if (!password) {
  console.error("Usage: node scripts/hash-password.mjs 'your-password'")
  process.exit(1)
}

const hash = bcrypt.hashSync(password, 12)
console.log('Add this to your env (.env locally, and Vercel project settings):\n')
console.log(`  ADMIN_PASSWORD_HASH=${hash}\n`)
