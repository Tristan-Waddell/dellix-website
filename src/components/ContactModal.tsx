import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

type Props = {
  open: boolean
  onClose: () => void
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function ContactModal({ open, onClose }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const firstFieldRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Focus trap + body scroll lock
  useEffect(() => {
    if (!open) return
    firstFieldRef.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function reset() {
    setName(''); setEmail(''); setMessage('')
    setStatus('idle'); setErrorMsg('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong.')
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-none ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-charcoal-950/80 backdrop-blur-sm" aria-hidden="true" />

      {/* Card */}
      <div className={`relative w-full max-w-lg rounded-[var(--radius-card)] border border-steel-700 bg-steel-900 shadow-2xl transition-none ${open ? 'scale-100' : 'scale-[0.97]'}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-steel-700 px-6 py-5">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold tracking-tight">Get in touch</h2>
            <p className="mt-0.5 text-sm text-ink-muted">I'll get back to you within two business days.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-steel-800 hover:text-ink"
          >
            <Icon name="close" className="text-base" />
          </button>
        </div>

        {status === 'success' ? (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-lime-500/15 text-2xl text-lime-500">
              <Icon name="check" />
            </span>
            <div>
              <p className="font-semibold">Message sent.</p>
              <p className="mt-1 text-sm text-ink-muted">You'll hear back within two business days.</p>
            </div>
            <button
              type="button"
              onClick={() => { reset(); onClose() }}
              className="mt-2 rounded-full border border-steel-600 bg-steel-800/60 px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-steel-700"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 px-6 py-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cf-name" className="text-sm font-medium text-ink">
                Name <span className="text-lime-500">*</span>
              </label>
              <input
                ref={firstFieldRef}
                id="cf-name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="rounded-lg border border-steel-600 bg-charcoal-850 px-3.5 py-2.5 text-sm text-ink placeholder-steel-500 outline-none transition-colors focus:border-lime-500/60 focus:ring-1 focus:ring-lime-500/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="cf-email" className="text-sm font-medium text-ink">
                Email <span className="text-lime-500">*</span>
              </label>
              <input
                id="cf-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-lg border border-steel-600 bg-charcoal-850 px-3.5 py-2.5 text-sm text-ink placeholder-steel-500 outline-none transition-colors focus:border-lime-500/60 focus:ring-1 focus:ring-lime-500/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="cf-message" className="text-sm font-medium text-ink">
                Additional info <span className="text-lime-500">*</span>
              </label>
              <textarea
                id="cf-message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell me what you're trying to build or fix…"
                className="resize-none rounded-lg border border-steel-600 bg-charcoal-850 px-3.5 py-2.5 text-sm text-ink placeholder-steel-500 outline-none transition-colors focus:border-lime-500/60 focus:ring-1 focus:ring-lime-500/30"
              />
            </div>

            {status === 'error' && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="mt-1 flex items-center justify-center gap-2 rounded-full bg-lime-500 px-5 py-2.5 text-sm font-semibold text-charcoal-950 transition-all hover:bg-lime-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'submitting' ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-charcoal-950/30 border-t-charcoal-950" />
                  Sending…
                </>
              ) : (
                <>
                  Send message
                  <Icon name="arrow" className="text-[1.05em]" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
