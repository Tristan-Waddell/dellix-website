import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withRoute, methodNotAllowed, optionalString, HttpError } from '../../_lib/http.js'
import { requireAuth } from '../../_lib/auth.js'
import { sql } from '../../_lib/db.js'

export default withRoute(async (req: VercelRequest, res: VercelResponse) => {
  await requireAuth(req, res)
  const id = req.query.id as string

  const existingRows = await sql`select * from contacts where id = ${id}`
  const existing = existingRows[0]
  if (!existing) throw new HttpError(404, 'Contact not found.')

  if (req.method === 'GET') {
    res.status(200).json({ contact: existing })
    return
  }

  if (req.method === 'PATCH') {
    const body = req.body as Record<string, unknown>
    const name = body.name !== undefined ? (optionalString(body.name) ?? existing.name) : existing.name
    const email = body.email !== undefined ? optionalString(body.email) : existing.email
    const phone = body.phone !== undefined ? optionalString(body.phone) : existing.phone
    const title = body.title !== undefined ? optionalString(body.title) : existing.title
    const notes = body.notes !== undefined ? optionalString(body.notes) : existing.notes
    const companyId = body.company_id !== undefined ? optionalString(body.company_id) : existing.company_id

    const rows = await sql`
      update contacts
      set name = ${name}, email = ${email}, phone = ${phone}, title = ${title},
          notes = ${notes}, company_id = ${companyId}, updated_at = now()
      where id = ${id}
      returning *
    `
    res.status(200).json({ contact: rows[0] })
    return
  }

  if (req.method === 'DELETE') {
    await sql`delete from contacts where id = ${id}`
    res.status(204).end()
    return
  }

  methodNotAllowed(res, ['GET', 'PATCH', 'DELETE'])
})
