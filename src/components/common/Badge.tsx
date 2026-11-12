import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type BadgeTone = 'neutral' | 'brand' | 'gold' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}

const toneStyles: Record<BadgeTone, string> = {
  neutral: 'border-line bg-surface-subtle text-ink-muted',
  brand: 'border-brand-100 bg-brand-50 text-brand-800',
  gold: 'border-gold-200 bg-[#fff9e8] text-gold-700',
  success: 'border-[#c7ded3] bg-success-soft text-success',
  warning: 'border-[#e9d5a6] bg-warning-soft text-warning',
  danger: 'border-[#efc7c2] bg-danger-soft text-danger',
  info: 'border-[#cad8e2] bg-info-soft text-info',
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold capitalize leading-5',
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
