import { LogOut, Menu } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { initials } from '@/utils/format'

interface ProfessorTopbarProps {
  onMenuClick: () => void
}

export function ProfessorTopbar({ onMenuClick }: ProfessorTopbarProps) {
  const { pathname } = useLocation()
  const title = pathname === '/professor/dashboard' ? 'Dashboard' : 'Professor workspace'
  const { user, logout } = useAuth()
  const departmentLabel =
    user?.profile?.type === 'professor'
      ? (user.profile.program?.name ?? user.profile.employmentType)
      : 'Faculty'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur md:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-ink-muted transition hover:bg-white hover:text-ink lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <Logo variant="onLight" compact className="lg:hidden" />

      <div className="min-w-0">
        <p className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted sm:block">
          Professor workspace
        </p>
        <h1 className="truncate font-display text-lg font-semibold text-ink">{title}</h1>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-full bg-flow-800 text-xs font-bold text-coral-300">
          {user ? initials(user.name) : 'PR'}
        </div>
        <div className="hidden leading-tight sm:block">
          <p className="max-w-[160px] truncate text-xs font-semibold text-ink">
            {user?.name ?? 'Professor'}
          </p>
          <p className="text-[11px] text-ink-muted">{departmentLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg p-2 text-ink-muted transition hover:bg-white hover:text-ink"
          aria-label="Sign out"
        >
          <LogOut className="size-[18px]" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
