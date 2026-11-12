import { Outlet } from 'react-router-dom'
import { StudentTopNav } from '@/components/layout/StudentTopNav'
import { StudentMobileNav } from '@/components/layout/StudentMobileNav'

export function StudentLayout() {
  return (
    <div className="min-h-svh bg-canvas">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <StudentTopNav />

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-6xl px-4 py-6 pb-28 outline-none sm:px-6 sm:py-8 sm:pb-12"
      >
        <Outlet />
      </main>

      <footer className="mx-auto hidden max-w-6xl px-4 pb-10 text-xs text-ink-muted sm:block sm:px-6">
        ClassFlow · College of Computer Studies
      </footer>
      <StudentMobileNav />
    </div>
  )
}
