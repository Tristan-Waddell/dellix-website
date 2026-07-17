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

export type ApiError = { error: string }
