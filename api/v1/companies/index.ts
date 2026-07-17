import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withRoute, methodNotAllowed, requireString, optionalString } from '../../_lib/http.js'
import { requireAuth } from '../../_lib/auth.js'
import { sql } from '../../_lib/db.js'

export default withRoute(async (req: VercelRequest, res: VercelResponse) => {
  await requireAuth(req, res)

  if (req.method === 'GET') {
    const q = typeof req.query.q === 'string' ? `%${req.query.q}%` : null
    const rows = q
      ? await sql`select * from companies where name ilike ${q} or domain ilike ${q} order by created_at desc`
      : await sql`select * from companies order by created_at desc`
    res.status(200).json({ companies: rows })
    return
  }

  if (req.method === 'POST') {
    const body = req.body as Record<string, unknown>
    const name = requireString(body.name, 'name')
    const domain = optionalString(body.domain)
    const notes = optionalString(body.notes)

    const rows = await sql`
      insert into companies (name, domain, notes)
      values (${name}, ${domain}, ${notes})
      returning *
    `
    res.status(201).json({ company: rows[0] })
    return
  }

  methodNotAllowed(res, ['GET', 'POST'])
})
