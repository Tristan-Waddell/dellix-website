/**
 * The two service buckets. Add a third by appending to this array —
 * the grid adapts automatically.
 */

export type Service = {
  /** Short id, also used as the icon key. */
  id: 'agents' | 'engineering' | (string & {})
  name: string
  /** One-line positioning statement. */
  summary: string
  /** Longer supporting paragraph. */
  description: string
  /** Concrete deliverables / capabilities. */
  capabilities: string[]
}

export const services: Service[] = [
  {
    id: 'agents',
    name: 'Custom Agents',
    summary: 'Personal assistants and automations that live where you work.',
    description:
      'We build Hermes-style personal assistant agents and workflow automations that plug into the tools and channels your team already uses — Slack, Discord, email, and beyond. Real automations, not demos.',
    capabilities: [
      'Personal assistant agents (Hermes-style)',
      'Workflow automations across Slack, Discord & more',
      'Multi-channel integrations',
      'Custom triggers, actions & notification pipelines',
    ],
  },
  {
    id: 'engineering',
    name: 'Software Engineering',
    summary: 'Production software, built to last.',
    description:
      'Full-stack engineering for the systems your business runs on — from the data layer to the interface. Clean, tested, documented, and handed off in a state you can maintain.',
    capabilities: [
      'APIs, services & data pipelines',
      'Web apps & internal tools',
      'Cloud infrastructure & deployment',
      'Refactors, audits & rescue work',
    ],
  },
]
