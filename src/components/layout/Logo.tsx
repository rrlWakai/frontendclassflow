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
          'flex size-10 shrink-0 items-center justify-center rounded-md',
          onDark
            ? 'bg-gold-400 text-brand-900'
            : 'bg-brand-800 text-gold-400',
        )}
      >
        <svg viewBox="0 0 32 32" className="size-6" fill="none" aria-hidden="true">
          <path
            d="M5 20c3.5-7 7-7 10.5 0s7 7 10.5 0"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx="24" cy="12.5" r="2" fill="currentColor" />
        </svg>
      </span>
      {compact ? null : (
        <div className="min-w-0 leading-none">
          <p
            className={cn(
              'text-xl font-medium tracking-[-0.03em]',
              onDark ? 'text-white' : 'text-ink',
            )}
          >
            Class<span className={onDark ? 'text-gold-400' : 'text-brand-700'}>Flow</span>
          </p>
          <p
            className={cn(
              'mt-1.5 truncate text-xs font-semibold uppercase tracking-[0.14em]',
              onDark ? 'text-[#d9c7c9]' : 'text-ink-muted',
            )}
          >
            College of Computer Studies
          </p>
        </div>
      )}
    </div>
  )
}
