import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withRoute, methodNotAllowed, requireString, optionalString } from '../../_lib/http.ts'
import { requireAuth } from '../../_lib/auth.ts'
import { sql } from '../../_lib/db.ts'

export default withRoute(async (req: VercelRequest, res: VercelResponse) => {
  await requireAuth(req, res)

  if (req.method === 'GET') {
    const q = typeof req.query.q === 'string' ? `%${req.query.q}%` : null
    const rows = q
      ? await sql`
          select * from contacts
          where name ilike ${q} or email ilike ${q}
          order by created_at desc
        `
      : await sql`select * from contacts order by created_at desc`
    res.status(200).json({ contacts: rows })
    return
  }

  if (req.method === 'POST') {
    const body = req.body as Record<string, unknown>
    const name = requireString(body.name, 'name')
    const email = optionalString(body.email)
    const phone = optionalString(body.phone)
    const title = optionalString(body.title)
    const notes = optionalString(body.notes)
    const companyId = optionalString(body.company_id)

    const rows = await sql`
      insert into contacts (name, email, phone, title, notes, company_id)
      values (${name}, ${email}, ${phone}, ${title}, ${notes}, ${companyId})
      returning *
    `
    res.status(201).json({ contact: rows[0] })
    return
  }

  methodNotAllowed(res, ['GET', 'POST'])
})
