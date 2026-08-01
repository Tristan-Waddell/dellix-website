import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withRoute, methodNotAllowed } from '../_lib/http.js'
import { requireAuth } from '../_lib/auth.js'
import { sql } from '../_lib/db.js'
import type { DashboardActivity, DashboardData, DealStage, Task } from '../../shared/types.js'

type ActivityRow = {
  id: string
  label: string
  detail: string | null
  occurred_at: string
}

export default withRoute(async (req: VercelRequest, res: VercelResponse) => {
  await requireAuth(req, res)

  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET'])
    return
  }

  const [summaryRows, pipelineRows, taskRows, contactRows, companyRows, dealRows, activityTaskRows] = await Promise.all([
    sql`
      select
        (select count(*) from contacts)::int as contacts,
        (select count(*) from companies)::int as companies,
        (select count(*) from contacts where is_active_client = true)::int as active_clients,
        (select count(*) from deals where stage not in ('won', 'lost'))::int as active_deals,
        (select coalesce(sum(value_cents), 0) from deals where stage not in ('won', 'lost'))::bigint as open_pipeline_cents
    `,
    sql`
      select stage, count(*)::int as count, coalesce(sum(value_cents), 0)::bigint as value_cents
      from deals
      group by stage
    `,
    sql`
      select * from tasks
      order by completed asc,
        case priority when 'high' then 0 when 'normal' then 1 else 2 end,
        due_date asc nulls last,
        created_at desc
    `,
    sql`select id, name as label, coalesce(title, email) as detail, created_at as occurred_at from contacts order by created_at desc limit 4`,
    sql`select id, name as label, domain as detail, created_at as occurred_at from companies order by created_at desc limit 4`,
    sql`select id, name as label, stage as detail, created_at as occurred_at from deals order by created_at desc limit 4`,
    sql`select id, title as label, priority as detail, created_at as occurred_at from tasks order by created_at desc limit 4`,
  ])

  const summary = summaryRows[0]
  const recentActivity: DashboardActivity[] = [
    ...(contactRows as ActivityRow[]).map((row) => ({ ...row, kind: 'contact' as const })),
    ...(companyRows as ActivityRow[]).map((row) => ({ ...row, kind: 'company' as const })),
    ...(dealRows as ActivityRow[]).map((row) => ({ ...row, kind: 'deal' as const })),
    ...(activityTaskRows as ActivityRow[]).map((row) => ({ ...row, kind: 'task' as const })),
  ]
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
    .slice(0, 7)

  const dashboard: DashboardData = {
    summary: {
      contacts: Number(summary?.contacts ?? 0),
      companies: Number(summary?.companies ?? 0),
      active_clients: Number(summary?.active_clients ?? 0),
      active_deals: Number(summary?.active_deals ?? 0),
      open_pipeline_cents: Number(summary?.open_pipeline_cents ?? 0),
    },
    pipeline: pipelineRows.map((row) => ({
      stage: row.stage as DealStage,
      count: Number(row.count),
      value_cents: Number(row.value_cents),
    })),
    tasks: taskRows as Task[],
    recent_activity: recentActivity,
  }

  res.status(200).json({ dashboard })
})
