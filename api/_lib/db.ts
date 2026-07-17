import { neon } from '@neondatabase/serverless'

function client() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not configured.')
  return neon(connectionString)
}

/** Tagged-template SQL client. Rows are returned as a plain array. */
export const sql = client()
