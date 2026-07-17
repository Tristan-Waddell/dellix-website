#!/usr/bin/env node
// Applies db/schema.sql against DATABASE_URL. Safe to re-run (all statements are idempotent).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add it to .env (see .env.example) before migrating.')
  process.exit(1)
}

const schemaPath = fileURLToPath(new URL('../db/schema.sql', import.meta.url))
const schema = readFileSync(schemaPath, 'utf8')
const sql = neon(process.env.DATABASE_URL)

try {
  await sql.query(schema)
  console.log('Migration applied.')
} catch (err) {
  console.error('Migration failed:', err)
  process.exit(1)
}
