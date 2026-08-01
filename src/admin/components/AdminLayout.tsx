import { NavLink, Outlet } from 'react-router-dom'
import { Icon, type IconName } from '../../components/Icon.tsx'
import { Wordmark } from '../../components/Wordmark.tsx'
import { auth } from '../api.ts'
import { useAdminAuth } from '../AdminApp.tsx'

const tabs: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Overview', icon: 'dashboard' },
  { to: '/contacts', label: 'Contacts', icon: 'users' },
  { to: '/companies', label: 'Companies', icon: 'building' },
  { to: '/deals', label: 'Deals', icon: 'pipeline' },
  { to: '/financials', label: 'Financials', icon: 'chart' },
]

function tabClass(active: boolean) {
  return `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors xs:text-xs sm:flex-row sm:justify-start sm:gap-2.5 sm:px-3 sm:py-2.5 sm:text-sm ${
    active ? 'text-lime-500 sm:bg-lime-500/10' : 'text-ink-muted hover:text-ink'
  }`
}

export function AdminLayout() {
  const { setAuthed } = useAdminAuth()

  async function handleLogout() {
    await auth.logout().catch(() => {})
    setAuthed(false)
  }

  return (
    <div className="flex min-h-dvh min-w-0 flex-col bg-charcoal-900 sm:flex-row">
      {/* Desktop rail */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-steel-700/80 bg-charcoal-950 p-4 sm:flex">
        <Wordmark />
        <p className="mt-1 text-xs font-mono text-ink-muted">Admin</p>
        <nav className="mt-8 flex flex-col gap-1">
          {tabs.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className={({ isActive }) => tabClass(isActive)}>
              <Icon name={tab.icon} className="text-lg" />
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-auto flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <Icon name="logout" className="text-lg" />
          Log out
        </button>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-steel-700/80 bg-charcoal-950 px-4 py-3 sm:hidden">
        <Wordmark />
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
          className="grid h-9 w-9 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-steel-800 hover:text-ink"
        >
          <Icon name="logout" className="text-lg" />
        </button>
      </header>

      <main className="min-w-0 flex-1 overflow-y-auto pb-24 sm:pb-0">
        <div className="mx-auto min-w-0 w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-steel-700/80 bg-charcoal-950/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className={({ isActive }) => tabClass(isActive)}>
            <Icon name={tab.icon} className="text-lg" />
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
