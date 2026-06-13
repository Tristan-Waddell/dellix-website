import { heroStats } from '../data/site'
import { Button } from './ui/Button'
import { Icon } from './Icon'

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-28 sm:pt-36">
      {/* technical grid backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid" aria-hidden="true" />

      <div className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="reveal is-visible max-w-3xl">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-steel-700 bg-steel-900/60 px-3.5 py-1.5 font-mono text-xs text-ink-muted">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-500" />
            </span>
            Available for new engagements
          </p>

          <h1 className="text-balance text-[1.75rem] font-semibold leading-[1.08] tracking-tight xs:text-4xl sm:text-6xl sm:leading-[1.05] lg:text-7xl">
            <span className="block text-gradient">Custom agents. Real code.</span>
            <span className="block text-lime-500">Production outcomes.</span>
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-ink-muted">
            Dellix builds custom AI agents and ships production software for teams that need real outcomes, not demos. Two things, done well: AI agents that work with you, and software built to run in production.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button href="#contact" variant="primary">
              Start a project
              <Icon name="arrow" className="text-[1.1em] transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button href="#services" variant="secondary">
              Explore services
            </Button>
          </div>
        </div>

        {/* Credibility strip */}
        <dl className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-card)] border border-steel-700 bg-steel-700 sm:grid-cols-3">
          {heroStats.map((stat) => (
            <div key={stat.value} className="bg-charcoal-850 p-5 sm:p-6">
              <dt className="text-lg font-semibold text-lime-500">{stat.value}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-ink-muted">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
