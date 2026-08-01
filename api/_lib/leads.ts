import { createHash } from 'node:crypto'
import { sql } from './db.js'
import { HttpError, optionalString, requireString } from './http.js'
import { LEAD_PRIORITIES, LEAD_STATUSES, type Lead, type LeadPriority, type LeadStatus } from '../../shared/types.js'

export type LeadRow = Lead & { dedupe_key: string }

type SaveOptions = {
  upsert?: boolean
  notesMode?: 'append' | 'replace'
  tagsMode?: 'merge' | 'replace'
}

function has(body: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(body, key)
}

function stringField(body: Record<string, unknown>, key: string, existing?: LeadRow): string | null {
  if (!has(body, key)) return existing?.[key as keyof LeadRow] as string | null ?? null
  return optionalString(body[key])
}

function parseStatus(value: unknown, fallback: LeadStatus): LeadStatus {
  if (value === undefined) return fallback
  if (typeof value === 'string' && (LEAD_STATUSES as string[]).includes(value)) return value as LeadStatus
  throw new HttpError(400, `"status" must be one of: ${LEAD_STATUSES.join(', ')}`)
}

function parsePriority(value: unknown, fallback: LeadPriority): LeadPriority {
  if (value === undefined) return fallback
  if (typeof value === 'string' && (LEAD_PRIORITIES as string[]).includes(value)) return value as LeadPriority
  throw new HttpError(400, `"priority" must be one of: ${LEAD_PRIORITIES.join(', ')}`)
}

function parseScore(value: unknown, fallback: number): number {
  if (value === undefined) return fallback
  const score = Number(value)
  if (!Number.isInteger(score) || score < 0 || score > 100) throw new HttpError(400, '"score" must be an integer from 0 to 100.')
  return score
}

function parseTags(value: unknown, fallback: string[]): string[] {
  if (value === undefined) return fallback
  const values = typeof value === 'string' ? value.split(',') : value
  if (!Array.isArray(values) || values.some((tag) => typeof tag !== 'string')) {
    throw new HttpError(400, '"tags" must be an array of strings or a comma-separated string.')
  }
  const tags = [...new Set(values.map((tag) => tag.trim().toLowerCase()).filter(Boolean))]
  if (tags.length > 30 || tags.some((tag) => tag.length > 80)) throw new HttpError(400, '"tags" accepts up to 30 values of 80 characters each.')
  return tags
}

function parseCustomFields(value: unknown, fallback: Record<string, unknown>): Record<string, unknown> {
  if (value === undefined) return fallback
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, '"custom_fields" must be a JSON object.')
  return value as Record<string, unknown>
}

function parseTimestamp(value: unknown, fallback: string | null, field: string): string | null {
  if (value === undefined) return fallback
  if (value === null || value === '') return null
  if (typeof value !== 'string') throw new HttpError(400, `"${field}" must be an ISO-8601 timestamp.`)
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) throw new HttpError(400, `"${field}" must be an ISO-8601 timestamp.`)
  return parsed.toISOString()
}

function normalizeIdentity(value: string) {
  return value.trim().toLowerCase().replace(/\/$/, '')
}

function dedupeKey(lead: Pick<Lead, 'email' | 'linkedin_url' | 'source_url' | 'phone' | 'name' | 'company_name'>) {
  const identity = lead.email
    ? `email:${normalizeIdentity(lead.email)}`
    : lead.linkedin_url
      ? `linkedin:${normalizeIdentity(lead.linkedin_url)}`
      : lead.source_url
        ? `source:${normalizeIdentity(lead.source_url)}`
        : lead.phone
          ? `phone:${lead.phone.replace(/\D/g, '')}`
          : `name:${normalizeIdentity(lead.name)}|company:${normalizeIdentity(lead.company_name ?? '')}`
  return createHash('sha256').update(identity).digest('hex')
}

function normalizeLead(body: Record<string, unknown>, existing?: LeadRow): LeadRow {
  const name = has(body, 'name') ? requireString(body.name, 'name') : existing?.name
  if (!name) throw new HttpError(400, '"name" is required.')

  const lead: LeadRow = {
    id: existing?.id ?? '',
    name,
    email: stringField(body, 'email', existing)?.toLowerCase() ?? null,
    phone: stringField(body, 'phone', existing),
    title: stringField(body, 'title', existing),
    company_name: stringField(body, 'company_name', existing),
    company_domain: stringField(body, 'company_domain', existing)?.toLowerCase() ?? null,
    website_url: stringField(body, 'website_url', existing),
    linkedin_url: stringField(body, 'linkedin_url', existing),
    source: stringField(body, 'source', existing),
    source_url: stringField(body, 'source_url', existing),
    notes: stringField(body, 'notes', existing),
    tags: parseTags(body.tags, existing?.tags ?? []),
    custom_fields: parseCustomFields(body.custom_fields, existing?.custom_fields ?? {}),
    score: parseScore(body.score, existing?.score ?? 0),
    status: parseStatus(body.status, existing?.status ?? 'new'),
    priority: parsePriority(body.priority, existing?.priority ?? 'normal'),
    dedupe_key: '',
    contact_id: existing?.contact_id ?? null,
    discovered_at: parseTimestamp(body.discovered_at, existing?.discovered_at ?? new Date().toISOString(), 'discovered_at') ?? new Date().toISOString(),
    last_enriched_at: parseTimestamp(body.last_enriched_at, existing?.last_enriched_at ?? null, 'last_enriched_at'),
    created_at: existing?.created_at ?? '',
    updated_at: existing?.updated_at ?? '',
  }
  lead.dedupe_key = dedupeKey(lead)
  return lead
}

