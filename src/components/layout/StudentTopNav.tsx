import { ClipboardCheck, LayoutDashboard, LogOut, Megaphone, Sparkles } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'
import { initials } from '@/utils/format'

const links = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/student/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/student/activities', label: 'Activities', icon: Sparkles },
]

export function StudentTopNav() {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo variant="onLight" compact className="sm:hidden" />
        <Logo variant="onLight" className="hidden sm:flex" />

        <nav className="hidden h-16 items-center gap-5 sm:flex" aria-label="Student">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'inline-flex h-16 items-center gap-2 border-b-2 text-sm font-semibold transition-colors',
                  isActive
                    ? 'border-gold-500 text-brand-800'
                    : 'border-transparent text-ink-muted hover:text-ink',
                )
              }
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-brand-800 text-xs font-bold text-gold-400">
              {user ? initials(user.name) : 'ST'}
            </span>
            <span className="hidden max-w-36 truncate text-sm font-semibold text-ink md:block">
              {user?.name ?? 'Student'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex size-10 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-subtle hover:text-ink"
            aria-label="Sign out"
          >
            <LogOut className="size-[18px]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
}
