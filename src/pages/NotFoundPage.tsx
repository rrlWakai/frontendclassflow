import { ArrowLeft, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <header className="mx-auto w-full max-w-5xl px-5 py-6 sm:px-8">
        <Logo variant="onLight" />
      </header>

      <main className="grid flex-1 place-items-center px-5 py-12">
        <div className="max-w-lg text-center">
          <div className="flex justify-center">
            <span className="flex size-14 items-center justify-center rounded-2xl border border-flow-200 bg-flow-50 text-flow-700">
              <Compass className="size-6" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-5 font-display text-6xl font-semibold tracking-[-0.04em] text-flow-600/20">
            404
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.02em] text-ink">
            This page isn&apos;t in the flow.
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            The page you tried to reach does not exist. Return to sign in or head to your
            dashboard.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
            <Link
              to="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-flow-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-flow-700"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Sign in
            </Link>
            <Link
              to="/professor/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink transition-colors hover:border-flow-300 hover:bg-flow-50"
            >
              Professor dashboard
            </Link>
            <Link
              to="/student/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink transition-colors hover:border-coral-300 hover:bg-coral-100"
            >
              Student dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