export function publicLead(row: Record<string, unknown>): Lead {
  const { dedupe_key: _dedupeKey, ...lead } = row
  return lead as Lead
}

async function updateLead(existing: LeadRow, body: Record<string, unknown>, options: SaveOptions) {
  const lead = normalizeLead(body, existing)

  if (has(body, 'notes') && options.notesMode !== 'replace' && existing.notes && lead.notes) {
    lead.notes = `${existing.notes}\n\n${lead.notes}`
  }
  if (has(body, 'tags') && options.tagsMode !== 'replace') {
    lead.tags = [...new Set([...existing.tags, ...lead.tags])]
  }
  if (has(body, 'custom_fields')) {
    lead.custom_fields = { ...existing.custom_fields, ...lead.custom_fields }
  }
  if (body.mark_enriched === true) lead.last_enriched_at = new Date().toISOString()

  const rows = await sql`
    update leads set
      name = ${lead.name}, email = ${lead.email}, phone = ${lead.phone}, title = ${lead.title},
      company_name = ${lead.company_name}, company_domain = ${lead.company_domain},
      website_url = ${lead.website_url}, linkedin_url = ${lead.linkedin_url}, source = ${lead.source},
      source_url = ${lead.source_url}, notes = ${lead.notes}, tags = ${JSON.stringify(lead.tags)}::jsonb,
      custom_fields = ${JSON.stringify(lead.custom_fields)}::jsonb, score = ${lead.score},
      status = ${lead.status}, priority = ${lead.priority}, dedupe_key = ${lead.dedupe_key},
      discovered_at = ${lead.discovered_at}, last_enriched_at = ${lead.last_enriched_at}, updated_at = now()
    where id = ${existing.id}
    returning *
  `
  return publicLead(rows[0] as Record<string, unknown>)
}

export async function saveLead(body: Record<string, unknown>, options: SaveOptions = {}) {
  const candidate = normalizeLead(body)
  const upsert = options.upsert !== false

  if (upsert) {
    const phoneDigits = candidate.phone?.replace(/\D/g, '') || null
    const useNameFallback = !candidate.email && !candidate.linkedin_url && !candidate.source_url && !phoneDigits
    const matches = await sql`
      select * from leads
      where dedupe_key = ${candidate.dedupe_key}
        or (${candidate.email}::text is not null and email is not null and lower(email) = lower(${candidate.email}))
        or (${candidate.linkedin_url}::text is not null and linkedin_url is not null and rtrim(lower(linkedin_url), '/') = rtrim(lower(${candidate.linkedin_url}), '/'))
        or (${candidate.source_url}::text is not null and source_url is not null and rtrim(lower(source_url), '/') = rtrim(lower(${candidate.source_url}), '/'))
        or (${phoneDigits}::text is not null and phone is not null and regexp_replace(phone, '[^0-9]', '', 'g') = ${phoneDigits})
        or (${useNameFallback} and lower(name) = lower(${candidate.name}) and lower(coalesce(company_name, '')) = lower(coalesce(${candidate.company_name}, '')))
      order by case when dedupe_key = ${candidate.dedupe_key} then 0 else 1 end
      limit 1
    `
    if (matches[0]) {
      const lead = await updateLead(matches[0] as LeadRow, body, options)
      return { lead, action: 'updated' as const }
    }
  }

  const rows = await sql`
    insert into leads (
      name, email, phone, title, company_name, company_domain, website_url, linkedin_url,
      source, source_url, notes, tags, custom_fields, score, status, priority, dedupe_key,
      discovered_at, last_enriched_at
    ) values (
      ${candidate.name}, ${candidate.email}, ${candidate.phone}, ${candidate.title},
      ${candidate.company_name}, ${candidate.company_domain}, ${candidate.website_url}, ${candidate.linkedin_url},
      ${candidate.source}, ${candidate.source_url}, ${candidate.notes}, ${JSON.stringify(candidate.tags)}::jsonb,
      ${JSON.stringify(candidate.custom_fields)}::jsonb, ${candidate.score}, ${candidate.status},
      ${candidate.priority}, ${candidate.dedupe_key}, ${candidate.discovered_at}, ${candidate.last_enriched_at}
    ) returning *
  `
  return { lead: publicLead(rows[0] as Record<string, unknown>), action: 'created' as const }
}

export async function patchLead(existing: LeadRow, body: Record<string, unknown>) {
  return updateLead(existing, body, {
    notesMode: body.append_notes === true ? 'append' : 'replace',
    tagsMode: body.merge_tags === true ? 'merge' : 'replace',
  })
}
