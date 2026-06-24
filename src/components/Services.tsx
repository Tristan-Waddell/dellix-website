import { services, type Service } from '../data/services'
import { Section, SectionHeading } from './ui/Section'
import { Icon, type IconName } from './Icon'
import { useReveal } from '../hooks/useReveal'

export function Services() {
  return (
    <Section id="services" aria-labelledby="services-heading">
      <SectionHeading
        id="services-heading"
        eyebrow="Services"
        title="Two Buckets."
        intro="Focused work in the areas where we can move the needle for you."
      />

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {services.map((service, i) => (
          <ServiceCard key={service.id} service={service} index={i} />
        ))}
      </div>
    </Section>
  )
}

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const ref = useReveal<HTMLElement>()
  const icon = (service.id === 'agents' ? 'agents' : 'engineering') as IconName

  return (
    <article
      ref={ref}
      className="reveal group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-steel-700 bg-steel-900/50 p-7 transition-colors duration-300 hover:border-steel-600 sm:p-8"
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* hover glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-lime-500/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
      />

      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-steel-700 bg-charcoal-850 text-2xl text-lime-500 transition-colors group-hover:border-lime-500/40">
          <Icon name={icon} />
        </span>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-ink-muted">
            {String(index + 1).padStart(2, '0')}
          </p>
          <h3 className="text-xl font-semibold tracking-tight">{service.name}</h3>
        </div>
      </div>

      <p className="mt-5 text-base font-medium text-ink">{service.summary}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{service.description}</p>

      <ul className="mt-6 grid gap-2.5 border-t border-steel-700/70 pt-6">
        {service.capabilities.map((cap) => (
          <li key={cap} className="flex items-start gap-2.5 text-sm text-ink-muted">
            <Icon name="check" className="mt-0.5 shrink-0 text-base text-lime-500" />
            <span>{cap}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}
