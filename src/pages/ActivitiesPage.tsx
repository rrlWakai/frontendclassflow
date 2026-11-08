import { useEffect, useState } from 'react'
import { CalendarDays, MapPin, Search, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeading } from '@/components/common/PageHeading'
import { TextField } from '@/components/common/TextField'
import { useAuth } from '@/hooks/useAuth'
import { fetchActivities } from '@/services/api/activities'
import type {
  Activity,
  ActivityCategory,
  ActivityFilters,
  ActivityPagination,
  ActivityState,
} from '@/types/activity'
import { getApiErrorMessage } from '@/utils/apiError'

const categories: Array<{ value: ActivityCategory | ''; label: string }> = [
  { value: '', label: 'All categories' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'orientation', label: 'Orientation' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'competition', label: 'Competition' },
  { value: 'conference', label: 'Conference' },
  { value: 'research', label: 'Research' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'organization', label: 'Organization' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' },
]
const states: Array<{ value: ActivityState | ''; label: string }> = [
  { value: '', label: 'All activity dates' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Manila',
  }).format(new Date(value))
}

function activityTone(state: ActivityState): 'neutral' | 'warning' | 'success' | 'danger' {
  if (state === 'ongoing') return 'success'
  if (state === 'upcoming') return 'warning'
  if (state === 'cancelled') return 'danger'
  return 'neutral'
}

export function ActivitiesPage() {
  const { user } = useAuth()
  const role = user?.role === 'professor' ? 'professor' : 'student'
  const detailBase = `/${role}/activities`
  const [activities, setActivities] = useState<Activity[]>([])
  const [pagination, setPagination] = useState<ActivityPagination>({
    current_page: 1,
    last_page: 1,
    per_page: 25,
    total: 0,
  })
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ActivityCategory | ''>('')
  const [status, setStatus] = useState<ActivityState | ''>('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void fetchActivities({
      search: search || undefined,
      category: category || undefined,
      status: status || undefined,
      page,
      per_page: 25,
    } satisfies ActivityFilters)
      .then((result) => {
        if (active) {
          setActivities(result.activities)
          setPagination(result.pagination)
          setError(null)
        }
      })
      .catch((failure: unknown) => {
        if (active) setError(getApiErrorMessage(failure, 'Unable to load activities.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [category, page, search, status])

  function changePage(next: number) {
    setPage(next)
    setLoading(true)
    setError(null)
  }

  return (
    <>
      <PageHeading
        eyebrow={role === 'student' ? 'Student workspace' : 'Professor workspace'}
        title="CCS activities"
        description="Explore upcoming, ongoing, completed, and cancelled activities intended for your audience."
      />
      <Card className="mb-5">
        <form
          className="grid gap-3 p-5 md:grid-cols-[minmax(14rem,1fr)_12rem_12rem_auto]"
          onSubmit={(event) => {
            event.preventDefault()
            setPage(1)
            setSearch(searchInput.trim())
          }}
        >
          <TextField
            label="Search activities"
            value={searchInput}
            placeholder="Title, description, organizer"
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <div className="space-y-1.5">
            <label htmlFor="activities-category" className="block text-sm font-medium text-ink">Category</label>
            <select id="activities-category" value={category} onChange={(event) => { setPage(1); setCategory(event.target.value as ActivityCategory | '') }} className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm">
              {categories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="activities-state" className="block text-sm font-medium text-ink">Activity state</label>
            <select id="activities-state" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as ActivityState | '') }} className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm">
              {states.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="outline" leftIcon={<Search className="size-4" aria-hidden="true" />} className="w-full md:w-auto">Search</Button>
          </div>
        </form>
      </Card>
      {error ? (
        <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>
      ) : null}
      {loading ? (
        <Card><p role="status" className="px-5 py-10 text-center text-sm text-ink-muted">Loading activities…</p></Card>
      ) : activities.length ? (
        <>
          <div className="space-y-3">
            {activities.map((activity) => (
              <ActivityListCard key={activity.id} activity={activity} detailBase={detailBase} />
            ))}
          </div>
          {pagination.last_page > 1 ? (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3 text-sm">
              <span className="text-ink-muted">{pagination.total} activities · Page {page} of {pagination.last_page}</span>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => changePage(page - 1)}>Previous</Button>
                <Button type="button" size="sm" variant="outline" disabled={page >= pagination.last_page} onClick={() => changePage(page + 1)}>Next</Button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <Card>
          <EmptyState icon={Sparkles} title="No activities found" description="Published activities for your audience will appear here." />
        </Card>
      )}
    </>
  )
}

function ActivityListCard({ activity, detailBase }: { activity: Activity; detailBase: string }) {
  return (
    <article className="rounded-2xl border border-line bg-white p-5 shadow-[0_18px_50px_-42px_rgba(11,18,40,0.55)]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{activity.category.replace(/_/g, ' ')}</Badge>
        <Badge tone={activityTone(activity.activity_state)}>{activity.activity_state}</Badge>
      </div>
      <h2 className="mt-3 font-display text-lg font-semibold leading-6 text-ink">
        <Link to={`${detailBase}/${activity.id}`} className="hover:text-flow-700">{activity.title}</Link>
      </h2>
      <p className="mt-1 text-xs text-ink-muted">{activity.organizer_name}</p>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-ink-muted">{activity.summary || activity.description}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
        <span><CalendarDays className="mr-1 inline size-3.5" aria-hidden="true" />{formatDate(activity.starts_at)} – {formatDate(activity.ends_at)}</span>
        <span><MapPin className="mr-1 inline size-3.5" aria-hidden="true" />{activity.room?.name ?? activity.venue_name ?? 'Venue details coming soon'}</span>
      </div>
      {activity.status === 'cancelled' && activity.cancellation_reason ? (
        <p className="mt-3 text-sm text-red-700">Cancelled: {activity.cancellation_reason}</p>
      ) : null}
      <Link to={`${detailBase}/${activity.id}`} className="mt-4 inline-flex text-sm font-semibold text-flow-700 hover:text-flow-800">
        View activity
      </Link>
    </article>
  )
}
