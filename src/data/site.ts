/**
 * Site-wide content + configuration.
 * Edit this file to update the brand, nav, contact details, and about copy.
 */

export const site = {
  name: 'Dellix',
  domain: 'dellix.dev',
  tagline: 'Custom agents. Real code. Production outcomes.',
  /** Used in the hero sub-headline and meta description. */
  description:
    'Dellix builds custom AI agents and ships production software for teams that need real outcomes, not demos.',
  email: 'tristancwaddell@gmail.com',
  /** Optional booking link (e.g. Cal.com / Calendly). Leave empty to hide the button. */
  bookingUrl: 'tristanwaddell/30min',
} as const

/** Anchor links rendered in the sticky nav, in order. */
export const navLinks = [
  { label: 'Services', href: '#services' },
  { label: 'Work', href: '#work' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
] as const

/** Short, scannable credibility points shown under the hero. */
export const heroStats = [
  { value: 'Agents', label: 'Human-like assistance and automation' },
  { value: 'Full-stack', label: 'From data layer to interface' },
  { value: 'Direct', label: 'You work with the person who builds it' },
] as const

export const about = {
  heading: 'A builder who ships.',
  paragraphs: [
    'Dellix is a focused consulting practice. I design and build custom AI agents and production software for teams that need working systems, not slide decks.',
    'I have spent years writing code that runs in production, under real load, for real users. That bias toward shipping shapes everything: tight scopes, honest timelines, and systems built to be maintained after launch — not abandoned at the demo.',
    'Engagements stay small and senior on purpose. You work directly with the person writing the code, so context never gets lost in a handoff.',
  ],
  /** Short principles shown alongside the about copy. */
  principles: [
    'Outcomes over output',
    'Boring, durable architecture',
    'Clear scope, honest timelines',
    'Production-ready, not demo-ready',
  ],
} as const

export const contact = {
  heading: "Let's build something.",
  body: 'Book a 30-minute intro call to talk through what you are building. Prefer async? Send a message instead.',
} as const
