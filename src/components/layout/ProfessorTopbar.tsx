import { LogOut } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'
import { useAuth } from '@/hooks/useAuth'
import { initials } from '@/utils/format'

const pageLabels: Record<string, string> = {
  '/professor/dashboard': 'Dashboard',
  '/professor/attendance': 'Attendance',
  '/professor/announcements': 'Announcements',
  '/professor/activities': 'Activities',
}

function currentPage(pathname: string): string {
  if (pathname.startsWith('/professor/announcements')) return 'Announcements'
  if (pathname.startsWith('/professor/activities')) return 'Activities'
  return pageLabels[pathname] ?? 'Professor workspace'
}

export function ProfessorTopbar() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const departmentLabel =
    user?.profile?.type === 'professor'
      ? (user.profile.program?.name ?? user.profile.employmentType)
      : 'Faculty'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-canvas/95 px-4 backdrop-blur md:px-6 lg:px-8">
      <Logo variant="onLight" compact className="md:hidden" />

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
          Teaching desk
        </p>
        <p className="truncate text-sm font-semibold text-ink">{currentPage(pathname)}</p>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-full bg-brand-800 text-xs font-bold text-gold-400">
          {user ? initials(user.name) : 'PR'}
        </div>
        <div className="hidden leading-tight sm:block">
          <p className="max-w-40 truncate text-xs font-semibold text-ink">
            {user?.name ?? 'Professor'}
          </p>
          <p className="max-w-40 truncate text-xs text-ink-muted">{departmentLabel}</p>
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
    </header>
  )
}
