import { motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import { StudentTopNav } from '@/components/layout/StudentTopNav'
import { StudentMobileNav } from '@/components/layout/StudentMobileNav'

export function StudentLayout() {
  const location = useLocation()

  return (
    <div className="min-h-svh bg-canvas">
      <StudentTopNav />

      <main className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-8 sm:pb-10">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>

      <footer className="mx-auto hidden max-w-6xl px-4 pb-10 text-xs text-ink-muted sm:block sm:px-6">
        ClassFlow · College of Computer Studies
      </footer>
      <StudentMobileNav />
    </div>
  )
}
