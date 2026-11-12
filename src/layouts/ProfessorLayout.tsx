import { Outlet } from 'react-router-dom'
import { ProfessorSidebar } from '@/components/layout/ProfessorSidebar'
import { ProfessorTopbar } from '@/components/layout/ProfessorTopbar'
import { ProfessorMobileNav } from '@/components/layout/ProfessorMobileNav'

export function ProfessorLayout() {
  return (
    <div className="min-h-svh bg-canvas">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="fixed inset-y-0 left-0 z-40 hidden w-64 md:block xl:w-72">
        <ProfessorSidebar />
      </div>

      <div className="md:pl-64 xl:pl-72">
        <ProfessorTopbar />

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

      <ProfessorMobileNav />
    </div>
  )
}
