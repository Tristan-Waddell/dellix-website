import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from '../../_lib/auth.js'
import { methodNotAllowed, withRoute } from '../../_lib/http.js'
import { LEAD_PRIORITIES, LEAD_STATUSES } from '../../../shared/types.js'

export default withRoute(async (req: VercelRequest, res: VercelResponse) => {
  await requireAuth(req, res)
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET'])
    return
  }

  res.status(200).json({
    statuses: LEAD_STATUSES,
    priorities: LEAD_PRIORITIES,
    limits: { bulk: 100, list: 100, tags: 30, score_min: 0, score_max: 100 },
    fields: {
      name: 'required string; person or prospect name',
      email: 'string or null',
      phone: 'string or null',
      title: 'string or null',
      company_name: 'string or null',
      company_domain: 'string or null',
      website_url: 'string URL or null',
      linkedin_url: 'string URL or null',
      source: 'string or null; where the lead was found',
      source_url: 'string URL or null; exact discovery page',
      notes: 'string or null; research and qualification notes',
      tags: 'string array or comma-separated string',
      custom_fields: 'JSON object for additional structured research',
      score: 'integer from 0 to 100',
      status: 'one of statuses',
      priority: 'one of priorities',
      discovered_at: 'ISO-8601 timestamp',
      last_enriched_at: 'ISO-8601 timestamp or null',
    },
    deduplication_order: ['email', 'linkedin_url', 'source_url', 'phone', 'name+company_name'],
    write_options: {
      upsert: 'boolean; defaults to true',
      notes_mode: ['append', 'replace'],
      tags_mode: ['merge', 'replace'],
      append_notes: 'PATCH-only boolean',
      merge_tags: 'PATCH-only boolean',
      mark_enriched: 'boolean; updates last_enriched_at',
    },
    filters: ['q', 'status', 'priority', 'source', 'tag', 'sort', 'limit', 'offset'],
    sort: ['created', 'updated', 'score'],
    endpoints: {
      list_or_create: '/api/v1/leads',
      bulk_upsert: '/api/v1/leads/bulk',
      api_options: '/api/v1/leads/options',
      read_update_delete: '/api/v1/leads/:id',
      convert: '/api/v1/leads/:id/convert',
    },
  })
})
