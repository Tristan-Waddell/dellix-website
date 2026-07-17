import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withRoute, methodNotAllowed, HttpError } from '../_lib/http.ts'
import { hasValidSession } from '../_lib/auth.ts'

export default withRoute(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  if (!(await hasValidSession(req))) throw new HttpError(401, 'Not authenticated.')
  res.status(200).json({ authenticated: true })
})
