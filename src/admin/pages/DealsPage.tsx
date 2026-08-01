import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
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

const stageAccent: Record<DealStage, string> = {
  lead: 'border-t-steel-500',
  contacted: 'border-t-steel-400',
  proposal: 'border-t-lime-500/60',
  won: 'border-t-lime-500',
  lost: 'border-t-red-500/60',
}

function formatValue(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function DealsPage() {
  const [list, setList] = useState<Deal[] | null>(null)
  const [contactList, setContactList] = useState<Contact[]>([])
  const [companyList, setCompanyList] = useState<Company[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)

  function reload() {
    deals.list().then((res) => setList(res.deals))
  }

  useEffect(() => {
    reload()
    contacts.list().then((res) => setContactList(res.contacts))
    companies.list().then((res) => setCompanyList(res.companies))
  }, [])

  const columns = useMemo(() => {
    const byStage: Record<DealStage, Deal[]> = { lead: [], contacted: [], proposal: [], won: [], lost: [] }
    for (const deal of list ?? []) byStage[deal.stage].push(deal)
    return byStage
  }, [list])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  )

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null)
    const dealId = event.active.id as string
    const newStage = event.over?.id as DealStage | undefined
    const deal = list?.find((d) => d.id === dealId)
    if (!deal || !newStage || newStage === deal.stage) return

    setList((prev) => prev?.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)) ?? null)
    try {
      await deals.update(dealId, { stage: newStage })
    } catch {
      setList((prev) => prev?.map((d) => (d.id === dealId ? { ...d, stage: deal.stage } : d)) ?? null)
    }
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

      {list === null ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={(e) => setActiveDeal(list.find((d) => d.id === e.active.id) ?? null)}
          onDragCancel={() => setActiveDeal(null)}
          onDragEnd={handleDragEnd}
        >
          <div className="lg:overflow-x-auto lg:pb-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[70rem] lg:grid-cols-5 lg:gap-4">
              {DEAL_STAGES.map((stage) => (
                <StageColumn
                  key={stage}
                  stage={stage}
                  dealsInStage={columns[stage]}
                  isDragging={activeDeal !== null}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        </DndContext>
      )}

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

function StageColumn({
  stage,
  dealsInStage,
  isDragging,
  onDelete,
}: {
  stage: DealStage
  dealsInStage: Deal[]
  isDragging: boolean
  onDelete: (deal: Deal) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const total = dealsInStage.reduce((sum, d) => sum + d.value_cents, 0)

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-3 rounded-[var(--radius-card)] border border-t-2 bg-steel-900/60 p-3 transition-colors lg:p-4 ${stageAccent[stage]} ${
        stage === 'lost' ? 'col-span-2 sm:col-span-3 lg:col-span-1' : ''
      } ${isOver ? 'border-lime-500/60 bg-steel-900' : 'border-steel-700'}`}
    >
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-semibold text-ink">{stageLabels[stage]}</p>
        <p className="text-xs text-ink-muted">{dealsInStage.length} · {formatValue(total)}</p>
      </div>

      <div className={`flex min-h-24 flex-col gap-2 ${isDragging ? 'pb-6' : ''}`}>
        {dealsInStage.map((deal) => (
          <DealCard key={deal.id} deal={deal} onDelete={onDelete} />
        ))}
        {dealsInStage.length === 0 && (
          <p className="rounded-lg border border-dashed border-steel-700 px-3 py-6 text-center text-xs text-ink-muted">
            Drop here
          </p>
        )}
      </div>
    </div>
  )
}

function DealCard({ deal, onDelete }: { deal: Deal; onDelete: (deal: Deal) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, touchAction: 'none' as const }
    : { touchAction: 'none' as const }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group relative cursor-grab rounded-lg border border-steel-700 bg-steel-900 px-3.5 py-3 active:cursor-grabbing lg:px-4 lg:py-3.5 ${
        isDragging ? 'z-10 opacity-50' : ''
      }`}
    >
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onDelete(deal)}
        aria-label="Delete deal"
        className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-md text-ink-muted opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
      >
        <Icon name="trash" className="text-sm" />
      </button>
      <p className="truncate pr-6 font-medium text-ink">{deal.name}</p>
      <p className="mt-1 text-sm text-ink-muted">{formatValue(deal.value_cents)}</p>
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
