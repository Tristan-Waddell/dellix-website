import type { SVGProps } from 'react'

/**
 * Minimal SVG icon set. Add a new key here to support a new social platform
 * or service. Icons inherit `currentColor` and size from font-size unless
 * overridden via className.
 */
export type IconName =
  | 'github'
  | 'linkedin'
  | 'x'
  | 'tiktok'
  | 'email'
  | 'agents'
  | 'engineering'
  | 'arrow'
  | 'arrow-up-right'
  | 'check'
  | 'menu'
  | 'close'
  | 'calendar'

type Props = SVGProps<SVGSVGElement> & { name: IconName }

const paths: Record<IconName, React.ReactNode> = {
  github: (
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.486 2 12.02c0 4.428 2.865 8.183 6.839 9.51.5.092.682-.218.682-.483 0-.237-.009-.866-.013-1.7-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.467-1.11-1.467-.908-.622.069-.61.069-.61 1.004.071 1.532 1.034 1.532 1.034.892 1.532 2.341 1.09 2.91.833.092-.648.35-1.09.636-1.341-2.22-.253-4.555-1.114-4.555-4.957 0-1.095.39-1.99 1.029-2.69-.103-.254-.446-1.274.098-2.656 0 0 .84-.27 2.75 1.027A9.557 9.557 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.297 2.747-1.027 2.747-1.027.546 1.382.203 2.402.1 2.656.64.7 1.028 1.595 1.028 2.69 0 3.852-2.339 4.701-4.566 4.95.359.31.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.02C22 6.486 17.523 2 12 2Z"
    />
  ),
  tiktok: (
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.16 8.16 0 0 0 4.77 1.52V6.75a4.85 4.85 0 0 1-1-.06Z" />
  ),
  linkedin: (
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.83v1.64h.05c.53-1 1.84-2.06 3.78-2.06C20.3 8.58 21 10.96 21 14.06V21h-4v-6.13c0-1.46-.03-3.34-2.04-3.34-2.04 0-2.35 1.59-2.35 3.23V21H9V9Z" />
  ),
  x: (
    <path d="M17.53 3H21l-7.19 8.21L22 21h-6.56l-5.14-6.72L4.4 21H1l7.69-8.78L1.5 3h6.72l4.65 6.15L17.53 3Zm-1.15 16h1.84L7.7 4.9H5.73L16.38 19Z" />
  ),
  email: (
    <path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm9 7.2 8-5.2H4l8 5.2ZM4 8.4V18h16V8.4l-7.45 4.84a1 1 0 0 1-1.1 0L4 8.4Z" />
  ),
  agents: (
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="8" width="14" height="11" rx="2.5" />
      <path d="M12 8V4M9 2.5h6" />
      <circle cx="9.5" cy="13" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="13" r="1.1" fill="currentColor" stroke="none" />
      <path d="M2.5 12v3M21.5 12v3" />
    </g>
  ),
  engineering: (
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12" />
    </g>
  ),
  arrow: (
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 12h16m-6-6 6 6-6 6"
    />
  ),
  'arrow-up-right': (
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 17 17 7m0 0H8m9 0v9"
    />
  ),
  check: (
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m5 12 4.5 4.5L19 7"
    />
  ),
  menu: (
    <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
  ),
  close: (
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      d="M6 6l12 12M18 6 6 18"
    />
  ),
  calendar: (
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 2v3M16 2v3M3 8h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
    />
  ),
}

export function Icon({ name, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
