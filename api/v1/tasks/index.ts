import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withRoute, methodNotAllowed, requireString, HttpError } from '../../_lib/http.js'
import { requireAuth } from '../../_lib/auth.js'
import { sql } from '../../_lib/db.js'
import { TASK_PRIORITIES, type TaskPriority } from '../../../shared/types.js'

function parsePriority(value: unknown): TaskPriority {
  if (typeof value === 'string' && (TASK_PRIORITIES as string[]).includes(value)) {
    return value as TaskPriority
  }
  throw new HttpError(400, `"priority" must be one of: ${TASK_PRIORITIES.join(', ')}`)
}

function parseDueDate(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00Z`)
    if (!Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value) return value
  }
  throw new HttpError(400, '"due_date" must use YYYY-MM-DD format.')
}

export default withRoute(async (req: VercelRequest, res: VercelResponse) => {
  await requireAuth(req, res)

  if (req.method === 'GET') {
    const rows = await sql`
      select * from tasks
      order by completed asc,
        case priority when 'high' then 0 when 'normal' then 1 else 2 end,
        due_date asc nulls last,
        created_at desc
    `
    res.status(200).json({ tasks: rows })
    return
  }

  if (req.method === 'POST') {
    const body = req.body as Record<string, unknown>
    const title = requireString(body.title, 'title')
    const priority = body.priority === undefined ? 'normal' : parsePriority(body.priority)
    const dueDate = parseDueDate(body.due_date)

    const rows = await sql`
      insert into tasks (title, priority, due_date)
      values (${title}, ${priority}, ${dueDate})
      returning *
    `
    res.status(201).json({ task: rows[0] })
    return
  }

  methodNotAllowed(res, ['GET', 'POST'])
})
