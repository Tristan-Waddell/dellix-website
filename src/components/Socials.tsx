import { socials, type Social } from '../data/socials'
import { Icon, type IconName } from './Icon'
import { useReveal } from '../hooks/useReveal'

/** Compact social grid. Entries with an empty href render as disabled placeholders. */
export function Socials({ className = '' }: { className?: string }) {
  return (
    <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {socials.map((social, i) => (
        <SocialCard key={social.label} social={social} index={i} />
      ))}
    </div>
  )
}

function SocialCard({ social, index }: { social: Social; index: number }) {
  const ref = useReveal<HTMLDivElement>()
  const enabled = social.href.trim().length > 0
  const external = social.href.startsWith('http')

  const inner = (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-steel-700 bg-charcoal-850 text-xl text-ink transition-colors group-hover:border-lime-500/40 group-hover:text-lime-500">
        <Icon name={social.icon as IconName} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{social.label}</span>
        <span className="block truncate text-xs text-ink-muted">{social.handle}</span>
      </span>
      {enabled && (
        <Icon
          name="arrow-up-right"
          className="ml-auto text-lg text-ink-muted transition-colors group-hover:text-lime-500"
        />
      )}
    </>
  )

  const className =
    'reveal group flex items-center gap-3.5 rounded-[var(--radius-card)] border border-steel-700 bg-steel-900/50 p-4 transition-all duration-300'

  if (!enabled) {
    return (
      <div
        ref={ref}
        className={`${className} opacity-50`}
        aria-disabled="true"
        title="Link coming soon"
        style={{ transitionDelay: `${index * 60}ms` }}
      >
        {inner}
      </div>
    )
  }

  return (
    <a
      ref={ref as React.Ref<HTMLAnchorElement>}
      href={social.href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`${className} hover:-translate-y-0.5 hover:border-steel-600`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      {inner}
    </a>
  )
}
