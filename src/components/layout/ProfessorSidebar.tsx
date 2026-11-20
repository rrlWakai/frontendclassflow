import type { LucideIcon } from 'lucide-react'
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard,
  Megaphone,
  QrCode,
  Sparkles,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'
import { cn } from '@/utils/cn'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

interface NavGroup {
  label: string
  links: NavItem[]
}

interface ProfessorSidebarProps {
  collapsed?: boolean
  variant?: 'docked' | 'drawer'
  showCollapseControl?: boolean
  onToggle?: () => void
  onClose?: () => void
  onNavigate?: () => void
}

const navGroups: NavGroup[] = [
  {
    label: 'Teaching',
    links: [
      { to: '/professor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/professor/attendance', label: 'Attendance', icon: ClipboardCheck },
      { to: '/professor/room-scanner', label: 'Room scanner', icon: QrCode },
    ],
  },
  {
    label: 'Campus',
    links: [
      { to: '/professor/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/professor/activities', label: 'Activities', icon: Sparkles },
    ],
  },
]

function SidebarLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center rounded-lg py-2.5 text-sm font-semibold transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900',
          collapsed ? 'justify-center px-0' : 'gap-3 px-3',
          isActive
            ? 'bg-white/10 text-white before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-r-full before:bg-gold-400'
            : 'text-brand-100/85 hover:bg-white/[0.07] hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              'size-[18px] shrink-0 transition-colors',
              isActive ? 'text-gold-400' : 'text-brand-100/70 group-hover:text-gold-200',
            )}
            aria-hidden="true"
          />
          <span className={cn(collapsed ? 'sr-only' : 'truncate')}>{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

export function ProfessorSidebar({
  collapsed = false,
  variant = 'docked',
  showCollapseControl = false,
  onToggle,
  onClose,
  onNavigate,
}: ProfessorSidebarProps) {
  const isCollapsed = variant === 'drawer' ? false : collapsed

  return (
    <aside className="flex h-full min-h-0 flex-col bg-brand-900 text-white">
      <div
        className={cn(
          'flex h-[4.5rem] shrink-0 items-center border-b border-white/10',
          isCollapsed ? 'justify-center px-2' : 'gap-2 px-4',
        )}
      >
        {isCollapsed ? (
          <Logo compact className="[&>span]:size-9" />
        ) : (
          <div className="min-w-0 flex-1 [&_p:first-child]:text-lg [&_p:last-child]:text-[10px] [&_p:last-child]:leading-tight [&_p:last-child]:tracking-[0.1em]">
            <Logo className="w-full min-w-0 [&>span]:size-9" />
          </div>
        )}

        {variant === 'drawer' ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-brand-100 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        ) : null}

        {showCollapseControl ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isCollapsed}
            className="hidden size-8 shrink-0 items-center justify-center rounded-md text-brand-100 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900 md:inline-flex lg:hidden"
          >
            {isCollapsed ? (
              <ChevronRight className="size-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="size-4" aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Professor navigation">
        {navGroups.map((group, groupIndex) => (
          <div
            key={group.label}
            className={cn(
              groupIndex > 0 && 'mt-5 border-t border-white/10 pt-5',
              isCollapsed && 'mt-3 border-t border-white/10 pt-3',
            )}
          >
            {isCollapsed ? (
              <span className="sr-only">{group.label}</span>
            ) : (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c9b9bd]">
                {group.label}
              </p>
            )}
            <ul className="space-y-1">
              {group.links.map((item) => (
                <li key={item.to}>
                  <SidebarLink item={item} collapsed={isCollapsed} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div
        className={cn(
          'shrink-0 border-t border-white/10 py-4',
          isCollapsed ? 'px-2' : 'px-5',
        )}
      >
        {isCollapsed ? (
          <p className="text-center text-[10px] font-bold tracking-[0.18em] text-gold-400">CF</p>
        ) : (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">ClassFlow</p>
            <p className="mt-1 truncate text-[10px] font-medium uppercase tracking-[0.1em] text-[#c4b8b3]">
              College of Computer Studies
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
