import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon.tsx'
import { leads, ApiError } from '../api.ts'
import { Field, inputClass, Modal } from '../components/Modal.tsx'
import {
  LEAD_PRIORITIES,
  LEAD_STATUSES,
  type Lead,
  type LeadPriority,
  type LeadStatus,
  type LeadSummary,
} from '../../../shared/types.ts'

const statusLabels: Record<LeadStatus, string> = {
  new: 'New',
  researching: 'Researching',
  qualified: 'Qualified',
  contacted: 'Contacted',
  disqualified: 'Disqualified',
  converted: 'Converted',
}

const priorityLabels: Record<LeadPriority, string> = { low: 'Low', normal: 'Normal', high: 'High' }

const statusClasses: Record<LeadStatus, string> = {
  new: 'border-steel-600 bg-steel-800 text-ink-muted',
  researching: 'border-blue-400/20 bg-blue-400/10 text-blue-300',
  qualified: 'border-lime-500/25 bg-lime-500/10 text-lime-500',
  contacted: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  disqualified: 'border-red-400/20 bg-red-400/10 text-red-300',
  converted: 'border-lime-500/30 bg-lime-500/15 text-lime-400',
}

const emptySummary: LeadSummary = {
  total: 0,
  new: 0,
  researching: 0,
  qualified: 0,
  contacted: 0,
  disqualified: 0,
  converted: 0,
  unviewed: 0,
}

