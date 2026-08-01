import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withRoute, methodNotAllowed, requireString, optionalString, HttpError } from '../../_lib/http.js'
import { requireAuth } from '../../_lib/auth.js'
import { sql } from '../../_lib/db.js'

export default withRoute(async (req: VercelRequest, res: VercelResponse) => {
  await requireAuth(req, res)

  if (req.method === 'GET') {
    const q = typeof req.query.q === 'string' ? `%${req.query.q}%` : null
    const activeOnly = req.query.active === 'true'
    const rows = q && activeOnly
      ? await sql`
          select * from contacts
          where (name ilike ${q} or email ilike ${q}) and is_active_client = true
          order by created_at desc
        `
      : q
      ? await sql`
          select * from contacts
          where name ilike ${q} or email ilike ${q}
          order by created_at desc
        `
      : activeOnly
        ? await sql`select * from contacts where is_active_client = true order by created_at desc`
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
    const isActiveClient = body.is_active_client ?? false
    if (typeof isActiveClient !== 'boolean') throw new HttpError(400, '"is_active_client" must be a boolean.')

    const rows = await sql`
      insert into contacts (name, email, phone, title, notes, company_id, is_active_client)
      values (${name}, ${email}, ${phone}, ${title}, ${notes}, ${companyId}, ${isActiveClient})
      returning *
    `
    res.status(201).json({ contact: rows[0] })
    return
  }

  methodNotAllowed(res, ['GET', 'POST'])
})
