/**
 * Portfolio / case studies.
 *
 * Add a project by pushing an object onto `projects`. Every field except
 * `name`, `description`, `tech`, and `outcome` is optional. When the array
 * is empty the Portfolio section renders a tasteful empty state instead of
 * breaking the layout.
 */

export type Project = {
  name: string
  /** One- or two-sentence description of the project. */
  description: string
  /** Tech stack, rendered as tags. */
  tech: string[]
  /** The measurable result or impact. */
  outcome: string
  /** Optional external link (live site, repo, write-up). */
  link?: { label: string; href: string }
  /** Optional screenshot. Path is relative to /public, e.g. '/work/foo.png'. */
  image?: string
  /** Optional grouping label shown above the title. */
  category?: string
}

export const projects: Project[] = [
  {
    category: 'Open Source',
    name: 'AgenticAssure',
    description:
      'A testing and QA platform for AI agents. Run custom scenarios, score results, and catch failures, hallucinations, and broken tool calls before deployment.',
    tech: ['Python', 'Next.js', 'YAML', 'Semantic Scoring'],
    outcome: 'Production-grade evals for AI agents before they ship.',
    link: { label: 'Visit agenticassure.com', href: 'https://agenticassure.com' },
    image: '/work/agenticassure.jpg',
  },
  {
    category: 'Sports Tech',
    name: 'Fairseed Rankings',
    description:
      'Unbiased, data-driven sports rankings and scouting platform. Uses algorithmic analysis to deliver fair and transparent athlete evaluations.',
    tech: ['React', 'Vite', 'AWS Lambda', 'Data Analytics'],
    outcome: 'Algorithmic scouting replacing manual, biased evaluation.',
    link: { label: 'Visit fairseedrankings.com', href: 'https://fairseedrankings.com' },
    image: '/work/fairseed.jpg',
  },
  {
    category: 'Gaming',
    name: 'packcrafter.ai',
    description:
      'Describe your dream gameplay experience and let AI assemble the perfect modpack. Supports Minecraft, Stardew Valley, Terraria, Valheim, and more.',
    tech: ['AI', 'NLP', 'Multi-Platform'],
    outcome: 'Natural language modpack curation across multiple game ecosystems.',
    link: { label: 'Visit packcrafter.ai', href: 'https://packcrafter.ai' },
    image: '/work/packcrafter.jpg',
  },
]
