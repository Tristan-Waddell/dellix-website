import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from '../../../_lib/auth.js'
import { sql } from '../../../_lib/db.js'
import { HttpError, methodNotAllowed, optionalString, withRoute } from '../../../_lib/http.js'
import { publicLead, type LeadRow } from '../../../_lib/leads.js'
import { DEAL_STAGES, type DealStage } from '../../../../shared/types.js'

function parseBoolean(value: unknown, fallback: boolean, field: string) {
  if (value === undefined) return fallback
  if (typeof value !== 'boolean') throw new HttpError(400, `"${field}" must be a boolean.`)
  return value
}

export default withRoute(async (req: VercelRequest, res: VercelResponse) => {
  await requireAuth(req, res)
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST'])
    return
  }

  const id = req.query.id as string
  const leadRows = await sql`select * from leads where id = ${id}`
  const lead = leadRows[0] as LeadRow | undefined
  if (!lead) throw new HttpError(404, 'Lead not found.')
  const body = req.body as Record<string, unknown>
  const createCompany = parseBoolean(body.create_company, true, 'create_company')
  const isActiveClient = parseBoolean(body.is_active_client, false, 'is_active_client')
  const createDeal = parseBoolean(body.create_deal, false, 'create_deal')
  const rawStage = body.deal_stage ?? 'lead'
  if (typeof rawStage !== 'string' || !(DEAL_STAGES as string[]).includes(rawStage)) {
    throw new HttpError(400, `"deal_stage" must be one of: ${DEAL_STAGES.join(', ')}`)
  }
  const dealStage = rawStage as DealStage
  const dealName = optionalString(body.deal_name) ?? `${lead.company_name ?? lead.name} opportunity`
  const valueCents = body.deal_value_cents === undefined ? 0 : Number(body.deal_value_cents)
  if (!Number.isInteger(valueCents) || valueCents < 0) throw new HttpError(400, '"deal_value_cents" must be a non-negative integer.')

  let company: Record<string, unknown> | null = null
  if (lead.company_name) {
    const existingCompanies = lead.company_domain
      ? await sql`select * from companies where lower(domain) = lower(${lead.company_domain}) or lower(name) = lower(${lead.company_name}) limit 1`
      : await sql`select * from companies where lower(name) = lower(${lead.company_name}) limit 1`
    company = existingCompanies[0] as Record<string, unknown> | undefined ?? null
    if (!company && createCompany) {
      const rows = await sql`
        insert into companies (name, domain, notes)
        values (${lead.company_name}, ${lead.company_domain}, ${lead.source ? `Lead source: ${lead.source}` : null})
        returning *
      `
      company = rows[0] as Record<string, unknown>
    }
  }

  let contact: Record<string, unknown> | null = null
  let alreadyLinked = false
  if (lead.contact_id) {
    const rows = await sql`select * from contacts where id = ${lead.contact_id}`
    contact = rows[0] as Record<string, unknown> | undefined ?? null
    alreadyLinked = Boolean(contact)
  }
  if (!contact && lead.email) {
    const rows = await sql`select * from contacts where lower(email) = lower(${lead.email}) limit 1`
    contact = rows[0] as Record<string, unknown> | undefined ?? null
  }

  if (contact) {
    const notes = alreadyLinked
      ? contact.notes
      : lead.notes && contact.notes
      ? `${String(contact.notes)}\n\nLead generation notes:\n${lead.notes}`
      : lead.notes ?? contact.notes
    const rows = await sql`
      update contacts set
        name = ${lead.name}, email = coalesce(${lead.email}, email), phone = coalesce(${lead.phone}, phone),
        title = coalesce(${lead.title}, title), notes = ${notes},
        company_id = coalesce(${company?.id ?? null}, company_id), is_active_client = ${isActiveClient} or is_active_client,
        updated_at = now()
      where id = ${contact.id}
      returning *
    `
    contact = rows[0] as Record<string, unknown>
  } else {
    const rows = await sql`
      insert into contacts (name, email, phone, title, notes, company_id, is_active_client)
      values (${lead.name}, ${lead.email}, ${lead.phone}, ${lead.title}, ${lead.notes}, ${company?.id ?? null}, ${isActiveClient})
      returning *
    `
    contact = rows[0] as Record<string, unknown>
  }

  let deal: Record<string, unknown> | null = null
  if (createDeal) {
    const rows = await sql`
      insert into deals (name, stage, value_cents, notes, contact_id, company_id)
      values (${dealName}, ${dealStage}, ${valueCents}, ${lead.notes}, ${contact.id}, ${company?.id ?? null})
      returning *
    `
    deal = rows[0] as Record<string, unknown>
  }

  const updatedRows = await sql`
    update leads set status = 'converted', contact_id = ${contact.id}, updated_at = now()
    where id = ${lead.id}
    returning *
  `

  res.status(200).json({
    lead: publicLead(updatedRows[0] as Record<string, unknown>),
    contact,
    company,
    deal,
  })
})
