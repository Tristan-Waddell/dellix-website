import { useEffect, useState } from 'react'
import Cal, { getCalApi } from '@calcom/embed-react'
import { ContactModal } from '../components/ContactModal.tsx'
import { Icon } from '../components/Icon.tsx'
import { Wordmark } from '../components/Wordmark.tsx'
import { site } from '../data/site.ts'

export function BookingPage() {
  const [emailModalOpen, setEmailModalOpen] = useState(false)

  useEffect(() => {
    void (async () => {
      const cal = await getCalApi({})
      cal('ui', {
        theme: 'dark',
        hideEventTypeDetails: false,
        styles: { branding: { brandColor: '#aee63b' } },
      })
    })()
  }, [])

  return (
    <div className="relative min-h-dvh overflow-hidden bg-charcoal-900">
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-50" aria-hidden="true" />
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--color-lime-500)_8%,transparent),transparent_70%)]"
        aria-hidden="true"
      />

      <header className="relative z-10 border-b border-steel-700/70 bg-charcoal-950/65 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="/" aria-label={`${site.name} home`} className="rounded-md">
            <Wordmark />
          </a>
          <a
            href="/"
            className="group inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            <Icon name="arrow" className="rotate-180 transition-transform group-hover:-translate-x-0.5" />
            Back to site
          </a>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-lime-500">30-minute intro</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
            Let&rsquo;s talk about what you&rsquo;re building.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-ink-muted sm:text-base">
            Pick a time that works for you. We&rsquo;ll use the call to understand the problem, explore fit, and identify a useful next step.
          </p>
        </div>

        <section
          aria-label="Choose a time"
          className="mx-auto mt-8 min-h-[720px] max-w-5xl overflow-hidden rounded-[var(--radius-card)] border border-steel-700 bg-steel-900/75 shadow-2xl shadow-charcoal-950/40 sm:mt-10"
        >
          <Cal
            calLink={site.bookingUrl}
            config={{ layout: 'month_view', theme: 'dark' }}
            className="h-full min-h-[720px] w-full"
          />
        </section>

        <p className="mt-6 text-center text-xs text-steel-400">
          Can&rsquo;t find a time?{' '}
          <button
            type="button"
            onClick={() => setEmailModalOpen(true)}
            className="text-ink-muted underline decoration-steel-600 underline-offset-4 hover:text-ink"
          >
            Send an email
          </button>
        </p>
      </main>

      <ContactModal open={emailModalOpen} onClose={() => setEmailModalOpen(false)} />
    </div>
  )
}
