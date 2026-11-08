import { ClipboardCheck, LayoutDashboard, LogOut, Megaphone, Sparkles } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'
import { initials } from '@/utils/format'

export function StudentTopNav() {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Logo variant="onLight" />

        <nav className="ml-4 hidden items-center gap-1 sm:flex" aria-label="Student">
          <NavLink
            to="/student/dashboard"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-flow-50 text-flow-700'
                  : 'text-ink-muted hover:bg-canvas hover:text-ink',
              )
            }
          >
            <LayoutDashboard className="size-4" aria-hidden="true" />
            Dashboard
          </NavLink>
          <NavLink
            to="/student/attendance"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-flow-50 text-flow-700'
                  : 'text-ink-muted hover:bg-canvas hover:text-ink',
              )
            }
          >
            <ClipboardCheck className="size-4" aria-hidden="true" />
            My attendance
          </NavLink>
          <NavLink
            to="/student/announcements"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-flow-50 text-flow-700'
                  : 'text-ink-muted hover:bg-canvas hover:text-ink',
              )
            }
          >
            <Megaphone className="size-4" aria-hidden="true" />
            Announcements
          </NavLink>
          <NavLink
            to="/student/activities"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-flow-50 text-flow-700'
                  : 'text-ink-muted hover:bg-canvas hover:text-ink',
              )
            }
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Activities
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-full border border-flow-200 bg-flow-50 px-2.5 py-1">
            <span className="flex size-6 items-center justify-center rounded-full bg-flow-800 text-[10px] font-bold text-coral-300">
              {user ? initials(user.name) : 'ST'}
            </span>
            <span className="hidden max-w-[140px] truncate text-xs font-semibold text-ink sm:block">
              {user?.name ?? 'Student'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg p-2 text-ink-muted transition hover:bg-canvas hover:text-ink"
            aria-label="Sign out"
          >
            <LogOut className="size-[18px]" aria-hidden="true" />
          </button>
        </div>
      </div>

    </header>
  )
}
