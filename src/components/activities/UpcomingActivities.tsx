import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, MapPin, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { LinkButton } from '@/components/common/LinkButton'
import { useAuth } from '@/hooks/useAuth'
import { fetchActivities } from '@/services/api/activities'
import type { Activity } from '@/types/activity'
import { getApiErrorMessage } from '@/utils/apiError'

function dateParts(value: string) {
  const date = new Date(value)
  return {
    month: new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      timeZone: 'Asia/Manila',
    }).format(date),
    day: new Intl.DateTimeFormat('en-PH', {
      day: '2-digit',
      timeZone: 'Asia/Manila',
    }).format(date),
    time: new Intl.DateTimeFormat('en-PH', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Manila',
    }).format(date),
  }
}

export function UpcomingActivities({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth()
  const role = user?.role === 'professor' ? 'professor' : 'student'
  const basePath = `/${role}/activities`
  const [activities, setActivities] = useState<Activity[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void fetchActivities({ status: 'upcoming', per_page: compact ? 3 : 6 })
      .then((result) => {
        if (active) setActivities(result.activities)
      })
      .catch((failure: unknown) => {
        if (active) setError(getApiErrorMessage(failure, 'Unable to load upcoming activities.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [compact])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-gold-700" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-ink">Upcoming activities</h2>
          </div>
          <p className="mt-1 text-sm text-ink-muted">Events for your audience</p>
        </div>
        <LinkButton to={basePath} variant="ghost" size="sm" leftIcon={<ArrowRight className="size-3.5" aria-hidden="true" />}>
          View all
        </LinkButton>
      </CardHeader>
      {loading ? (
        <p className="px-5 py-7 text-center text-sm text-ink-muted" role="status">
          Loading activities…
        </p>
      ) : error ? (
        <p className="m-5 rounded-md border border-[#efc7c2] bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : activities.length ? (
        <div className="divide-y divide-line">
          {activities.map((activity) => {
            const date = dateParts(activity.starts_at)

            return (
              <article key={activity.id} className="flex gap-4 px-5 py-4">
                <div className="flex w-11 shrink-0 flex-col items-center border-r border-line pr-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-subtle">
                    {date.month}
                  </span>
                  <span className="tabular text-xl font-semibold text-brand-800">{date.day}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-subtle">
                    {activity.category.replace(/_/g, ' ')}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold leading-5 text-ink">
                    <Link to={`${basePath}/${activity.id}`} className="hover:text-brand-700">
                      {activity.title}
                    </Link>
                  </h3>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-muted">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3.5" aria-hidden="true" />
                      {date.time}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" aria-hidden="true" />
                      {activity.room?.name ?? activity.venue_name ?? 'Venue to be announced'}
                    </span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="Nothing scheduled yet"
          description="Upcoming activities for your audience will appear here."
          className="px-4"
        />
      )}
    </Card>
  )
}
