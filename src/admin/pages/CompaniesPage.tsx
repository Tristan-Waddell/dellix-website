import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon.tsx'
import { Modal, Field, inputClass } from '../components/Modal.tsx'
import { companies, ApiError } from '../api.ts'
import type { Company } from '../../../shared/types.ts'

export function CompaniesPage() {
  const [list, setList] = useState<Company[] | null>(null)
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  function reload(q?: string) {
    companies.list(q).then((res) => setList(res.companies))
  }

  useEffect(() => { reload() }, [])

  useEffect(() => {
    const timeout = setTimeout(() => reload(query), 250)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Companies</h1>
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
          placeholder="Search companies…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${inputClass} w-full pl-9`}
        />
      </div>

      <ul className="flex flex-col gap-2">
        {list?.length === 0 && <p className="py-8 text-center text-sm text-ink-muted">No companies yet.</p>}
        {list?.map((c) => (
          <li key={c.id}>
            <Link
              to={`/companies/${c.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-steel-700 bg-steel-900 px-4 py-3.5 transition-colors hover:border-steel-600"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{c.name}</p>
                <p className="truncate text-sm text-ink-muted">{c.domain ?? '—'}</p>
              </div>
              <Icon name="arrow" className="shrink-0 text-ink-muted" />
            </Link>
          </li>
        ))}
      </ul>

      <AddCompanyModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={() => reload(query)} />
    </div>
  )
}

function AddCompanyModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setName(''); setDomain(''); setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await companies.create({ name, domain })
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
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Add company">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Name" htmlFor="co-name">
          <input id="co-name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Domain" htmlFor="co-domain">
          <input id="co-domain" placeholder="acme.com" value={domain} onChange={(e) => setDomain(e.target.value)} className={inputClass} />
        </Field>

        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-full bg-lime-500 px-5 py-2.5 text-sm font-semibold text-charcoal-950 transition-colors hover:bg-lime-400 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save company'}
        </button>
      </form>
    </Modal>
  )
}
