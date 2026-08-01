import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../../components/Icon.tsx'
import { Field, inputClass } from '../components/Modal.tsx'
import { contacts, companies, ApiError } from '../api.ts'
import type { Company, Contact } from '../../../shared/types.ts'

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [contact, setContact] = useState<Contact | null>(null)
  const [companyList, setCompanyList] = useState<Company[]>([])
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    contacts.get(id).then((res) => setContact(res.contact))
    companies.list().then((res) => setCompanyList(res.companies))
  }, [id])

  if (!contact) return <p className="text-sm text-ink-muted">Loading…</p>

  function update<K extends keyof Contact>(key: K, value: Contact[K]) {
    setContact((c) => (c ? { ...c, [key]: value } : c))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !contact) return
    setStatus('saving')
    setError('')
    try {
      const res = await contacts.update(id, {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        title: contact.title,
        notes: contact.notes,
        company_id: contact.company_id,
        is_active_client: contact.is_active_client,
      })
      setContact(res.contact)
      setStatus('saved')
    } catch (err) {
      setStatus('error')
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    }
  }

  async function handleDelete() {
    if (!id) return
    if (!confirm('Delete this contact? This cannot be undone.')) return
    await contacts.remove(id)
    navigate('/contacts')
  }

  return (
    <div className="flex flex-col gap-5">
      <Link to="/contacts" className="flex w-fit items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <Icon name="arrow" className="rotate-180 text-base" />
        Back to contacts
      </Link>

      <form onSubmit={handleSave} className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-steel-700 bg-steel-900 p-5">
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-steel-700 bg-charcoal-850 px-4 py-3.5">
          <span>
            <span className="flex items-center gap-2 text-sm font-medium text-ink">
              <span className="h-2 w-2 rounded-full bg-lime-500" aria-hidden="true" />
              Active client
            </span>
            <span className="mt-1 block text-xs text-ink-muted">Show this contact in the active clients view.</span>
          </span>
          <span className="relative shrink-0">
            <input
              type="checkbox"
              checked={contact.is_active_client}
              onChange={(e) => update('is_active_client', e.target.checked)}
              className="peer sr-only"
            />
            <span className="block h-7 w-12 rounded-full bg-steel-600 transition-colors peer-checked:bg-lime-500" />
            <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-ink shadow-sm transition-transform peer-checked:translate-x-5 peer-checked:bg-charcoal-950" />
          </span>
        </label>

        <Field label="Name" htmlFor="d-name">
          <input id="d-name" required value={contact.name} onChange={(e) => update('name', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Email" htmlFor="d-email">
          <input id="d-email" type="email" value={contact.email ?? ''} onChange={(e) => update('email', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Phone" htmlFor="d-phone">
          <input id="d-phone" value={contact.phone ?? ''} onChange={(e) => update('phone', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Title" htmlFor="d-title">
          <input id="d-title" value={contact.title ?? ''} onChange={(e) => update('title', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Company" htmlFor="d-company">
          <select id="d-company" value={contact.company_id ?? ''} onChange={(e) => update('company_id', e.target.value || null)} className={inputClass}>
            <option value="">—</option>
            {companyList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Notes" htmlFor="d-notes">
          <textarea id="d-notes" rows={4} value={contact.notes ?? ''} onChange={(e) => update('notes', e.target.value)} className={`${inputClass} resize-none`} />
        </Field>

        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={status === 'saving'}
            className="rounded-full bg-lime-500 px-5 py-2.5 text-sm font-semibold text-charcoal-950 transition-colors hover:bg-lime-400 disabled:opacity-60"
          >
            {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1.5 rounded-full border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            <Icon name="trash" className="text-base" />
            Delete
          </button>
        </div>
      </form>
    </div>
  )
}
