import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from '../../_lib/auth.js'
import { HttpError, methodNotAllowed, withRoute } from '../../_lib/http.js'
import { saveLead } from '../../_lib/leads.js'

export default withRoute(async (req: VercelRequest, res: VercelResponse) => {
  await requireAuth(req, res)
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST'])
    return
  }

  const body = req.body as Record<string, unknown>
  if (!Array.isArray(body.leads) || body.leads.length === 0) throw new HttpError(400, '"leads" must be a non-empty array.')
  if (body.leads.length > 100) throw new HttpError(400, 'Bulk ingestion accepts at most 100 leads per request.')
  if (body.upsert !== undefined && typeof body.upsert !== 'boolean') throw new HttpError(400, '"upsert" must be a boolean.')
  if (body.notes_mode !== undefined && !['append', 'replace'].includes(String(body.notes_mode))) throw new HttpError(400, '"notes_mode" must be append or replace.')
  if (body.tags_mode !== undefined && !['merge', 'replace'].includes(String(body.tags_mode))) throw new HttpError(400, '"tags_mode" must be merge or replace.')
  const upsert = body.upsert !== false
  const notesMode = body.notes_mode === 'replace' ? 'replace' : 'append'
  const tagsMode = body.tags_mode === 'replace' ? 'replace' : 'merge'
  const results: Array<Record<string, unknown>> = []

  for (let start = 0; start < body.leads.length; start += 10) {
    const chunk = body.leads.slice(start, start + 10)
    const settled = await Promise.all(chunk.map(async (value, chunkIndex) => {
      const index = start + chunkIndex
      if (!value || typeof value !== 'object' || Array.isArray(value)) return { index, error: 'Lead must be a JSON object.' }
      try {
        const saved = await saveLead(value as Record<string, unknown>, { upsert, notesMode, tagsMode })
        return { index, ...saved }
      } catch (error) {
        return { index, error: error instanceof HttpError ? error.message : 'Could not save lead.' }
      }
    }))
    results.push(...settled)
  }

  const created = results.filter((result) => result.action === 'created').length
  const updated = results.filter((result) => result.action === 'updated').length
  const failed = results.filter((result) => result.error).length
  res.status(failed ? 207 : 200).json({ results, summary: { received: body.leads.length, created, updated, failed } })
})