export function LeadGenerationPage() {
  const [list, setList] = useState<Lead[] | null>(null)
  const [summary, setSummary] = useState<LeadSummary>(emptySummary)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<LeadStatus | ''>('')
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [viewingLead, setViewingLead] = useState<Lead | null>(null)
  const [busyId, setBusyId] = useState('')

  const load = useCallback(async (q = query, selectedStatus = status) => {
    setError('')
    try {
      const response = await leads.list({ q: q || undefined, status: selectedStatus || undefined, limit: 100, sort: 'score' })
      setList(response.leads)
      setSummary(response.summary)
    } catch (loadError) {
      setError(loadError instanceof ApiError ? loadError.message : 'Could not load leads.')
    }
  }, [query, status])

  useEffect(() => {
    const timeout = setTimeout(() => void load(), 250)
    return () => clearTimeout(timeout)
  }, [load])

  async function updateStatus(lead: Lead, nextStatus: LeadStatus) {
    const previous = lead.status
    setList((current) => current?.map((item) => item.id === lead.id ? { ...item, status: nextStatus } : item) ?? null)
    try {
      await leads.update(lead.id, { status: nextStatus })
      await load()
    } catch (updateError) {
      setList((current) => current?.map((item) => item.id === lead.id ? { ...item, status: previous } : item) ?? null)
      setError(updateError instanceof ApiError ? updateError.message : 'Could not update lead status.')
    }
  }

  async function convertLead(lead: Lead) {
    if (!window.confirm(`Convert ${lead.name} into a CRM contact?`)) return
    setBusyId(lead.id)
    setError('')
    try {
      await leads.convert(lead.id, { create_company: true })
      await load()
    } catch (convertError) {
      setError(convertError instanceof ApiError ? convertError.message : 'Could not convert this lead.')
    } finally {
      setBusyId('')
    }
  }

  async function deleteLead(lead: Lead) {
    if (!window.confirm(`Delete lead “${lead.name}”?`)) return
    setBusyId(lead.id)
    try {
      await leads.remove(lead.id)
      await load()
    } catch (deleteError) {
      setError(deleteError instanceof ApiError ? deleteError.message : 'Could not delete this lead.')
    } finally {
      setBusyId('')
    }
  }

  function openNew() {
    setEditingLead(null)
    setModalOpen(true)
  }

  function openEdit(lead: Lead) {
    setEditingLead(lead)
    setModalOpen(true)
  }

  function openDetails(lead: Lead) {
    if (lead.viewed_at) {
      setViewingLead(lead)
      return
    }

    const optimistic = { ...lead, viewed_at: new Date().toISOString() }
    setViewingLead(optimistic)
    setList((current) => current?.map((item) => item.id === lead.id ? optimistic : item) ?? null)
    setSummary((current) => ({ ...current, unviewed: Math.max(0, current.unviewed - 1) }))

    void leads.update(lead.id, { mark_viewed: true })
      .then((response) => {
        setList((current) => current?.map((item) => item.id === lead.id ? response.lead : item) ?? null)
        setViewingLead((current) => current?.id === lead.id ? response.lead : current)
      })
      .catch((viewError) => {
        setList((current) => current?.map((item) => item.id === lead.id ? lead : item) ?? null)
        setViewingLead((current) => current?.id === lead.id ? lead : current)
        setSummary((current) => ({ ...current, unviewed: current.unviewed + 1 }))
        setError(viewError instanceof ApiError ? viewError.message : 'Could not mark this lead as viewed.')
      })
  }

  const summaryCards = [
    { label: 'All leads', value: summary.total, color: 'text-ink' },
    { label: 'New to review', value: summary.unviewed, color: 'text-lime-500' },
    { label: 'Qualified', value: summary.qualified, color: 'text-lime-500' },
    { label: 'Converted', value: summary.converted, color: 'text-lime-400' },
  ]

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-lime-500">Prospecting</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">Lead Generation</h1>
          <p className="mt-1 text-sm text-ink-muted">Collect, enrich, qualify, and convert agent-sourced prospects.</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-lime-500 px-4 py-2 text-sm font-semibold text-charcoal-950 transition-colors hover:bg-lime-400"
        >
          <Icon name="plus" />
          Add lead
        </button>
      </header>

      <section aria-label="Lead summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-[var(--radius-card)] border border-steel-700 bg-steel-900/75 p-4">
            <p className="text-xs text-ink-muted">{card.label}</p>
            <p className={`mt-2 text-2xl font-semibold tracking-tight ${card.color}`}>{card.value.toLocaleString()}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[var(--radius-card)] border border-lime-500/20 bg-lime-500/[0.05] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-lime-500/10 text-lime-500"><Icon name="agents" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold text-ink">Agent ingestion API</h2>
              <span className="font-mono text-[10px] uppercase tracking-wider text-lime-500">Bearer key protected</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Your agent can upsert one lead, ingest 100 at once, append research notes, attach tags/custom JSON, and convert qualified leads into contacts, companies, and deals.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 font-mono text-[10px] text-steel-300">
              <code className="rounded bg-charcoal-900 px-2 py-1">POST /api/v1/leads</code>
              <code className="rounded bg-charcoal-900 px-2 py-1">POST /api/v1/leads/bulk</code>
              <code className="rounded bg-charcoal-900 px-2 py-1">GET /api/v1/leads/options</code>
              <code className="rounded bg-charcoal-900 px-2 py-1">PATCH /api/v1/leads/:id</code>
              <code className="rounded bg-charcoal-900 px-2 py-1">POST /api/v1/leads/:id/convert</code>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <div className="relative">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            placeholder="Search name, company, email, phone, source, or notes…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={`${inputClass} w-full pl-9`}
          />
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value as LeadStatus | '')} className={inputClass} aria-label="Filter by lead status">
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}
        </select>
      </div>

      {error && <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      {list === null ? (
        <div className="h-48 animate-pulse rounded-[var(--radius-card)] border border-steel-700 bg-steel-900/75" />
      ) : list.length === 0 ? (
        <section className="rounded-[var(--radius-card)] border border-dashed border-steel-700 px-6 py-14 text-center">
          <Icon name="target" className="mx-auto text-3xl text-steel-500" />
          <p className="mt-3 text-sm font-medium text-ink">No leads found</p>
          <p className="mt-1 text-xs text-ink-muted">Add one here or send prospects through the agent API.</p>
        </section>
      ) : (
        <ul className="grid min-w-0 gap-3 xl:grid-cols-2">
          {list.map((lead) => (
            <li key={lead.id} className="min-w-0 rounded-[var(--radius-card)] border border-steel-700 bg-steel-900/75 p-4 sm:p-5">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h2 className="truncate font-semibold text-ink">{lead.name}</h2>
                    {!lead.viewed_at && <span className="shrink-0 rounded bg-lime-500 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-charcoal-950">New</span>}
                    {lead.priority === 'high' && <span className="h-2 w-2 shrink-0 rounded-full bg-red-400" title="High priority" />}
                  </div>
                  <p className="truncate text-xs text-ink-muted">{[lead.title, lead.company_name].filter(Boolean).join(' · ') || 'Company not added'}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-1 font-mono text-[10px] ${statusClasses[lead.status]}`}>{statusLabels[lead.status]}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="min-w-0"><p className="text-[10px] uppercase tracking-wider text-steel-500">Email</p><p className="truncate text-ink-muted">{lead.email || '—'}</p></div>
                <div className="min-w-0"><p className="text-[10px] uppercase tracking-wider text-steel-500">Phone</p><p className="truncate text-ink-muted">{lead.phone || '—'}</p></div>
                <div className="min-w-0"><p className="text-[10px] uppercase tracking-wider text-steel-500">Source</p><p className="truncate text-ink-muted">{lead.source || '—'}</p></div>
                <div className="min-w-0"><p className="text-[10px] uppercase tracking-wider text-steel-500">Lead score</p><p className="font-mono text-lime-500">{lead.score}/100</p></div>
              </div>

              {lead.notes && <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ink-muted">{lead.notes}</p>}
              {lead.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {lead.tags.slice(0, 6).map((tag) => <span key={tag} className="rounded bg-steel-800 px-1.5 py-0.5 font-mono text-[10px] text-steel-300">{tag}</span>)}
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2 border-t border-steel-700/70 pt-3 sm:flex-row sm:items-center">
                <select
                  value={lead.status}
                  onChange={(event) => void updateStatus(lead, event.target.value as LeadStatus)}
                  className="h-9 min-w-0 rounded-lg border border-steel-700 bg-charcoal-900 px-2.5 text-xs text-ink focus:border-lime-500/60 focus:outline-none"
                  aria-label={`Status for ${lead.name}`}
                >
                  {LEAD_STATUSES.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}
                </select>
                <div className="flex flex-wrap items-center gap-1 sm:ml-auto">
                  <button type="button" onClick={() => openDetails(lead)} className="rounded-lg px-2.5 py-2 text-xs font-medium text-lime-500 hover:bg-lime-500/10">View more</button>
                  <button type="button" onClick={() => openEdit(lead)} className="rounded-lg px-2.5 py-2 text-xs text-ink-muted hover:bg-steel-800 hover:text-ink">Edit</button>
                  {lead.status === 'converted' && lead.contact_id ? (
                    <Link to={`/contacts/${lead.contact_id}`} className="rounded-lg bg-lime-500/10 px-2.5 py-2 text-xs font-medium text-lime-500">View contact</Link>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === lead.id}
                      onClick={() => void convertLead(lead)}
                      className="rounded-lg bg-lime-500/10 px-2.5 py-2 text-xs font-medium text-lime-500 hover:bg-lime-500/15 disabled:opacity-50"
                    >
                      Convert
                    </button>
                  )}
                  <button type="button" disabled={busyId === lead.id} onClick={() => void deleteLead(lead)} aria-label={`Delete ${lead.name}`} className="grid h-8 w-8 place-items-center rounded-lg text-steel-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"><Icon name="trash" /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <LeadDetailModal
        lead={viewingLead}
        onClose={() => setViewingLead(null)}
        onEdit={(lead) => {
          setViewingLead(null)
          openEdit(lead)
        }}
      />

      <LeadModal
        open={modalOpen}
        lead={editingLead}
        onClose={() => setModalOpen(false)}
        onSaved={() => void load()}
      />
    </div>
  )
}

function safeExternalUrl(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

function formatDetailDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function LinkedText({ children }: { children: string }) {
  const parts = children.split(/(https?:\/\/[^\s]+)/gi)
  return (
    <>
      {parts.map((part, index) => {
        const href = safeExternalUrl(part)
        return href && /^https?:\/\//i.test(part) ? (
          <a key={`${part}-${index}`} href={href} target="_blank" rel="noreferrer" className="break-all text-lime-500 underline decoration-lime-500/35 underline-offset-2 hover:text-lime-400">{part}</a>
        ) : part
      })}
    </>
  )
}

function DetailValue({ label, value, href, mono = false }: { label: string; value: string | number | null; href?: string | null; mono?: boolean }) {
  const displayed = value === null || value === '' ? '—' : String(value)
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-wider text-steel-500">{label}</p>
      {href && displayed !== '—' ? (
        <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} className={`mt-0.5 inline-flex max-w-full items-center gap-1 break-all text-sm text-lime-500 hover:text-lime-400 ${mono ? 'font-mono text-xs' : ''}`}>
          {displayed}
          {href.startsWith('http') && <Icon name="arrow-up-right" className="shrink-0" />}
        </a>
      ) : (
        <p className={`mt-0.5 break-words text-sm text-ink-muted ${mono ? 'font-mono text-xs' : ''}`}>{displayed}</p>
      )}
    </div>
  )
}

function LeadDetailModal({ lead, onClose, onEdit }: { lead: Lead | null; onClose: () => void; onEdit: (lead: Lead) => void }) {
  if (!lead) return null
  const websiteHref = safeExternalUrl(lead.website_url)
  const linkedinHref = safeExternalUrl(lead.linkedin_url)
  const sourceHref = safeExternalUrl(lead.source_url)
  const domainHref = safeExternalUrl(lead.company_domain)
  const customEntries = Object.entries(lead.custom_fields)

  return (
    <Modal open onClose={onClose} title={lead.name} subtitle={[lead.title, lead.company_name].filter(Boolean).join(' · ') || 'Lead details'}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] ${statusClasses[lead.status]}`}>{statusLabels[lead.status]}</span>
          <span className="rounded-full border border-steel-700 bg-steel-800 px-2.5 py-1 font-mono text-[10px] text-ink-muted">{priorityLabels[lead.priority]} priority</span>
          <span className="rounded-full border border-lime-500/20 bg-lime-500/[0.07] px-2.5 py-1 font-mono text-[10px] text-lime-500">Score {lead.score}/100</span>
        </div>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink">Contact</h3>
          <div className="grid grid-cols-1 gap-4 xs:grid-cols-2">
            <DetailValue label="Email" value={lead.email} href={lead.email ? `mailto:${lead.email}` : null} />
            <DetailValue label="Phone" value={lead.phone} href={lead.phone ? `tel:${lead.phone}` : null} />
            <DetailValue label="Job title" value={lead.title} />
            <DetailValue label="Company" value={lead.company_name} />
            <DetailValue label="Company domain" value={lead.company_domain} href={domainHref} />
          </div>
        </section>

        <section className="border-t border-steel-700 pt-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink">Links & source</h3>
          <div className="grid grid-cols-1 gap-4 xs:grid-cols-2">
            <DetailValue label="Website" value={lead.website_url} href={websiteHref} />
            <DetailValue label="LinkedIn" value={lead.linkedin_url} href={linkedinHref} />
            <DetailValue label="Source" value={lead.source} />
            <DetailValue label="Source URL" value={lead.source_url} href={sourceHref} />
          </div>
        </section>

        <section className="border-t border-steel-700 pt-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink">Research notes</h3>
          <div className="whitespace-pre-wrap rounded-lg border border-steel-700 bg-charcoal-900 px-3.5 py-3 text-sm leading-relaxed text-ink-muted">
            {lead.notes ? <LinkedText>{lead.notes}</LinkedText> : 'No research notes.'}
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-steel-500">Tags</p>
            {lead.tags.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">{lead.tags.map((tag) => <span key={tag} className="rounded bg-steel-800 px-2 py-1 font-mono text-[10px] text-steel-300">{tag}</span>)}</div>
            ) : <p className="mt-1 text-sm text-ink-muted">—</p>}
          </div>
        </section>

        <section className="border-t border-steel-700 pt-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink">Custom fields</h3>
          {customEntries.length ? (
            <div className="grid gap-3">
              {customEntries.map(([key, value]) => {
                const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
                const href = typeof value === 'string' && /^https?:\/\//i.test(value) ? safeExternalUrl(value) : null
                return <DetailValue key={key} label={key.replaceAll('_', ' ')} value={text} href={href} mono={typeof value !== 'string'} />
              })}
            </div>
          ) : <p className="text-sm text-ink-muted">No custom fields.</p>}
        </section>

        <section className="border-t border-steel-700 pt-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink">Record information</h3>
          <div className="grid grid-cols-1 gap-4 xs:grid-cols-2">
            <DetailValue label="Discovered" value={formatDetailDate(lead.discovered_at)} />
            <DetailValue label="Last enriched" value={formatDetailDate(lead.last_enriched_at)} />
            <DetailValue label="First viewed" value={formatDetailDate(lead.viewed_at)} />
            <DetailValue label="Created" value={formatDetailDate(lead.created_at)} />
            <DetailValue label="Last updated" value={formatDetailDate(lead.updated_at)} />
            <DetailValue label="Lead ID" value={lead.id} mono />
            {lead.contact_id && <DetailValue label="CRM contact" value="View linked contact" href={`#/contacts/${lead.contact_id}`} />}
          </div>
        </section>

        <button type="button" onClick={() => onEdit(lead)} className="inline-flex items-center justify-center gap-2 rounded-full bg-lime-500 px-5 py-2.5 text-sm font-semibold text-charcoal-950 hover:bg-lime-400">
          <Icon name="edit" />
          Edit lead
        </button>
      </div>
    </Modal>
  )
}

function LeadModal({ open, lead, onClose, onSaved }: { open: boolean; lead: Lead | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', title: '', company_name: '', company_domain: '', website_url: '', linkedin_url: '',
    source: '', source_url: '', notes: '', tags: '', score: '0', status: 'new' as LeadStatus, priority: 'normal' as LeadPriority,
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({
      name: lead?.name ?? '', email: lead?.email ?? '', phone: lead?.phone ?? '', title: lead?.title ?? '',
      company_name: lead?.company_name ?? '', company_domain: lead?.company_domain ?? '', website_url: lead?.website_url ?? '',
      linkedin_url: lead?.linkedin_url ?? '', source: lead?.source ?? '', source_url: lead?.source_url ?? '', notes: lead?.notes ?? '',
      tags: lead?.tags.join(', ') ?? '', score: String(lead?.score ?? 0), status: lead?.status ?? 'new', priority: lead?.priority ?? 'normal',
    })
    setError('')
  }, [open, lead])

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const payload = {
      ...form,
      score: Number(form.score),
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    }
    try {
      if (lead) await leads.update(lead.id, payload)
      else await leads.create(payload)
      onClose()
      onSaved()
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : 'Could not save this lead.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={lead ? 'Edit lead' : 'Add lead'}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="lead-name"><input id="lead-name" required value={form.name} onChange={(event) => update('name', event.target.value)} className={inputClass} /></Field>
        <Field label="Company" htmlFor="lead-company"><input id="lead-company" value={form.company_name} onChange={(event) => update('company_name', event.target.value)} className={inputClass} /></Field>
        <Field label="Email" htmlFor="lead-email"><input id="lead-email" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} className={inputClass} /></Field>
        <Field label="Phone" htmlFor="lead-phone"><input id="lead-phone" value={form.phone} onChange={(event) => update('phone', event.target.value)} className={inputClass} /></Field>
        <Field label="Title" htmlFor="lead-title"><input id="lead-title" value={form.title} onChange={(event) => update('title', event.target.value)} className={inputClass} /></Field>
        <Field label="Company domain" htmlFor="lead-domain"><input id="lead-domain" value={form.company_domain} onChange={(event) => update('company_domain', event.target.value)} placeholder="example.com" className={inputClass} /></Field>
        <Field label="Website URL" htmlFor="lead-website"><input id="lead-website" type="url" value={form.website_url} onChange={(event) => update('website_url', event.target.value)} className={inputClass} /></Field>
        <Field label="LinkedIn URL" htmlFor="lead-linkedin"><input id="lead-linkedin" type="url" value={form.linkedin_url} onChange={(event) => update('linkedin_url', event.target.value)} className={inputClass} /></Field>
        <Field label="Source" htmlFor="lead-source"><input id="lead-source" value={form.source} onChange={(event) => update('source', event.target.value)} placeholder="Google Maps, LinkedIn…" className={inputClass} /></Field>
        <Field label="Source URL" htmlFor="lead-source-url"><input id="lead-source-url" type="url" value={form.source_url} onChange={(event) => update('source_url', event.target.value)} className={inputClass} /></Field>
        <Field label="Status" htmlFor="lead-status"><select id="lead-status" value={form.status} onChange={(event) => update('status', event.target.value as LeadStatus)} className={inputClass}>{LEAD_STATUSES.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}</select></Field>
        <Field label="Priority" htmlFor="lead-priority"><select id="lead-priority" value={form.priority} onChange={(event) => update('priority', event.target.value as LeadPriority)} className={inputClass}>{LEAD_PRIORITIES.map((value) => <option key={value} value={value}>{priorityLabels[value]}</option>)}</select></Field>
        <Field label="Score (0–100)" htmlFor="lead-score"><input id="lead-score" type="number" min="0" max="100" step="1" value={form.score} onChange={(event) => update('score', event.target.value)} className={inputClass} /></Field>
        <Field label="Tags (comma separated)" htmlFor="lead-tags"><input id="lead-tags" value={form.tags} onChange={(event) => update('tags', event.target.value)} className={inputClass} /></Field>
        <div className="sm:col-span-2"><Field label="Research notes" htmlFor="lead-notes"><textarea id="lead-notes" rows={5} value={form.notes} onChange={(event) => update('notes', event.target.value)} className={`${inputClass} resize-y py-2.5`} /></Field></div>
        {error && <p className="sm:col-span-2 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>}
        <button type="submit" disabled={submitting} className="sm:col-span-2 rounded-full bg-lime-500 px-5 py-2.5 text-sm font-semibold text-charcoal-950 hover:bg-lime-400 disabled:opacity-50">{submitting ? 'Saving…' : 'Save lead'}</button>
      </form>
    </Modal>
  )
}
