import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withRoute, methodNotAllowed } from '../_lib/http.ts'
import { clearSessionCookie } from '../_lib/auth.ts'

export default withRoute(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  res.setHeader('Set-Cookie', clearSessionCookie())
  res.status(200).json({ success: true })
})
