import { projects, type Project } from '../data/portfolio'
import { Section, SectionHeading } from './ui/Section'
import { Icon } from './Icon'
import { useReveal } from '../hooks/useReveal'

export function Portfolio() {
  const hasProjects = projects.length > 0

  return (
    <Section id="work" aria-labelledby="work-heading">
      <SectionHeading
        id="work-heading"
        eyebrow="Selected work"
        title="Our Portfolio."
        intro={
          hasProjects
            ? 'A sample of recent builds. More case studies coming as engagements wrap.'
            : undefined
        }
      />

      {hasProjects ? (
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <ProjectCard key={project.name} project={project} index={i} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </Section>
  )
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const ref = useReveal<HTMLElement>()
  const isLink = Boolean(project.link)

  return (
    <article
      ref={ref}
      className="reveal group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-steel-700 bg-steel-900/50 transition-all duration-300 hover:-translate-y-1 hover:border-steel-600"
      style={{ transitionDelay: `${index * 70}ms` }}
    >
      {/* Screenshot area — falls back to a branded placeholder if no image */}
      <div className="relative aspect-[16/10] overflow-hidden border-b border-steel-700 bg-charcoal-850">
        {project.image ? (
          <img
            src={project.image}
            alt={`${project.name} screenshot`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-grid">
            <span className="font-mono text-sm text-steel-500">{project.name}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        {project.category && (
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.15em] text-lime-500">{project.category}</p>
        )}
        <h3 className="text-lg font-semibold tracking-tight">{project.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{project.description}</p>

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {project.tech.map((t) => (
            <li
              key={t}
              className="rounded-md border border-steel-700 bg-charcoal-850 px-2 py-0.5 font-mono text-xs text-ink-muted"
            >
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-steel-700/70 pt-4">
          <div>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.15em] text-ink-muted">Outcome</p>
            <p className="mt-1 text-sm font-medium text-ink">{project.outcome}</p>
          </div>
          {isLink && (
            <Icon
              name="arrow-up-right"
              className="shrink-0 text-xl text-ink-muted transition-colors group-hover:text-lime-500"
            />
          )}
        </div>

        {/* Make the whole card clickable when a link exists, while keeping semantics clean */}
        {project.link && (
          <a href={project.link.href} className="absolute inset-0" aria-label={`${project.name} — ${project.link.label}`}>
            <span className="sr-only">{project.link.label}</span>
          </a>
        )}
      </div>
    </article>
  )
}

function EmptyState() {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className="reveal mt-12 flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-steel-700 bg-steel-900/30 px-6 py-16 text-center"
    >
      <span className="grid h-12 w-12 place-items-center rounded-xl border border-steel-700 bg-charcoal-850 text-2xl text-lime-500">
        <Icon name="engineering" />
      </span>
      <h3 className="mt-5 text-xl font-semibold tracking-tight">Case studies in progress.</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
        Recent work is being written up. In the meantime, the fastest way to see what we build is to start a
        conversation.
      </p>
      <a
        href="#contact"
        className="group mt-6 inline-flex items-center gap-2 rounded-full border border-steel-600 bg-steel-800/60 px-5 py-2.5 text-sm font-medium text-ink transition-all hover:border-lime-500/50 hover:bg-steel-700/60"
      >
        Get in touch
        <Icon name="arrow" className="transition-transform group-hover:translate-x-0.5" />
      </a>
    </div>
  )
}
