import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import { withRoute, methodNotAllowed, requireString, HttpError } from '../_lib/http.js'
import { createSessionCookie } from '../_lib/auth.js'

export default withRoute(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  const { password } = req.body as { password?: string }
  const submitted = requireString(password, 'password')

  const hash = process.env.ADMIN_PASSWORD_HASH
  if (!hash) throw new HttpError(500, 'ADMIN_PASSWORD_HASH is not configured.')

  const valid = await bcrypt.compare(submitted, hash)
  if (!valid) throw new HttpError(401, 'Incorrect password.')

  res.setHeader('Set-Cookie', await createSessionCookie())
  res.status(200).json({ success: true })
})
