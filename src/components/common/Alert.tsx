import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/utils/cn'

type AlertTone = 'info' | 'success' | 'warning' | 'danger'

interface AlertProps {
  tone?: AlertTone
  title?: string
  children: ReactNode
  action?: ReactNode
  className?: string
}

const toneStyles: Record<AlertTone, { container: string; icon: string; Icon: typeof Info }> = {
  info: {
    container: 'border-[#cad8e2] bg-info-soft text-info',
    icon: 'text-info',
    Icon: Info,
  },
  success: {
    container: 'border-[#c7ded3] bg-success-soft text-success',
    icon: 'text-success',
    Icon: CheckCircle2,
  },
  warning: {
    container: 'border-[#e9d5a6] bg-warning-soft text-warning',
    icon: 'text-warning',
    Icon: TriangleAlert,
  },
  danger: {
    container: 'border-[#efc7c2] bg-danger-soft text-danger',
    icon: 'text-danger',
    Icon: AlertCircle,
  },
}

export function Alert({ tone = 'info', title, children, action, className }: AlertProps) {
  const styles = toneStyles[tone]
  const Icon = styles.Icon

  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-md border p-4 text-sm', styles.container, className)}
    >
      <Icon className={cn('mt-0.5 size-4 shrink-0', styles.icon)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={cn('leading-6', title && 'mt-0.5')}>{children}</div>
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  )
}
