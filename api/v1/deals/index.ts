import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withRoute, methodNotAllowed, requireString, optionalString, HttpError } from '../../_lib/http.js'
import { requireAuth } from '../../_lib/auth.js'
import { sql } from '../../_lib/db.js'
import { DEAL_STAGES, type DealStage } from '../../../shared/types.js'

function parseStage(value: unknown): DealStage {
  if (typeof value === 'string' && (DEAL_STAGES as string[]).includes(value)) return value as DealStage
  throw new HttpError(400, `"stage" must be one of: ${DEAL_STAGES.join(', ')}`)
}

export default withRoute(async (req: VercelRequest, res: VercelResponse) => {
  await requireAuth(req, res)

  if (req.method === 'GET') {
    const stage = typeof req.query.stage === 'string' ? req.query.stage : null
    const rows = stage
      ? await sql`select * from deals where stage = ${stage} order by created_at desc`
      : await sql`select * from deals order by created_at desc`
    res.status(200).json({ deals: rows })
    return
  }

  if (req.method === 'POST') {
    const body = req.body as Record<string, unknown>
    const name = requireString(body.name, 'name')
    const stage = body.stage !== undefined ? parseStage(body.stage) : 'lead'
    const valueCents = Number.isFinite(Number(body.value_cents)) ? Math.trunc(Number(body.value_cents)) : 0
    const notes = optionalString(body.notes)
    const contactId = optionalString(body.contact_id)
    const companyId = optionalString(body.company_id)

    const rows = await sql`
      insert into deals (name, stage, value_cents, notes, contact_id, company_id)
      values (${name}, ${stage}, ${valueCents}, ${notes}, ${contactId}, ${companyId})
      returning *
    `
    res.status(201).json({ deal: rows[0] })
    return
  }

  methodNotAllowed(res, ['GET', 'POST'])
})
