import type { LucideIcon } from 'lucide-react'
import {
  ClipboardCheck,
  LayoutDashboard,
  Megaphone,
  Sparkles,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const teachingLinks: NavItem[] = [
  { to: '/professor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/professor/attendance', label: 'Attendance', icon: ClipboardCheck },
]

const campusLinks: NavItem[] = [
  { to: '/professor/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/professor/activities', label: 'Activities', icon: Sparkles },
]

export function ProfessorSidebar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-gold-400',
      isActive
        ? 'bg-white/10 text-white before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-gold-400'
        : 'text-[#d9c7c9] hover:bg-white/5 hover:text-white',
    ].join(' ')

  return (
    <aside className="flex h-full flex-col bg-brand-900 text-white">
      <div className="flex h-20 items-center px-5">
        <Logo />
      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto px-3 pb-6 pt-3" aria-label="Professor">
        <div>
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#c4b8b3]">
            Teaching
          </p>
          <ul className="space-y-1">
            {teachingLinks.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink to={to} className={linkClass}>
                  <Icon className="size-[18px]" aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#c4b8b3]">
            Campus
          </p>
          <ul className="space-y-1">
            {campusLinks.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink to={to} className={linkClass}>
                  <Icon className="size-[18px]" aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="border-t border-white/10 px-5 py-5">
        <p className="text-sm font-semibold text-white">ClassFlow</p>
        <p className="mt-1 text-xs leading-5 text-[#c4b8b3]">College of Computer Studies</p>
      </div>
    </aside>
  )
}
