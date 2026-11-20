import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ProfessorSidebar } from '@/components/layout/ProfessorSidebar'
import { ProfessorTopbar } from '@/components/layout/ProfessorTopbar'
import { ProfessorMobileNav } from '@/components/layout/ProfessorMobileNav'
import { cn } from '@/utils/cn'

export function ProfessorLayout() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const closeMobile = useCallback(() => {
    setMobileOpen(false)
    menuButtonRef.current?.focus()
  }, [])

  const handleNavigate = useCallback(() => {
    setMobileOpen(false)
    requestAnimationFrame(() => document.getElementById('main-content')?.focus())
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const tabletQuery = window.matchMedia('(min-width: 48rem)')
    const desktopQuery = window.matchMedia('(min-width: 64rem)')

    const handleTablet = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setMobileOpen(false)
      }
    }
    const handleDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setCollapsed(false)
      }
    }

    if (tabletQuery.matches) {
      setMobileOpen(false)
    }
    if (desktopQuery.matches) {
      setCollapsed(false)
    }

    tabletQuery.addEventListener('change', handleTablet)
    desktopQuery.addEventListener('change', handleDesktop)

    return () => {
      tabletQuery.removeEventListener('change', handleTablet)
      desktopQuery.removeEventListener('change', handleDesktop)
    }
  }, [])

  useEffect(() => {
    if (!mobileOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = requestAnimationFrame(() => drawerRef.current?.focus())

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMobile()

        return
      }

      if (event.key !== 'Tab' || drawerRef.current === null) {
        return
      }

      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )

      if (focusable.length === 0) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      cancelAnimationFrame(frame)
    }
  }, [mobileOpen, closeMobile])

  return (
    <div className="min-h-svh bg-canvas">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-200 md:block',
          collapsed ? 'w-20 lg:w-72' : 'w-64 lg:w-72',
        )}
      >
        <ProfessorSidebar
          collapsed={collapsed}
          showCollapseControl
          onToggle={() => setCollapsed((value) => !value)}
        />
      </div>

      <div
        className={cn(
          'transition-[padding] duration-200',
          collapsed ? 'md:pl-20 lg:pl-72' : 'md:pl-64 lg:pl-72',
        )}
      >
        <ProfessorTopbar
          onMenuClick={() => setMobileOpen(true)}
          mobileOpen={mobileOpen}
          menuButtonRef={menuButtonRef}
        />

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-6xl px-4 py-6 pb-28 outline-none sm:px-6 sm:py-8 md:px-7 md:pb-12 lg:px-8"
        >
          <Outlet />
        </main>

        <footer className="mx-auto hidden max-w-6xl px-4 pb-10 text-xs text-ink-muted sm:block md:px-7 lg:px-8">
          ClassFlow · College of Computer Studies
        </footer>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeMobile}
            className="absolute inset-0 h-full w-full bg-brand-900/70 backdrop-blur-[2px]"
          />
          <div
            id="professor-mobile-navigation"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Professor navigation"
            tabIndex={-1}
            className="absolute inset-y-0 left-0 w-[min(20rem,85vw)] max-w-full shadow-dialog outline-none"
          >
            <ProfessorSidebar
              variant="drawer"
              onClose={closeMobile}
              onNavigate={handleNavigate}
            />
          </div>
        </div>
      ) : null}

      {!mobileOpen ? <ProfessorMobileNav /> : null}
    </div>
  )
}
