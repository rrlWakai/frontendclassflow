import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Megaphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { LinkButton } from '@/components/common/LinkButton'
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

function AnnouncementItem({
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
    <article className="px-5 py-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-subtle">
          {formatLabel(announcement.category)}
        </p>
        {announcement.priority !== 'normal' ? (
          <Badge tone={priorityTone}>{formatLabel(announcement.priority)}</Badge>
        ) : null}
        <span className="text-xs text-ink-muted">{formatDate(announcement.published_at)}</span>
      </div>
      <h3 className="mt-2 text-lg font-semibold leading-6 text-ink">
        <Link
          to={`${detailBase}/${announcement.id}`}
          className="rounded-sm hover:text-brand-700"
        >
          {announcement.title}
        </Link>
      </h3>
      <p className="mt-1 text-xs text-ink-muted">By {announcement.author.name}</p>
      {announcement.summary ? (
        <p className="mt-2 text-sm leading-6 text-ink">{announcement.summary}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Link
          to={`${detailBase}/${announcement.id}`}
          className="text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          Read announcement
        </Link>
        {announcement.expires_at ? (
          <span className="text-xs text-ink-muted">
            Available until {formatDate(announcement.expires_at)}
          </span>
        ) : null}
      </div>
    </article>
  )
}

export function AnnouncementFeed({ compact = false }: { compact?: boolean }) {
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

  const visible = compact ? announcements.slice(0, 3) : announcements

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="size-4 text-brand-700" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-ink">
              {compact ? 'Recent announcements' : 'College announcements'}
            </h2>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            Current notices for your role and classes
          </p>
        </div>
        {compact ? (
          <LinkButton to={`${detailBase}`} variant="ghost" size="sm">
            View all
          </LinkButton>
        ) : null}
      </CardHeader>
      {loading ? (
        <p className="px-5 py-8 text-center text-sm text-ink-muted" role="status">
          Loading announcements…
        </p>
      ) : error ? (
        <p className="m-5 rounded-md border border-[#efc7c2] bg-danger-soft px-3 py-2.5 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : visible.length ? (
        <>
          <div className="divide-y divide-line">
            {visible.map((announcement) => (
              <AnnouncementItem
                key={announcement.id}
                announcement={announcement}
                detailBase={detailBase}
              />
            ))}
          </div>
          {!compact && pagination.last_page > 1 ? (
            <div className="flex items-center justify-between border-t border-line px-5 py-3">
              <p className="text-xs text-ink-muted">
                Page {pagination.current_page} of {pagination.last_page}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Previous announcements page"
                  disabled={page <= 1}
                  onClick={() => changePage(Math.max(1, page - 1))}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </Button>
                <Button
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
