import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from '../../_lib/auth.js'
import { sql } from '../../_lib/db.js'
import { HttpError, methodNotAllowed, withRoute } from '../../_lib/http.js'
import { patchLead, publicLead, type LeadRow } from '../../_lib/leads.js'

export default withRoute(async (req: VercelRequest, res: VercelResponse) => {
  await requireAuth(req, res)
  const id = req.query.id as string
  const rows = await sql`select * from leads where id = ${id}`
  const existing = rows[0] as LeadRow | undefined
  if (!existing) throw new HttpError(404, 'Lead not found.')

  if (req.method === 'GET') {
    res.status(200).json({ lead: publicLead(existing as unknown as Record<string, unknown>) })
    return
  }

  if (req.method === 'PATCH') {
    const body = req.body as Record<string, unknown>
    if (body.append_notes !== undefined && typeof body.append_notes !== 'boolean') throw new HttpError(400, '"append_notes" must be a boolean.')
    if (body.merge_tags !== undefined && typeof body.merge_tags !== 'boolean') throw new HttpError(400, '"merge_tags" must be a boolean.')
    if (body.mark_enriched !== undefined && typeof body.mark_enriched !== 'boolean') throw new HttpError(400, '"mark_enriched" must be a boolean.')
    if (body.mark_viewed !== undefined && typeof body.mark_viewed !== 'boolean') throw new HttpError(400, '"mark_viewed" must be a boolean.')
    const lead = await patchLead(existing, body)
    res.status(200).json({ lead })
    return
  }

  if (req.method === 'DELETE') {
    await sql`delete from leads where id = ${id}`
    res.status(204).end()
    return
  }

  methodNotAllowed(res, ['GET', 'PATCH', 'DELETE'])
})
