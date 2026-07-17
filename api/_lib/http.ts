import type { VercelRequest, VercelResponse } from '@vercel/node'

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void>

/** Wraps a Vercel function handler so thrown HttpErrors (and unknown errors) become JSON responses. */
export function withRoute(handler: Handler): Handler {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (err) {
      if (err instanceof HttpError) {
        res.status(err.status).json({ error: err.message })
        return
      }
      console.error('Unhandled route error:', err)
      res.status(500).json({ error: 'Internal server error.' })
    }
  }
}

export function methodNotAllowed(res: VercelResponse, allowed: string[]) {
  res.setHeader('Allow', allowed.join(', '))
  res.status(405).json({ error: 'Method not allowed.' })
}

export function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, `"${field}" is required.`)
  }
  return value.trim()
}

export function optionalString(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  return value.trim()
}
