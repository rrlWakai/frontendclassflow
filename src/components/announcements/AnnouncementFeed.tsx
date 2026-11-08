import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Megaphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import { fetchAnnouncements } from '@/services/api/announcements'
import type {
  AnnouncementFeedItem,
  AnnouncementFeedPagination,
} from '@/types/announcement'
import { getApiErrorMessage } from '@/utils/apiError'

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value: string | null): string {
  if (!value) return 'Recently published'

  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Manila',
  }).format(new Date(value))
}

function AnnouncementCard({
  announcement,
  detailBase,
}: {
  announcement: AnnouncementFeedItem
  detailBase: string
}) {
  const priorityTone = announcement.priority === 'urgent'
    ? 'danger'
    : announcement.priority === 'important'
      ? 'warning'
      : 'neutral'

  return (
    <article className="border-b border-line px-5 py-5 last:border-0">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{formatLabel(announcement.category)}</Badge>
        {announcement.priority !== 'normal' ? (
          <Badge tone={priorityTone}>{formatLabel(announcement.priority)}</Badge>
        ) : null}
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold leading-6 text-ink">
        <Link
          to={`${detailBase}/${announcement.id}`}
          className="rounded-sm hover:text-flow-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flow-600"
        >
          {announcement.title}
        </Link>
      </h3>
      <p className="mt-1 text-xs text-ink-muted">
        {announcement.author.name} · {formatDate(announcement.published_at)}
      </p>
      {announcement.summary ? (
        <p className="mt-3 text-sm font-medium leading-6 text-ink">{announcement.summary}</p>
      ) : null}
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-muted">
        {announcement.content}
      </p>
      {announcement.expires_at ? (
        <p className="mt-3 text-xs text-ink-muted">
          Available until {formatDate(announcement.expires_at)}
        </p>
      ) : null}
      <Link
        to={`${detailBase}/${announcement.id}`}
        className="mt-3 inline-flex rounded-sm text-sm font-semibold text-flow-700 hover:text-flow-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flow-600"
      >
        Read announcement
      </Link>
    </article>
  )
}

export function AnnouncementFeed() {
  const { user } = useAuth()
  const detailBase = user?.role === 'professor'
    ? '/professor/announcements'
    : '/student/announcements'
  const [announcements, setAnnouncements] = useState<AnnouncementFeedItem[]>([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<AnnouncementFeedPagination>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void fetchAnnouncements(page)
      .then((result) => {
        if (active) {
          setAnnouncements(result.announcements)
          setPagination(result.pagination)
          setError(null)
        }
      })
      .catch((failure: unknown) => {
        if (active) setError(getApiErrorMessage(failure, 'Unable to load announcements.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [page])

  function changePage(nextPage: number) {
    setLoading(true)
    setError(null)
    setPage(nextPage)
  }

  return (
    <Card className="mt-5 overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Megaphone className="size-4 text-flow-600" aria-hidden="true" />
          <h2 className="font-display text-base font-semibold text-ink">College announcements</h2>
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          Current notices for your role and enrolled or assigned classes
        </p>
      </CardHeader>
      {loading ? (
        <p className="px-5 py-8 text-center text-sm text-ink-muted" role="status">
          Loading announcements…
        </p>
      ) : error ? (
        <p className="m-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : announcements.length ? (
        <>
          <div>
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                detailBase={detailBase}
              />
            ))}
          </div>
          {pagination.last_page > 1 ? (
            <div className="flex items-center justify-between border-t border-line px-5 py-3">
              <p className="text-xs text-ink-muted">
                Page {pagination.current_page} of {pagination.last_page}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label="Previous announcements page"
                  disabled={page <= 1}
                  onClick={() => changePage(Math.max(1, page - 1))}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label="Next announcements page"
                  disabled={page >= pagination.last_page}
                  onClick={() => changePage(Math.min(pagination.last_page, page + 1))}
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState
          icon={Megaphone}
          title="No current announcements"
          description="Published notices for your audience will appear here."
          className="px-4"
        />
      )}
    </Card>
  )
}
