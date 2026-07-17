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

// Neon's HTTP driver runs one statement per request, so split on statement-terminating semicolons.
const statements = schema
  .split(/;\s*(?:\n|$)/)
  .map((s) => s.trim())
  .filter(Boolean)

try {
  for (const statement of statements) {
    await sql.query(statement)
  }
  console.log('Migration applied.')
} catch (err) {
  console.error('Migration failed:', err)
  process.exit(1)
}
