import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../../components/Icon.tsx'
import { Field, inputClass } from '../components/Modal.tsx'
import { companies, ApiError } from '../api.ts'
import type { Company } from '../../../shared/types.ts'

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [company, setCompany] = useState<Company | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    companies.get(id).then((res) => setCompany(res.company))
  }, [id])

  if (!company) return <p className="text-sm text-ink-muted">Loading…</p>

  function update<K extends keyof Company>(key: K, value: Company[K]) {
    setCompany((c) => (c ? { ...c, [key]: value } : c))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !company) return
    setStatus('saving')
    setError('')
    try {
      const res = await companies.update(id, { name: company.name, domain: company.domain, notes: company.notes })
      setCompany(res.company)
      setStatus('saved')
    } catch (err) {
      setStatus('error')
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    }
  }

  async function handleDelete() {
    if (!id) return
    if (!confirm('Delete this company? This cannot be undone.')) return
    await companies.remove(id)
    navigate('/companies')
  }

  return (
    <div className="flex flex-col gap-5">
      <Link to="/companies" className="flex w-fit items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <Icon name="arrow" className="rotate-180 text-base" />
        Back to companies
      </Link>

      <form onSubmit={handleSave} className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-steel-700 bg-steel-900 p-5">
        <Field label="Name" htmlFor="cd-name">
          <input id="cd-name" required value={company.name} onChange={(e) => update('name', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Domain" htmlFor="cd-domain">
          <input id="cd-domain" value={company.domain ?? ''} onChange={(e) => update('domain', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Notes" htmlFor="cd-notes">
          <textarea id="cd-notes" rows={4} value={company.notes ?? ''} onChange={(e) => update('notes', e.target.value)} className={`${inputClass} resize-none`} />
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
