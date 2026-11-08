import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type BadgeTone = 'neutral' | 'flow' | 'coral' | 'success' | 'warning' | 'danger'

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}

const toneStyles: Record<BadgeTone, string> = {
  neutral: 'border-line bg-slate-50 text-ink-muted',
  flow: 'border-flow-200 bg-flow-50 text-flow-800',
  coral: 'border-coral-200 bg-coral-100 text-night-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-700',
}

const dotStyles: Record<BadgeTone, string> = {
  neutral: 'bg-slate-400',
  flow: 'bg-flow-500',
  coral: 'bg-coral-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]',
        toneStyles[tone],
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', dotStyles[tone])} aria-hidden="true" />
      {children}
    </span>
  )
}
