import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon.tsx'
import { Modal, Field, inputClass } from '../components/Modal.tsx'
import { contacts, companies, ApiError } from '../api.ts'
import type { Company, Contact } from '../../../shared/types.ts'

export function ContactsPage() {
  const [list, setList] = useState<Contact[] | null>(null)
  const [companyList, setCompanyList] = useState<Company[]>([])
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  function reload(q?: string) {
    contacts.list(q).then((res) => setList(res.contacts))
  }

  useEffect(() => {
    reload()
    companies.list().then((res) => setCompanyList(res.companies))
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => reload(query), 250)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  function companyName(id: string | null) {
    return companyList.find((c) => c.id === id)?.name ?? null
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Contacts</h1>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-lime-500 px-4 py-2 text-sm font-semibold text-charcoal-950 transition-colors hover:bg-lime-400"
        >
          <Icon name="plus" className="text-base" />
          Add
        </button>
      </div>

      <div className="relative">
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          type="search"
          placeholder="Search contacts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${inputClass} w-full pl-9`}
        />
      </div>

      <ul className="flex flex-col gap-2">
        {list?.length === 0 && <p className="py-8 text-center text-sm text-ink-muted">No contacts yet.</p>}
        {list?.map((c) => (
          <li key={c.id}>
            <Link
              to={`/contacts/${c.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-steel-700 bg-steel-900 px-4 py-3.5 transition-colors hover:border-steel-600"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{c.name}</p>
                <p className="truncate text-sm text-ink-muted">
                  {[c.email, companyName(c.company_id)].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              <Icon name="arrow" className="shrink-0 text-ink-muted" />
            </Link>
          </li>
        ))}
      </ul>

      <AddContactModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        companyList={companyList}
        onCreated={() => reload(query)}
      />
    </div>
  )
}

function AddContactModal({
  open,
  onClose,
  companyList,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  companyList: Company[]
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [title, setTitle] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setName(''); setEmail(''); setPhone(''); setTitle(''); setCompanyId(''); setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await contacts.create({ name, email, phone, title, company_id: companyId || null })
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
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Add contact">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Name" htmlFor="c-name">
          <input id="c-name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Email" htmlFor="c-email">
          <input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Phone" htmlFor="c-phone">
          <input id="c-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Title" htmlFor="c-title">
          <input id="c-title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Company" htmlFor="c-company">
          <select id="c-company" value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={inputClass}>
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
          {submitting ? 'Saving…' : 'Save contact'}
        </button>
      </form>
    </Modal>
  )
}
