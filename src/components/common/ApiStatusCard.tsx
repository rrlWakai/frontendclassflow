import { Card } from '@/components/common/Card'
import { useHealthCheck } from '@/hooks/useHealthCheck'
import { cn } from '@/utils/cn'

export function ApiStatusCard() {
  const health = useHealthCheck()

  const dot =
    health.status === 'online'
      ? 'bg-emerald-500'
      : health.status === 'checking'
        ? 'bg-slate-400'
        : 'bg-red-500'

  const label =
    health.status === 'online'
      ? 'Connected'
      : health.status === 'checking'
        ? 'Checking connection'
        : 'Unavailable'

  const detail =
    health.status === 'online'
      ? `${health.data.application} · API ${health.data.version}`
      : health.status === 'checking'
        ? 'Contacting /api/v1/health'
        : health.error

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
          CCSync API
        </p>
        <span className={cn('size-2 rounded-full', dot)} aria-hidden="true" />
      </div>
      <p className="mt-3 text-lg font-semibold text-ink">{label}</p>
      <p className="mt-1 text-xs leading-5 text-ink-muted">{detail}</p>
    </Card>
  )
}
