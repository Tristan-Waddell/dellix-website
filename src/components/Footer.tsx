import { navLinks, site } from '../data/site'
import { Wordmark } from './Wordmark'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-steel-700/80 bg-charcoal-950">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">{site.tagline}</p>
          </div>

          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm text-ink-muted transition-colors hover:text-ink">
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a href={`mailto:${site.email}`} className="text-sm text-ink-muted transition-colors hover:text-ink">
                  {site.email}
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-steel-700/70 pt-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <p className="font-mono">{site.domain}</p>
        </div>
      </div>
    </footer>
  )
}
