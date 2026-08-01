#!/usr/bin/env node
// CLI for the Dellix CRM REST API. Talks to the same API the admin portal and
// any personal agent use, authenticated with a Bearer API key.
//
// Config (env vars):
//   DELLIX_API_URL  Base URL of the deployed site, e.g. https://www.dellix.dev (default: http://localhost:5173)
//   DELLIX_API_KEY  API key generated via `npm run generate-api-key`

import { Command } from 'commander'
import { readFileSync } from 'node:fs'

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
    .option('--active-client', 'mark as an active client (contacts)')
    .option('--stripe-customer-id <id>', 'linked Stripe customer ID (contacts)')
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
      if (opts.activeClient) body.is_active_client = true
      if (opts.stripeCustomerId) body.stripe_customer_id = opts.stripeCustomerId

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

const leadCmd = program.command('leads').description('Manage agent-sourced leads')

leadCmd
  .command('list')
  .description('Search and filter leads')
  .option('-q, --query <query>', 'search name, contact info, company, source, or notes')
  .option('--status <status>', 'new|researching|qualified|contacted|disqualified|converted')
  .option('--priority <priority>', 'low|normal|high')
  .option('--source <source>', 'exact source name')
  .option('--tag <tag>', 'required tag')
  .option('--viewed <viewed>', 'true for reviewed, false for new/unviewed')
  .option('--sort <sort>', 'created|updated|score', 'created')
  .option('--limit <limit>', '1-100', '50')
  .option('--offset <offset>', 'pagination offset', '0')
  .action(async (opts) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(opts)) if (value !== undefined) params.set(key, value)
    const data = await request(`/leads?${params}`)
    printTable(data.leads)
  })

leadCmd
  .command('show <id>')
  .description('Show a lead with all enrichment fields')
  .action(async (id) => {
    const data = await request(`/leads/${id}`)
    console.log(JSON.stringify(data.lead, null, 2))
  })

leadCmd
  .command('add')
  .description('Add or upsert a lead (deduplicated by email, profile/source URL, phone, or name/company)')
  .requiredOption('--name <name>', 'person or prospect name')
  .option('--email <email>', 'email address')
  .option('--phone <phone>', 'phone number')
  .option('--title <title>', 'job title')
  .option('--company <name>', 'company name')
  .option('--domain <domain>', 'company domain')
  .option('--website <url>', 'website URL')
  .option('--linkedin <url>', 'LinkedIn URL')
  .option('--source <source>', 'discovery source')
  .option('--source-url <url>', 'source page URL')
  .option('--notes <notes>', 'research notes')
  .option('--tags <tags>', 'comma-separated tags')
  .option('--score <score>', '0-100', '0')
  .option('--status <status>', 'lead status', 'new')
  .option('--priority <priority>', 'low|normal|high', 'normal')
  .option('--custom-fields <json>', 'custom JSON object')
  .action(async (opts) => {
    const body = {
      name: opts.name,
      email: opts.email,
      phone: opts.phone,
      title: opts.title,
      company_name: opts.company,
      company_domain: opts.domain,
      website_url: opts.website,
      linkedin_url: opts.linkedin,
      source: opts.source,
      source_url: opts.sourceUrl,
      notes: opts.notes,
      tags: opts.tags,
      score: Number(opts.score),
      status: opts.status,
      priority: opts.priority,
      custom_fields: opts.customFields ? JSON.parse(opts.customFields) : undefined,
    }
    const data = await request('/leads', { method: 'POST', body })
    console.log(JSON.stringify(data, null, 2))
  })

leadCmd
  .command('update <id>')
  .description('Patch any lead fields using a JSON object')
  .requiredOption('--data <json>', 'JSON object with fields to update')
  .action(async (id, opts) => {
    const data = await request(`/leads/${id}`, { method: 'PATCH', body: JSON.parse(opts.data) })
    console.log(JSON.stringify(data.lead, null, 2))
  })

