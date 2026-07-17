import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon.tsx'
import { Modal, Field, inputClass } from '../components/Modal.tsx'
import { deals, contacts, companies, ApiError } from '../api.ts'
import { DEAL_STAGES, type DealStage, type Deal, type Contact, type Company } from '../../../shared/types.ts'

const stageLabels: Record<DealStage, string> = {
  lead: 'Lead',
  contacted: 'Contacted',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
}

function formatValue(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function DealsPage() {
  const [list, setList] = useState<Deal[] | null>(null)
  const [stageFilter, setStageFilter] = useState<DealStage | 'all'>('all')
  const [contactList, setContactList] = useState<Contact[]>([])
  const [companyList, setCompanyList] = useState<Company[]>([])
  const [modalOpen, setModalOpen] = useState(false)

  function reload() {
    deals.list(stageFilter === 'all' ? undefined : stageFilter).then((res) => setList(res.deals))
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageFilter])

  useEffect(() => {
    contacts.list().then((res) => setContactList(res.contacts))
    companies.list().then((res) => setCompanyList(res.companies))
  }, [])

  async function moveStage(deal: Deal, stage: DealStage) {
    const updated = await deals.update(deal.id, { stage })
    setList((prev) => prev?.map((d) => (d.id === deal.id ? updated.deal : d)) ?? null)
  }

  async function handleDelete(deal: Deal) {
    if (!confirm(`Delete "${deal.name}"?`)) return
    await deals.remove(deal.id)
    setList((prev) => prev?.filter((d) => d.id !== deal.id) ?? null)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Deals</h1>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-lime-500 px-4 py-2 text-sm font-semibold text-charcoal-950 transition-colors hover:bg-lime-400"
        >
          <Icon name="plus" className="text-base" />
          Add
        </button>
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {(['all', ...DEAL_STAGES] as const).map((stage) => (
          <button
            key={stage}
            type="button"
            onClick={() => setStageFilter(stage)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              stageFilter === stage
                ? 'border-lime-500/60 bg-lime-500/10 text-lime-500'
                : 'border-steel-700 text-ink-muted hover:text-ink'
            }`}
          >
            {stage === 'all' ? 'All' : stageLabels[stage]}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        {list?.length === 0 && <p className="py-8 text-center text-sm text-ink-muted">No deals yet.</p>}
        {list?.map((deal) => (
          <li key={deal.id} className="flex flex-col gap-3 rounded-lg border border-steel-700 bg-steel-900 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{deal.name}</p>
              <p className="text-sm text-ink-muted">{formatValue(deal.value_cents)}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={deal.stage}
                onChange={(e) => moveStage(deal, e.target.value as DealStage)}
                className={`${inputClass} py-1.5 text-sm`}
              >
                {DEAL_STAGES.map((stage) => (
                  <option key={stage} value={stage}>{stageLabels[stage]}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleDelete(deal)}
                aria-label="Delete deal"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <Icon name="trash" className="text-base" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <AddDealModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        contactList={contactList}
        companyList={companyList}
        onCreated={reload}
      />
    </div>
  )
}

function AddDealModal({
  open,
  onClose,
  contactList,
  companyList,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  contactList: Contact[]
  companyList: Company[]
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [stage, setStage] = useState<DealStage>('lead')
  const [contactId, setContactId] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setName(''); setValue(''); setStage('lead'); setContactId(''); setCompanyId(''); setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const dollars = Number(value)
      await deals.create({
        name,
        stage,
        value_cents: Number.isFinite(dollars) ? Math.round(dollars * 100) : 0,
        contact_id: contactId || null,
        company_id: companyId || null,
      })
      reset()
      onClose()
      onCreated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Add deal">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Name" htmlFor="deal-name">
          <input id="deal-name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Value (USD)" htmlFor="deal-value">
          <input id="deal-value" type="number" min="0" step="1" value={value} onChange={(e) => setValue(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Stage" htmlFor="deal-stage">
          <select id="deal-stage" value={stage} onChange={(e) => setStage(e.target.value as DealStage)} className={inputClass}>
            {DEAL_STAGES.map((s) => (
              <option key={s} value={s}>{stageLabels[s]}</option>
            ))}
          </select>
        </Field>
        <Field label="Contact" htmlFor="deal-contact">
          <select id="deal-contact" value={contactId} onChange={(e) => setContactId(e.target.value)} className={inputClass}>
            <option value="">—</option>
            {contactList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Company" htmlFor="deal-company">
          <select id="deal-company" value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={inputClass}>
            <option value="">—</option>
            {companyList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>

        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-full bg-lime-500 px-5 py-2.5 text-sm font-semibold text-charcoal-950 transition-colors hover:bg-lime-400 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save deal'}
        </button>
      </form>
    </Modal>
  )
}
