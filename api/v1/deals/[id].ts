import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withRoute, methodNotAllowed, optionalString, HttpError } from '../../_lib/http.js'
import { requireAuth } from '../../_lib/auth.js'
import { sql } from '../../_lib/db.js'
import { DEAL_STAGES, type DealStage } from '../../../shared/types.js'

function parseStage(value: unknown): DealStage {
  if (typeof value === 'string' && (DEAL_STAGES as string[]).includes(value)) return value as DealStage
  throw new HttpError(400, `"stage" must be one of: ${DEAL_STAGES.join(', ')}`)
}

export default withRoute(async (req: VercelRequest, res: VercelResponse) => {
  await requireAuth(req, res)
  const id = req.query.id as string

  const existingRows = await sql`select * from deals where id = ${id}`
  const existing = existingRows[0]
  if (!existing) throw new HttpError(404, 'Deal not found.')

  if (req.method === 'GET') {
    res.status(200).json({ deal: existing })
    return
  }

  if (req.method === 'PATCH') {
    const body = req.body as Record<string, unknown>
    const name = body.name !== undefined ? (optionalString(body.name) ?? existing.name) : existing.name
    const stage = body.stage !== undefined ? parseStage(body.stage) : existing.stage
    const valueCents =
      body.value_cents !== undefined && Number.isFinite(Number(body.value_cents))
        ? Math.trunc(Number(body.value_cents))
        : existing.value_cents
    const notes = body.notes !== undefined ? optionalString(body.notes) : existing.notes
    const contactId = body.contact_id !== undefined ? optionalString(body.contact_id) : existing.contact_id
    const companyId = body.company_id !== undefined ? optionalString(body.company_id) : existing.company_id

    const rows = await sql`
      update deals
      set name = ${name}, stage = ${stage}, value_cents = ${valueCents}, notes = ${notes},
          contact_id = ${contactId}, company_id = ${companyId}, updated_at = now()
      where id = ${id}
      returning *
    `
    res.status(200).json({ deal: rows[0] })
    return
  }

  if (req.method === 'DELETE') {
    await sql`delete from deals where id = ${id}`
    res.status(204).end()
    return
  }

  methodNotAllowed(res, ['GET', 'PATCH', 'DELETE'])
})
