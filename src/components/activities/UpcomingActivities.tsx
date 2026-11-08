import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, MapPin, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { Card, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import { fetchActivities } from '@/services/api/activities'
import type { Activity } from '@/types/activity'
import { getApiErrorMessage } from '@/utils/apiError'

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Manila',
  }).format(new Date(value))
}

export function UpcomingActivities() {
  const { user } = useAuth()
  const role = user?.role === 'professor' ? 'professor' : 'student'
  const basePath = `/${role}/activities`
  const [activities, setActivities] = useState<Activity[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void fetchActivities({ status: 'upcoming', per_page: 3 })
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
  }, [])

  return (
    <Card className="mt-5 overflow-hidden">
      <CardHeader className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-coral-500" aria-hidden="true" />
            <h2 className="font-display text-base font-semibold text-ink">Upcoming activities</h2>
          </div>
          <p className="mt-1 text-xs text-ink-muted">Events for your audience</p>
        </div>
        <Link
          to={basePath}
          className="inline-flex items-center gap-1 text-xs font-semibold text-flow-700 hover:text-flow-800"
        >
          View all <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>
      {loading ? (
        <p className="px-5 py-7 text-center text-sm text-ink-muted" role="status">Loading activities…</p>
      ) : error ? (
        <p className="m-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>
      ) : activities.length ? (
        <div className="divide-y divide-line">
          {activities.map((activity) => (
            <UpcomingItem key={activity.id} activity={activity} basePath={basePath} />
          ))}
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

function UpcomingItem({ activity, basePath }: { activity: Activity; basePath: string }) {
  return (
    <article className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{activity.category.replace(/_/g, ' ')}</Badge>
        <Badge tone="warning">Upcoming</Badge>
      </div>
      <h3 className="mt-2 font-semibold text-ink">
        <Link to={`${basePath}/${activity.id}`} className="hover:text-flow-700">
          {activity.title}
        </Link>
      </h3>
      <p className="mt-1 text-xs text-ink-muted">
        <CalendarDays className="mr-1 inline size-3.5" aria-hidden="true" />
        {formatDate(activity.starts_at)}
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        <MapPin className="mr-1 inline size-3.5" aria-hidden="true" />
        {activity.room?.name ?? activity.venue_name ?? 'Venue details coming soon'}
      </p>
    </article>
  )
}
