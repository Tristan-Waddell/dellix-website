/**
 * Types shared between the API (Vercel functions), the admin portal, and the CLI.
 * Keep this dependency-free (no React, no Node APIs) so all three can import it.
 */

export type DealStage = 'lead' | 'contacted' | 'proposal' | 'won' | 'lost'

export const DEAL_STAGES: DealStage[] = ['lead', 'contacted', 'proposal', 'won', 'lost']

export type Company = {
  id: string
  name: string
  domain: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Contact = {
  id: string
  company_id: string | null
  name: string
  email: string | null
  phone: string | null
  title: string | null
  notes: string | null
  is_active_client: boolean
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export type Deal = {
  id: string
  contact_id: string | null
  company_id: string | null
  name: string
  value_cents: number
  stage: DealStage
  notes: string | null
  created_at: string
  updated_at: string
}

export type TaskPriority = 'low' | 'normal' | 'high'

export const TASK_PRIORITIES: TaskPriority[] = ['low', 'normal', 'high']

export type Task = {
  id: string
  title: string
  completed: boolean
  priority: TaskPriority
  due_date: string | null
  created_at: string
  updated_at: string
}

export type LeadStatus = 'new' | 'researching' | 'qualified' | 'contacted' | 'disqualified' | 'converted'
export const LEAD_STATUSES: LeadStatus[] = ['new', 'researching', 'qualified', 'contacted', 'disqualified', 'converted']

export type LeadPriority = 'low' | 'normal' | 'high'
export const LEAD_PRIORITIES: LeadPriority[] = ['low', 'normal', 'high']

export type Lead = {
  id: string
  name: string
  email: string | null
  phone: string | null
  title: string | null
  company_name: string | null
  company_domain: string | null
  website_url: string | null
  linkedin_url: string | null
  source: string | null
  source_url: string | null
  notes: string | null
  tags: string[]
  custom_fields: Record<string, unknown>
  score: number
  status: LeadStatus
  priority: LeadPriority
  contact_id: string | null
  discovered_at: string
  last_enriched_at: string | null
  created_at: string
  updated_at: string
}

export type LeadSummary = {
  total: number
  new: number
  researching: number
  qualified: number
  contacted: number
  disqualified: number
  converted: number
}

export type DashboardActivityKind = 'contact' | 'company' | 'deal' | 'task'

export type DashboardActivity = {
  id: string
  kind: DashboardActivityKind
  label: string
  detail: string | null
  occurred_at: string
}

export type DashboardData = {
  summary: {
    contacts: number
    companies: number
    active_clients: number
    active_deals: number
    open_pipeline_cents: number
  }
  pipeline: Array<{
    stage: DealStage
    count: number
    value_cents: number
  }>
  tasks: Task[]
  recent_activity: DashboardActivity[]
}

export type FinancialPeriod = 'month' | 'year' | 'all'

export type FinancialActivity = {
  id: string
  type: 'payment' | 'refund' | 'dispute' | 'payout' | 'fee' | 'other'
  description: string
  amount_cents: number
  fee_cents: number
  net_cents: number
  currency: string
  status: string
  created_at: string
}

export type FinancialsData = {
  period: FinancialPeriod
  period_start: string | null
  currency: string
  updated_at: string
  metrics: {
    gross_cents: number
    fees_cents: number
    refunds_cents: number
    disputes_cents: number
    net_cents: number
    payouts_cents: number
    available_cents: number
    pending_cents: number
    mrr_cents: number | null
  }
  monthly_revenue: Array<{
    month: string
    gross_cents: number
    net_cents: number
  }>
  recent_activity: FinancialActivity[]
  client_revenue: Array<{
    contact_id: string
    name: string
    stripe_customer_id: string
    gross_cents: number
    refunded_cents: number
    net_cents: number
  }>
  warnings: string[]
}

export type ApiError = { error: string }
