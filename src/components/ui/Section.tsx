import type { ReactNode } from 'react'
import { useReveal } from '../../hooks/useReveal'

type SectionProps = {
  id: string
  children: ReactNode
  className?: string
  'aria-labelledby'?: string
}

/** Page section with consistent vertical rhythm and a centered max-width container. */
export function Section({ id, children, className = '', ...rest }: SectionProps) {
  return (
    <section id={id} className={`scroll-mt-24 py-20 sm:py-28 ${className}`} {...rest}>
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">{children}</div>
    </section>
  )
}

type HeadingProps = {
  /** Small mono eyebrow label above the title. */
  eyebrow?: string
  title: string
  /** Supporting text under the title. */
  intro?: string
  /** Heading element id, so the parent <section> can be labelled by it. */
  id?: string
  align?: 'left' | 'center'
}

/** Standard section heading: mono eyebrow + display title + optional intro. */
export function SectionHeading({ eyebrow, title, intro, id, align = 'left' }: HeadingProps) {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`reveal max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''}`}
    >
      {eyebrow && (
        <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-lime-500">
          {align === 'left' && <span className="h-px w-6 bg-lime-500/60" aria-hidden="true" />}
          {eyebrow}
        </p>
      )}
      <h2 id={id} className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {intro && <p className="mt-4 text-pretty text-base leading-relaxed text-ink-muted sm:text-lg">{intro}</p>}
    </div>
  )
}
