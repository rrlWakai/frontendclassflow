import { LoaderCircle } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'

export function LoadingScreen() {
  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center gap-6 bg-canvas px-6"
      role="status"
      aria-live="polite"
    >
      <Logo variant="onLight" />
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <LoaderCircle className="size-4 animate-spin text-flow-600" aria-hidden="true" />
        Preparing your workspace…
      </div>
    </div>
  )
}
