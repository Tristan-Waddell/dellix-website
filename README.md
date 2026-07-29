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
  admin/            CRM admin portal (separate app, served at /admin)
api/
  contact.ts        contact form → Resend
  auth/             admin login/logout/session check
  v1/               CRM REST API (dashboard, tasks, contacts, companies, deals)
  _lib/             shared API helpers (db, auth, http)
shared/types.ts      types shared by the API, admin UI, and CLI
cli/dellix-crm.js    CLI for the CRM API
db/schema.sql        Postgres schema
scripts/             one-off setup scripts (migrate, hash password, generate API key)
```

## CRM

A small HubSpot-style CRM (contacts, companies, deals) lives behind `/admin`, linked from the Footer. It's the same REST API for the admin portal, the CLI, and any personal agent — just two ways to authenticate.

### One-time setup

1. Add Vercel Postgres (Neon) from the Vercel dashboard's Storage tab, or point `DATABASE_URL` at any Postgres instance.
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — from the Storage tab (or your own Postgres).
   - `SESSION_SECRET` — `openssl rand -hex 32`.
   - `ADMIN_PASSWORD_HASH` — `npm run hash-password -- 'your-password'`.
   - `API_KEY_HASH` — `npm run generate-api-key` (save the printed raw key — it's shown once).
3. Apply the schema: `npm run db:migrate`.
4. Add the same env vars to the Vercel project settings for production.

Create additional agent keys without replacing or disabling the original environment key:

```bash
npm run create-agent-api-key -- --name "Research agent" --days 365
```

Named keys are stored as hashes in Postgres, can coexist, and expire only on their explicit expiration date. The minimum lifetime accepted by the key generator is 90 days.

### Admin portal

Visit `/admin`, sign in with the password from step 2. The Overview dashboard includes live CRM totals, pipeline health, recent activity, and a persisted to-do list with priorities and due dates. Manage Contacts, Companies, and Deals (with a simple stage pipeline: lead → contacted → proposal → won/lost).

### CLI / agent access

`cli/dellix-crm.js` talks to the same API with an API key (no session cookie needed):

```bash
export DELLIX_API_URL=https://www.dellix.dev   # or http://localhost:5173 in dev
export DELLIX_API_KEY=dlx_xxxxxxxxxxxxxxxx  # from `npm run generate-api-key`

node cli/dellix-crm.js contacts list
node cli/dellix-crm.js contacts add --name "Ada Lovelace" --email ada@example.com
node cli/dellix-crm.js deals add --name "Acme retainer" --value 5000 --stage proposal
node cli/dellix-crm.js deals move <id> won
node cli/dellix-crm.js dashboard
node cli/dellix-crm.js tasks add --title "Send proposal" --priority high --due 2026-08-01
node cli/dellix-crm.js tasks complete <id>
```

A personal agent (e.g. Claude) can use the same CLI via shell, or call the REST API directly:

```bash
curl -H "Authorization: Bearer $DELLIX_API_KEY" "$DELLIX_API_URL/api/v1/contacts"
```

Use the canonical `https://www.dellix.dev` hostname for authenticated API requests. The apex
`https://dellix.dev` hostname redirects to `www`, and many HTTP clients intentionally remove
the `Authorization` header on a cross-host redirect.

Dashboard API routes (all accept the admin session or `Authorization: Bearer …`):

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/dashboard` | Summary totals, pipeline breakdown, tasks, and recent activity |
| `GET`, `POST` | `/api/v1/tasks` | List or create tasks |
| `GET`, `PATCH`, `DELETE` | `/api/v1/tasks/:id` | Read, edit, complete, or remove a task |

Task writes accept `title`, `priority` (`low`, `normal`, or `high`), `due_date` (`YYYY-MM-DD` or `null`), and `completed` (on `PATCH`). Dashboard totals and activity are calculated directly from the CRM records, so API changes to contacts, companies, deals, or tasks are reflected automatically.

## Deploy

Static output — `npm run build` produces `/dist`. Deploy to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages). No server required.

The CRM API and admin portal require a Vercel deployment (for the serverless functions) with `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD_HASH`, and `API_KEY_HASH` set as project environment variables — see [CRM](#crm) above.
