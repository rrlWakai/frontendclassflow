import { ClipboardCheck, LayoutDashboard, Megaphone, Sparkles } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/cn'

const links = [
  { to: '/professor/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/professor/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/professor/announcements', label: 'Notices', icon: Megaphone },
  { to: '/professor/activities', label: 'Activities', icon: Sparkles },
]

export function ProfessorMobileNav() {
  return <nav aria-label="Professor mobile" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
    <div className="mx-auto grid max-w-md grid-cols-4">
      {links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => cn('flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-semibold', isActive ? 'bg-flow-50 text-flow-800' : 'text-ink-muted')}>
        <Icon className="size-5" aria-hidden="true" /><span>{label}</span>
      </NavLink>)}
    </div>
  </nav>
}
