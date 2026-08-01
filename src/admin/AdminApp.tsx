import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { auth } from './api.ts'
import { AdminLayout } from './components/AdminLayout.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { ContactsPage } from './pages/ContactsPage.tsx'
import { ContactDetailPage } from './pages/ContactDetailPage.tsx'
import { CompaniesPage } from './pages/CompaniesPage.tsx'
import { CompanyDetailPage } from './pages/CompanyDetailPage.tsx'
import { DealsPage } from './pages/DealsPage.tsx'
import { DashboardPage } from './pages/DashboardPage.tsx'
import { FinancialsPage } from './pages/FinancialsPage.tsx'
import { LeadGenerationPage } from './pages/LeadGenerationPage.tsx'

type AuthState = 'checking' | 'authed' | 'anon'

const AuthContext = createContext<{ state: AuthState; setAuthed: (v: boolean) => void }>({
  state: 'checking',
  setAuthed: () => {},
})

export function useAdminAuth() {
  return useContext(AuthContext)
}

function RequireAuth() {
  const { state } = useAdminAuth()

  if (state === 'checking') {
    return (
      <div className="grid min-h-dvh place-items-center bg-charcoal-900">
        <p className="text-sm text-ink-muted">Loading…</p>
      </div>
    )
  }

  if (state === 'anon') return <Navigate to="/login" replace />

  return <Outlet />
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>('checking')

  useEffect(() => {
    auth
      .me()
      .then(() => setState('authed'))
      .catch(() => setState('anon'))
  }, [])

  return (
    <AuthContext.Provider value={{ state, setAuthed: (v) => setState(v ? 'authed' : 'anon') }}>
      {children}
    </AuthContext.Provider>
  )
}

export function AdminApp() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="contacts/:id" element={<ContactDetailPage />} />
              <Route path="leads" element={<LeadGenerationPage />} />
              <Route path="companies" element={<CompaniesPage />} />
              <Route path="companies/:id" element={<CompanyDetailPage />} />
              <Route path="deals" element={<DealsPage />} />
              <Route path="financials" element={<FinancialsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}
