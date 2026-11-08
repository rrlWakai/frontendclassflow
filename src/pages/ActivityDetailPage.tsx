import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, MapPin, Sparkles } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { Card, CardBody } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeading } from '@/components/common/PageHeading'
import { useAuth } from '@/hooks/useAuth'
import { fetchActivity } from '@/services/api/activities'
import type { Activity } from '@/types/activity'
import { getApiErrorMessage } from '@/utils/apiError'

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Manila',
  }).format(new Date(value))
}

export function ActivityDetailPage() {
  const { activityId } = useParams()
  const { user } = useAuth()
  const role = user?.role === 'professor' ? 'professor' : 'student'
  const listPath = `/${role}/activities`
  const id = Number(activityId)
  const [loadedActivity, setLoadedActivity] = useState<{ id: number; activity: Activity } | null>(null)
  const [loadError, setLoadError] = useState<{ id: number; message: string } | null>(null)

  useEffect(() => {
    let active = true
    if (!Number.isSafeInteger(id) || id < 1) {
      return
    }

    void fetchActivity(id)
      .then((result) => {
        if (active) setLoadedActivity({ id, activity: result })
      })
      .catch((failure: unknown) => {
        if (active) {
          setLoadError({ id, message: getApiErrorMessage(failure, 'Unable to load this activity.') })
        }
      })

    return () => {
      active = false
    }
  }, [id])

  const activity = loadedActivity?.id === id ? loadedActivity.activity : null
  const error = !Number.isSafeInteger(id) || id < 1
    ? 'This activity could not be found.'
    : loadError?.id === id
      ? loadError.message
      : null
  const loading = error === null && activity === null

  if (loading) {
    return <Card><p role="status" className="px-5 py-10 text-center text-sm text-ink-muted">Loading activity…</p></Card>
  }

  if (error || !activity) {
    return (
      <>
        <PageHeading eyebrow="Activities" title="Activity unavailable" />
        <Card>
          <EmptyState
            icon={Sparkles}
            title="This activity is unavailable"
            description={error ?? 'It may not be published or may not be intended for your account.'}
            action={(
              <Link to={listPath} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-flow-700">
                Back to activities
              </Link>
            )}
          />
        </Card>
      </>
    )
  }

  return (
    <>
      <Link to={listPath} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-flow-700 hover:text-flow-800">
        <ArrowLeft className="size-4" aria-hidden="true" />
        All activities
      </Link>
      <PageHeading eyebrow="CCS activity" title={activity.title} />
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{activity.category.replace(/_/g, ' ')}</Badge>
            <Badge tone={activity.activity_state === 'cancelled' ? 'danger' : activity.activity_state === 'ongoing' ? 'success' : activity.activity_state === 'upcoming' ? 'warning' : 'neutral'}>
              {activity.activity_state}
            </Badge>
          </div>
          {activity.summary ? (
            <p className="mt-5 border-l-2 border-flow-400 pl-4 text-base font-medium leading-7 text-ink">
              {activity.summary}
            </p>
          ) : null}
          <div className="mt-5 space-y-3 border-y border-line py-4 text-sm text-ink-muted">
            <p><CalendarDays className="mr-2 inline size-4" aria-hidden="true" />{formatDate(activity.starts_at)} – {formatDate(activity.ends_at)}</p>
            <p><MapPin className="mr-2 inline size-4" aria-hidden="true" />{activity.room ? `${activity.room.code} · ${activity.room.name}` : activity.venue_name ?? 'Venue details coming soon'}{activity.location_details ? ` · ${activity.location_details}` : ''}</p>
            <p><Sparkles className="mr-2 inline size-4" aria-hidden="true" />Organized by {activity.organizer_name}</p>
            <p>Audience: {activity.audience_summary}</p>
          </div>
          <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-ink">{activity.description}</div>
          {activity.status === 'cancelled' ? (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">This activity has been cancelled.</p>
              {activity.cancellation_reason ? <p className="mt-1">{activity.cancellation_reason}</p> : null}
              {activity.cancelled_at ? <p className="mt-2 text-xs">Updated {formatDate(activity.cancelled_at)}</p> : null}
            </div>
          ) : null}
        </CardBody>
      </Card>
    </>
  )
}
