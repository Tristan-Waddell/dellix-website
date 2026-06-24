/**
 * Social + external links.
 *
 * To add or update a link, edit `href` below. Any entry with an empty `href`
 * is treated as "coming soon" and rendered as a disabled placeholder, so the
 * layout stays intact until you have the real URL.
 *
 * `icon` maps to a key in components/Icon.tsx — add a matching SVG there to
 * support a new platform.
 */

export type Social = {
  label: string
  icon: 'github' | 'linkedin' | 'x' | 'tiktok' | 'email' | (string & {})
  /** Full URL. Leave empty ('') to show a disabled placeholder. */
  href: string
  /** Shown as @handle / supporting text under the label. */
  handle?: string
}

export const socials: Social[] = [
  { label: 'TikTok', icon: 'tiktok', href: 'https://www.tiktok.com/@tristanwaddellx', handle: '@tristanwaddellx' },
  { label: 'GitHub', icon: 'github', href: 'https://github.com/Tristan-Waddell', handle: '@Tristan-Waddell' },
  { label: 'X', icon: 'x', href: 'https://x.com/tristanwaddellx', handle: '@tristanwaddellx' },
]
