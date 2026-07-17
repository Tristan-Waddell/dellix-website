import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withRoute, methodNotAllowed, optionalString, HttpError } from '../../_lib/http'
import { requireAuth } from '../../_lib/auth'
import { sql } from '../../_lib/db'

export default withRoute(async (req: VercelRequest, res: VercelResponse) => {
  await requireAuth(req, res)
  const id = req.query.id as string

  const existingRows = await sql`select * from companies where id = ${id}`
  const existing = existingRows[0]
  if (!existing) throw new HttpError(404, 'Company not found.')

  if (req.method === 'GET') {
    res.status(200).json({ company: existing })
    return
  }

  if (req.method === 'PATCH') {
    const body = req.body as Record<string, unknown>
    const name = body.name !== undefined ? (optionalString(body.name) ?? existing.name) : existing.name
    const domain = body.domain !== undefined ? optionalString(body.domain) : existing.domain
    const notes = body.notes !== undefined ? optionalString(body.notes) : existing.notes

    const rows = await sql`
      update companies
      set name = ${name}, domain = ${domain}, notes = ${notes}, updated_at = now()
      where id = ${id}
      returning *
    `
    res.status(200).json({ company: rows[0] })
    return
  }

  if (req.method === 'DELETE') {
    await sql`delete from companies where id = ${id}`
    res.status(204).end()
    return
  }

  methodNotAllowed(res, ['GET', 'PATCH', 'DELETE'])
})
