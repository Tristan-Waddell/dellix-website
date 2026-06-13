import { about } from '../data/site'
import { Section, SectionHeading } from './ui/Section'
import { Icon } from './Icon'
import { useReveal } from '../hooks/useReveal'

export function About() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <Section id="about" aria-labelledby="about-heading">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-16">
        <div>
          <SectionHeading id="about-heading" eyebrow="About" title={about.heading} />
          <div className="mt-6 space-y-4">
            {about.paragraphs.map((p) => (
              <p key={p.slice(0, 24)} className="text-pretty leading-relaxed text-ink-muted">
                {p}
              </p>
            ))}
          </div>
        </div>

        <div ref={ref} className="reveal flex flex-col gap-5">
          <div className="flex justify-center lg:justify-start">
            <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-steel-600 ring-4 ring-charcoal-850">
              <img
                src="/tristan.png"
                alt="Tristan Waddell"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
          <div className="rounded-[var(--radius-card)] border border-steel-700 bg-steel-900/50 p-7 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-lime-500">How I work</p>
            <ul className="mt-5 grid gap-4">
              {about.principles.map((principle) => (
                <li key={principle} className="flex items-start gap-3">
                  <Icon name="check" className="mt-0.5 shrink-0 text-lg text-lime-500" />
                  <span className="text-ink">{principle}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  )
}
