# Dellix — marketing site

Marketing site for **Dellix** (dellix.dev) — _Custom agents. Real code. Production outcomes._

Built with **Vite + React + TypeScript + Tailwind CSS v4**. Dark-mode-first, responsive, and structured so content is edited in plain data files — no digging through markup.

## Develop

```bash
npm install
npm run dev      # local dev server (http://localhost:5173)
npm run build    # typecheck + production build to /dist
npm run preview  # serve the production build locally
```

## Editing content

All copy lives in `src/data/` — edit these, not the components:

| File | What it controls |
| --- | --- |
| `src/data/site.ts` | Brand name, tagline, email, booking URL, nav links, hero stats, About copy + principles, Contact copy |
| `src/data/services.ts` | The two service buckets (add a third — the grid adapts) |
| `src/data/portfolio.ts` | Projects. Empty array → tasteful empty state. See the commented example for the shape |
| `src/data/socials.ts` | Social links. Empty `href` → disabled "coming soon" placeholder |

### Add a portfolio project

Uncomment the example in `src/data/portfolio.ts` and fill it in. Each project supports a name, description, tech stack, outcome, optional link, optional screenshot (drop the image in `public/` and reference it as `/work/your-image.png`), and an optional category label.

### Turn on a social link

In `src/data/socials.ts`, set the `href` for GitHub / LinkedIn / X. An empty string keeps it as a disabled placeholder so the layout never breaks. To add a new platform, add an entry and a matching SVG in `src/components/Icon.tsx`.

### Enable the "Book a call" button

Set `bookingUrl` in `src/data/site.ts` (e.g. a Cal.com / Calendly link). Empty hides the button.

## Design system

Tokens (colors, fonts, radius) are defined in `src/index.css` under `@theme`. Palette: charcoal background / steel surfaces / lime accent (used sparingly for emphasis + actions only).

## Structure

```
src/
  data/            content — edit these
  components/       UI sections + primitives (ui/Button, ui/Section)
  hooks/useReveal   subtle scroll-in animation (respects reduced-motion)
  App.tsx           page composition
```

## Deploy

Static output — `npm run build` produces `/dist`. Deploy to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages). No server required.
