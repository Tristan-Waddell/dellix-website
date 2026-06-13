import { useState } from 'react'
import { contact } from '../data/site'
import { Section } from './ui/Section'
import { Socials } from './Socials'
import { Icon } from './Icon'
import { useReveal } from '../hooks/useReveal'
import { ContactModal } from './ContactModal'

export function Contact() {
  const ref = useReveal<HTMLDivElement>()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <Section id="contact" aria-labelledby="contact-heading">
      <div
        ref={ref}
        className="reveal relative overflow-hidden rounded-[var(--radius-card)] border border-steel-700 bg-gradient-to-b from-steel-900/70 to-charcoal-850 p-8 sm:p-12"
      >
        <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-60" aria-hidden="true" />

        <div className="max-w-2xl">
          <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-lime-500">
            <span className="h-px w-6 bg-lime-500/60" aria-hidden="true" />
            Contact
          </p>
          <h2 id="contact-heading" className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {contact.heading}
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-ink-muted sm:text-lg">{contact.body}</p>

          <div className="mt-8">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="group inline-flex items-center gap-2 rounded-full bg-lime-500 px-5 py-2.5 text-sm font-semibold text-charcoal-950 transition-all hover:bg-lime-400 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_var(--color-lime-400),0_8px_30px_-8px_color-mix(in_oklab,var(--color-lime-500)_55%,transparent)]"
            >
              <Icon name="email" className="text-[1.1em]" />
              Contact Me
              <Icon name="arrow" className="text-[1.05em] transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Socials />
      </div>

      <ContactModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Section>
  )
}
