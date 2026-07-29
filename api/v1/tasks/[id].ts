import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withRoute, methodNotAllowed, optionalString, HttpError } from '../../_lib/http.js'
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
  if (value === null || value === '') return null
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00Z`)
    if (!Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value) return value
  }
  throw new HttpError(400, '"due_date" must use YYYY-MM-DD format.')
}

export default withRoute(async (req: VercelRequest, res: VercelResponse) => {
  await requireAuth(req, res)
  const id = req.query.id as string

  const existingRows = await sql`select * from tasks where id = ${id}`
  const existing = existingRows[0]
  if (!existing) throw new HttpError(404, 'Task not found.')

  if (req.method === 'GET') {
    res.status(200).json({ task: existing })
    return
  }

  if (req.method === 'PATCH') {
    const body = req.body as Record<string, unknown>
    const title = body.title !== undefined ? optionalString(body.title) : existing.title
    if (!title) throw new HttpError(400, '"title" is required.')

    const completed = body.completed === undefined ? existing.completed : body.completed
    if (typeof completed !== 'boolean') throw new HttpError(400, '"completed" must be a boolean.')

    const priority = body.priority === undefined ? existing.priority : parsePriority(body.priority)
    const dueDate = body.due_date === undefined ? existing.due_date : parseDueDate(body.due_date)

    const rows = await sql`
      update tasks
      set title = ${title}, completed = ${completed}, priority = ${priority},
          due_date = ${dueDate}, updated_at = now()
      where id = ${id}
      returning *
    `
    res.status(200).json({ task: rows[0] })
    return
  }

  if (req.method === 'DELETE') {
    await sql`delete from tasks where id = ${id}`
    res.status(204).end()
    return
  }

  methodNotAllowed(res, ['GET', 'PATCH', 'DELETE'])
})
