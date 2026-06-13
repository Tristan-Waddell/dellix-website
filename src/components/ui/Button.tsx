import type { AnchorHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant
  children: ReactNode
}

const base =
  'group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium ' +
  'transition-all duration-200 ease-[var(--ease-out-soft)] focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap'

const variants: Record<Variant, string> = {
  // Lime — reserved for the primary action only.
  primary:
    'bg-lime-500 text-charcoal-950 font-semibold hover:bg-lime-400 ' +
    'hover:shadow-[0_0_0_1px_var(--color-lime-400),0_8px_30px_-8px_color-mix(in_oklab,var(--color-lime-500)_55%,transparent)] ' +
    'hover:-translate-y-0.5',
  secondary:
    'border border-steel-600 bg-steel-800/60 text-ink hover:border-steel-500 ' +
    'hover:bg-steel-700/60 hover:-translate-y-0.5',
  ghost: 'text-ink-muted hover:text-ink',
}

/** Anchor styled as a button. Use a real <a> so it works without JS and is keyboard-friendly. */
export function Button({ variant = 'primary', className = '', children, ...props }: Props) {
  return (
    <a className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </a>
  )
}
