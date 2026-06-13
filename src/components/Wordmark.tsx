import { site } from '../data/site'

/**
 * Text wordmark with a small lime mark. Kept as markup (not an image) so it
 * stays crisp at any size and inherits color. Swap the <span> mark for an
 * <img>/<svg> logo later if you commission one.
 */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="grid h-7 w-7 place-items-center rounded-md bg-lime-500 font-mono text-base font-bold text-charcoal-950"
        aria-hidden="true"
      >
        D
      </span>
      <span className="text-lg font-semibold tracking-tight text-ink">{site.name}</span>
    </span>
  )
}
