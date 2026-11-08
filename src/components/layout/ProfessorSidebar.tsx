import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  LayoutDashboard,
  Megaphone,
  Sparkles,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'

interface UpcomingItem {
  label: string
  icon: LucideIcon
}

const upcoming: UpcomingItem[] = [
  { label: 'Classes', icon: BookOpen },
  { label: 'Gradebook', icon: BarChart3 },
]

interface ProfessorSidebarProps {
  onNavigate?: () => void
  onClose?: () => void
}

export function ProfessorSidebar({ onNavigate, onClose }: ProfessorSidebarProps) {
  return (
    <aside className="flex h-full flex-col bg-night-950 text-white">
      <div className="flex h-20 items-center justify-between px-5">
        <Logo />
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto px-3 pb-6 pt-2" aria-label="Professor">
        <div>
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
            Workspace
          </p>
          <NavLink
            to="/professor/dashboard"
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                    ? 'bg-white/10 text-white shadow-[inset_3px_0_0_var(--color-coral-400)]'
                  : 'text-white/60 hover:bg-white/5 hover:text-white',
              ].join(' ')
            }
          >
            <LayoutDashboard className="size-[18px]" aria-hidden="true" />
            Dashboard
          </NavLink>
        </div>

        <div>
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
            Teaching tools
          </p>
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/professor/announcements"
                onClick={onNavigate}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white/10 text-white shadow-[inset_3px_0_0_var(--color-coral-400)]'
                      : 'text-white/60 hover:bg-white/5 hover:text-white',
                  ].join(' ')
                }
              >
                <Megaphone className="size-[18px]" aria-hidden="true" />
                Announcements
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/professor/activities"
                onClick={onNavigate}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white/10 text-white shadow-[inset_3px_0_0_var(--color-coral-400)]'
                      : 'text-white/60 hover:bg-white/5 hover:text-white',
                  ].join(' ')
                }
              >
                <Sparkles className="size-[18px]" aria-hidden="true" />
                Activities
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/professor/attendance"
                onClick={onNavigate}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white/10 text-white shadow-[inset_3px_0_0_var(--color-coral-400)]'
                      : 'text-white/60 hover:bg-white/5 hover:text-white',
                  ].join(' ')
                }
              >
                <ClipboardCheck className="size-[18px]" aria-hidden="true" />
                Attendance
              </NavLink>
            </li>
            {upcoming.map((item) => {
              const Icon = item.icon

              return (
                <li key={item.label}>
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/30">
                    <Icon className="size-[18px]" aria-hidden="true" />
                    <span>{item.label}</span>
                    <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/40">
                      Phase 2
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="rounded-xl bg-white/5 p-3.5 ring-1 ring-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
            Foundation build
          </p>
          <p className="mt-1.5 text-sm font-medium text-white/85">ClassFlow · v0.1.0</p>
          <p className="mt-1 text-xs leading-5 text-white/45">
            Teaching workflows arrive after academic data and authentication.
          </p>
        </div>
      </div>
    </aside>
  )
}
