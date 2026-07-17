import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Wordmark } from '../../components/Wordmark.tsx'
import { auth, ApiError } from '../api.ts'
import { useAdminAuth } from '../AdminApp.tsx'

export function LoginPage() {
  const { state, setAuthed } = useAdminAuth()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (state === 'authed') return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await auth.login(password)
      setAuthed(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-charcoal-900 px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-steel-700 bg-steel-900 p-6 shadow-2xl">
        <div className="flex flex-col items-center gap-1 text-center">
          <Wordmark />
          <p className="mt-2 text-sm text-ink-muted">Admin sign-in</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-password" className="text-sm font-medium text-ink">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-steel-600 bg-charcoal-850 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-lime-500/60 focus:ring-1 focus:ring-lime-500/30"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 flex items-center justify-center gap-2 rounded-full bg-lime-500 px-5 py-2.5 text-sm font-semibold text-charcoal-950 transition-all hover:bg-lime-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
