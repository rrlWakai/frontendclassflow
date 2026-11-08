import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import { ProfessorSidebar } from '@/components/layout/ProfessorSidebar'
import { ProfessorTopbar } from '@/components/layout/ProfessorTopbar'
import { ProfessorMobileNav } from '@/components/layout/ProfessorMobileNav'

export function ProfessorLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-svh bg-canvas">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-72">
        <ProfessorSidebar />
      </div>

      <div className="lg:pl-72">
        <ProfessorTopbar onMenuClick={() => setMobileOpen(true)} />

        <main className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-8 sm:pb-10 md:px-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>

        <footer className="mx-auto hidden max-w-6xl px-4 pb-10 text-xs text-ink-muted sm:block md:px-8">
          ClassFlow · College of Computer Studies
        </footer>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-night-950/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
            >
              <ProfessorSidebar
                onClose={() => setMobileOpen(false)}
                onNavigate={() => setMobileOpen(false)}
              />
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      <ProfessorMobileNav />
    </div>
  )
}