leadCmd
  .command('bulk <json-file>')
  .description('Bulk upsert up to 100 leads from a JSON array or {"leads": [...]} file')
  .option('--replace-notes', 'replace notes instead of appending')
  .option('--replace-tags', 'replace tags instead of merging')
  .action(async (jsonFile, opts) => {
    const parsed = JSON.parse(readFileSync(jsonFile, 'utf8'))
    const body = Array.isArray(parsed) ? { leads: parsed } : parsed
    body.notes_mode = opts.replaceNotes ? 'replace' : 'append'
    body.tags_mode = opts.replaceTags ? 'replace' : 'merge'
    const data = await request('/leads/bulk', { method: 'POST', body })
    console.log(JSON.stringify(data, null, 2))
  })

leadCmd
  .command('convert <id>')
  .description('Convert a lead into a CRM contact, optionally creating a company and deal')
  .option('--active-client', 'mark the resulting contact as an active client')
  .option('--create-deal', 'create a pipeline deal')
  .option('--deal-name <name>', 'deal name')
  .option('--deal-value <dollars>', 'deal value in dollars')
  .option('--deal-stage <stage>', 'lead|contacted|proposal|won|lost', 'lead')
  .action(async (id, opts) => {
    const body = {
      create_company: true,
      is_active_client: Boolean(opts.activeClient),
      create_deal: Boolean(opts.createDeal),
      deal_name: opts.dealName,
      deal_value_cents: opts.dealValue ? Math.round(Number(opts.dealValue) * 100) : undefined,
      deal_stage: opts.dealStage,
    }
    const data = await request(`/leads/${id}/convert`, { method: 'POST', body })
    console.log(JSON.stringify(data, null, 2))
  })

leadCmd
  .command('delete <id>')
  .description('Delete a lead')
  .action(async (id) => {
    await request(`/leads/${id}`, { method: 'DELETE' })
    console.log('Deleted.')
  })

dealCmd
  .command('move <id> <stage>')
  .description('Move a deal to a new stage: lead|contacted|proposal|won|lost')
  .action(async (id, stage) => {
    const data = await request(`/deals/${id}`, { method: 'PATCH', body: { stage } })
    console.log(JSON.stringify(data.deal, null, 2))
  })

program
  .command('dashboard')
  .description('Show the dashboard summary, pipeline, tasks, and recent activity')
  .action(async () => {
    const data = await request('/dashboard')
    console.log(JSON.stringify(data.dashboard, null, 2))
  })

program
  .command('financials')
  .description('Show Stripe revenue, balances, payouts, MRR, and client totals')
  .option('--period <period>', 'month|year|all', 'year')
  .option('--currency <currency>', 'three-letter currency code', 'usd')
  .action(async (opts) => {
    const params = new URLSearchParams({ period: opts.period, currency: opts.currency })
    const data = await request(`/financials?${params}`)
    console.log(JSON.stringify(data.financials, null, 2))
  })

const taskCmd = program.command('tasks').description('Manage dashboard tasks')

taskCmd
  .command('list')
  .description('List tasks')
  .action(async () => {
    const data = await request('/tasks')
    printTable(data.tasks)
  })

taskCmd
  .command('add')
  .description('Add a task')
  .requiredOption('--title <title>', 'task title')
  .option('--priority <priority>', 'low|normal|high', 'normal')
  .option('--due <date>', 'due date in YYYY-MM-DD format')
  .action(async (opts) => {
    const data = await request('/tasks', {
      method: 'POST',
      body: { title: opts.title, priority: opts.priority, due_date: opts.due },
    })
    console.log(JSON.stringify(data.task, null, 2))
  })

for (const [command, completed] of [['complete', true], ['reopen', false]]) {
  taskCmd
    .command(`${command} <id>`)
    .description(`${command === 'complete' ? 'Complete' : 'Reopen'} a task`)
    .action(async (id) => {
      const data = await request(`/tasks/${id}`, { method: 'PATCH', body: { completed } })
      console.log(JSON.stringify(data.task, null, 2))
    })
}

taskCmd
  .command('delete <id>')
  .description('Delete a task')
  .action(async (id) => {
    await request(`/tasks/${id}`, { method: 'DELETE' })
    console.log('Deleted.')
  })

program.parseAsync()
