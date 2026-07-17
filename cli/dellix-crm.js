#!/usr/bin/env node
// CLI for the Dellix CRM REST API. Talks to the same API the admin portal and
// any personal agent use, authenticated with a Bearer API key.
//
// Config (env vars):
//   DELLIX_API_URL  Base URL of the deployed site, e.g. https://dellix.dev (default: http://localhost:5173)
//   DELLIX_API_KEY  API key generated via `npm run generate-api-key`

import { Command } from 'commander'

const baseUrl = process.env.DELLIX_API_URL ?? 'http://localhost:5173'
const apiKey = process.env.DELLIX_API_KEY

async function request(path, { method = 'GET', body } = {}) {
  if (!apiKey) {
    console.error('DELLIX_API_KEY is not set. Generate one with `npm run generate-api-key`.')
    process.exit(1)
  }

  const res = await fetch(`${baseUrl}/api/v1${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error(`Error (${res.status}): ${data.error ?? 'Request failed.'}`)
    process.exit(1)
  }
  return data
}

function printTable(rows) {
  if (rows.length === 0) {
    console.log('(none)')
    return
  }
  console.table(rows)
}

const program = new Command()
program.name('dellix-crm').description('Dellix CRM CLI').version('0.1.0')

function entityCommands(name, plural) {
  const cmd = program.command(name)

  cmd
    .command('list')
    .description(`List ${plural}`)
    .option('-q, --query <query>', 'search query (contacts/companies only)')
    .option('-s, --stage <stage>', 'filter by stage (deals only)')
    .action(async (opts) => {
      const params = new URLSearchParams()
      if (opts.query) params.set('q', opts.query)
      if (opts.stage) params.set('stage', opts.stage)
      const qs = params.toString() ? `?${params}` : ''
      const data = await request(`/${plural}${qs}`)
      printTable(data[plural])
    })

  cmd
    .command('show <id>')
    .description(`Show a single ${name}`)
    .action(async (id) => {
      const data = await request(`/${plural}/${id}`)
      console.log(JSON.stringify(data[name], null, 2))
    })

  cmd
    .command('add')
    .description(`Add a ${name}`)
    .requiredOption('--name <name>', 'name')
    .option('--email <email>', 'email (contacts)')
    .option('--phone <phone>', 'phone (contacts)')
    .option('--title <title>', 'title (contacts)')
    .option('--domain <domain>', 'domain (companies)')
    .option('--company-id <id>', 'linked company id')
    .option('--contact-id <id>', 'linked contact id (deals)')
    .option('--stage <stage>', 'stage: lead|contacted|proposal|won|lost (deals)')
    .option('--value <dollars>', 'deal value in dollars (deals)')
    .option('--notes <notes>', 'notes')
    .action(async (opts) => {
      const body = { name: opts.name, notes: opts.notes }
      if (opts.email) body.email = opts.email
      if (opts.phone) body.phone = opts.phone
      if (opts.title) body.title = opts.title
      if (opts.domain) body.domain = opts.domain
      if (opts.companyId) body.company_id = opts.companyId
      if (opts.contactId) body.contact_id = opts.contactId
      if (opts.stage) body.stage = opts.stage
      if (opts.value) body.value_cents = Math.round(Number(opts.value) * 100)

      const data = await request(`/${plural}`, { method: 'POST', body })
      console.log(JSON.stringify(data[name], null, 2))
    })

  cmd
    .command('delete <id>')
    .description(`Delete a ${name}`)
    .action(async (id) => {
      await request(`/${plural}/${id}`, { method: 'DELETE' })
      console.log('Deleted.')
    })

  return cmd
}

entityCommands('contact', 'contacts')
entityCommands('company', 'companies')
const dealCmd = entityCommands('deal', 'deals')

dealCmd
  .command('move <id> <stage>')
  .description('Move a deal to a new stage: lead|contacted|proposal|won|lost')
  .action(async (id, stage) => {
    const data = await request(`/deals/${id}`, { method: 'PATCH', body: { stage } })
    console.log(JSON.stringify(data.deal, null, 2))
  })

program.parseAsync()
