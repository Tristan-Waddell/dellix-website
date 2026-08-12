import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email, message } = (req.body ?? {}) as {
    name?: string
    email?: string
    message?: string
  }

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'All fields are required.' })
  }

  const cleanName = name.trim()
  const cleanEmail = email.trim().toLowerCase()
  const cleanMessage = message.trim()
  if (!EMAIL_PATTERN.test(cleanEmail)) return res.status(400).json({ error: 'Enter a valid email address.' })
  if (cleanName.length > 120) return res.status(400).json({ error: 'Name must be 120 characters or fewer.' })
  if (cleanEmail.length > 320) return res.status(400).json({ error: 'Email address is too long.' })
  if (cleanMessage.length > 10_000) return res.status(400).json({ error: 'Additional info must be 10,000 characters or fewer.' })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured.')
    return res.status(503).json({ error: 'Email service is unavailable. Please try again later.' })
  }

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: 'Dellix Contact Form <onboarding@resend.dev>',
      to: 'tristancwaddell@gmail.com',
      replyTo: cleanEmail,
      subject: `New contact from ${cleanName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="margin:0 0 8px;font-size:20px;">New message from your Dellix site</h2>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:.05em;">Name</p>
          <p style="margin:0 0 16px;font-size:16px;">${escapeHtml(cleanName)}</p>
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:.05em;">Email</p>
          <p style="margin:0 0 16px;font-size:16px;"><a href="mailto:${escapeHtml(cleanEmail)}">${escapeHtml(cleanEmail)}</a></p>
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:.05em;">Additional info</p>
          <p style="margin:0;font-size:16px;white-space:pre-wrap;">${escapeHtml(cleanMessage)}</p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return res.status(502).json({ error: 'Failed to send message. Please try again.' })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Resend error:', err)
    return res.status(500).json({ error: 'Failed to send message. Please try again.' })
  }
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
