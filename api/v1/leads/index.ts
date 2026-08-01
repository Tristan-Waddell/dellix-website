import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from '../../_lib/auth.js'
import { sql } from '../../_lib/db.js'
import { HttpError, methodNotAllowed, withRoute } from '../../_lib/http.js'
import { publicLead, saveLead } from '../../_lib/leads.js'
import { LEAD_PRIORITIES, LEAD_STATUSES, type LeadPriority, type LeadStatus } from '../../../shared/types.js'

function queryValue(value: string | string[] | undefined) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function parseInteger(value: string | string[] | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(queryValue(value) ?? fallback)
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) throw new HttpError(400, `Pagination values must be integers from ${min} to ${max}.`)
  return parsed
}

export default withRoute(async (req: VercelRequest, res: VercelResponse) => {
  await requireAuth(req, res)

  if (req.method === 'GET') {
    const rawQuery = queryValue(req.query.q)
    const q = rawQuery ? `%${rawQuery}%` : null
    const rawStatus = queryValue(req.query.status)
    const rawPriority = queryValue(req.query.priority)
    if (rawStatus && !(LEAD_STATUSES as string[]).includes(rawStatus)) throw new HttpError(400, `"status" must be one of: ${LEAD_STATUSES.join(', ')}`)
    if (rawPriority && !(LEAD_PRIORITIES as string[]).includes(rawPriority)) throw new HttpError(400, `"priority" must be one of: ${LEAD_PRIORITIES.join(', ')}`)
    const status = rawStatus as LeadStatus | null
    const priority = rawPriority as LeadPriority | null
    const source = queryValue(req.query.source)
    const tag = queryValue(req.query.tag)
    const tagFilter = tag ? JSON.stringify([tag.toLowerCase()]) : null
    const rawViewed = queryValue(req.query.viewed)
    if (rawViewed && !['true', 'false'].includes(rawViewed)) throw new HttpError(400, '"viewed" must be true or false.')
    const viewed = rawViewed === null ? null : rawViewed === 'true'
    const limit = parseInteger(req.query.limit, 50, 1, 100)
    const offset = parseInteger(req.query.offset, 0, 0, 1_000_000)
    const sort = queryValue(req.query.sort) ?? 'created'
    if (!['created', 'updated', 'score'].includes(sort)) throw new HttpError(400, '"sort" must be created, updated, or score.')

    const [rows, countRows, summaryRows] = await Promise.all([
      sql`
        select * from leads
        where (${q}::text is null or
          name ilike ${q} or email ilike ${q} or phone ilike ${q} or title ilike ${q} or
          company_name ilike ${q} or company_domain ilike ${q} or source ilike ${q} or notes ilike ${q})
          and (${status}::text is null or status = ${status})
          and (${priority}::text is null or priority = ${priority})
          and (${source}::text is null or lower(source) = lower(${source}))
          and (${tagFilter}::jsonb is null or tags @> ${tagFilter}::jsonb)
          and (${viewed}::boolean is null or (${viewed} = true and viewed_at is not null) or (${viewed} = false and viewed_at is null))
        order by
          case when ${sort} = 'score' then score end desc,
          case when ${sort} = 'updated' then updated_at end desc,
          case when ${sort} = 'created' then created_at end desc,
          created_at desc
        limit ${limit} offset ${offset}
      `,
      sql`
        select count(*)::int as total from leads
        where (${q}::text is null or
          name ilike ${q} or email ilike ${q} or phone ilike ${q} or title ilike ${q} or
          company_name ilike ${q} or company_domain ilike ${q} or source ilike ${q} or notes ilike ${q})
          and (${status}::text is null or status = ${status})
          and (${priority}::text is null or priority = ${priority})
          and (${source}::text is null or lower(source) = lower(${source}))
          and (${tagFilter}::jsonb is null or tags @> ${tagFilter}::jsonb)
          and (${viewed}::boolean is null or (${viewed} = true and viewed_at is not null) or (${viewed} = false and viewed_at is null))
      `,
      sql`
        select
          count(*)::int as total,
          count(*) filter (where status = 'new')::int as new,
          count(*) filter (where status = 'researching')::int as researching,
          count(*) filter (where status = 'qualified')::int as qualified,
          count(*) filter (where status = 'contacted')::int as contacted,
          count(*) filter (where status = 'disqualified')::int as disqualified,
          count(*) filter (where status = 'converted')::int as converted,
          count(*) filter (where viewed_at is null)::int as unviewed
        from leads
      `,
    ])

    res.status(200).json({
      leads: rows.map((row) => publicLead(row as Record<string, unknown>)),
      summary: summaryRows[0],
      pagination: { total: Number(countRows[0]?.total ?? 0), limit, offset },
    })
    return
  }

  if (req.method === 'POST') {
    const body = req.body as Record<string, unknown>
    const upsert = body.upsert === undefined ? true : body.upsert
    if (typeof upsert !== 'boolean') throw new HttpError(400, '"upsert" must be a boolean.')
    if (body.notes_mode !== undefined && !['append', 'replace'].includes(String(body.notes_mode))) throw new HttpError(400, '"notes_mode" must be append or replace.')
    if (body.tags_mode !== undefined && !['merge', 'replace'].includes(String(body.tags_mode))) throw new HttpError(400, '"tags_mode" must be merge or replace.')
    const notesMode = body.notes_mode === 'replace' ? 'replace' : 'append'
    const tagsMode = body.tags_mode === 'replace' ? 'replace' : 'merge'
    const result = await saveLead(body, { upsert, notesMode, tagsMode })
    res.status(result.action === 'created' ? 201 : 200).json(result)
    return
  }

  methodNotAllowed(res, ['GET', 'POST'])
})
