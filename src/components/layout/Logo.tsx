import { cn } from '@/utils/cn'

interface LogoProps {
  variant?: 'onDark' | 'onLight'
  compact?: boolean
  className?: string
}

export function Logo({ variant = 'onDark', compact = false, className }: LogoProps) {
  const onDark = variant === 'onDark'

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl ring-1',
          onDark
            ? 'bg-coral-400 text-night-950 ring-coral-300'
            : 'bg-flow-800 text-coral-400 ring-flow-900/10',
        )}
      >
        <svg viewBox="0 0 32 32" className="size-6" fill="none" aria-hidden="true">
          <path
            d="M5 20c3.5-7 7-7 10.5 0s7 7 10.5 0"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx="24" cy="12.5" r="2" fill="#F5B900" />
        </svg>
      </span>
      {compact ? null : (
        <div className="min-w-0 leading-none">
          <p
            className={cn(
              'font-display text-lg font-semibold tracking-tight',
              onDark ? 'text-white' : 'text-ink',
            )}
          >
            Class<span className="text-coral-400">Flow</span>
          </p>
          <p
            className={cn(
              'mt-1.5 truncate text-[10px] font-semibold uppercase tracking-[0.2em]',
              onDark ? 'text-white/40' : 'text-ink-muted',
            )}
          >
            College of Computer Studies
          </p>
        </div>
      )}
    </div>
  )
}
