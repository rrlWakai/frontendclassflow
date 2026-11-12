import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Megaphone } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeading } from '@/components/common/PageHeading'
import { fetchAnnouncements } from '@/services/api/announcements'
import type {
  AnnouncementFeedItem,
  AnnouncementFeedPagination,
} from '@/types/announcement'
import { getApiErrorMessage } from '@/utils/apiError'

type ClassFlowRole = 'student' | 'professor'

interface AnnouncementsPageProps {
  role: ClassFlowRole
}

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

function AnnouncementListCard({
  announcement,
  detailBase,
}: {
  announcement: AnnouncementFeedItem
  detailBase: string
}) {
  return (
    <article className="rounded-2xl border border-line bg-white p-5 shadow-[0_18px_50px_-42px_rgba(11,18,40,0.55)]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{formatLabel(announcement.category)}</Badge>
        {announcement.priority !== 'normal' ? (
          <Badge tone={announcement.priority === 'urgent' ? 'danger' : 'warning'}>
            {formatLabel(announcement.priority)}
          </Badge>
        ) : null}
      </div>
      <h2 className="mt-3 text-lg font-semibold leading-6 text-ink">
        <Link
          to={`${detailBase}/${announcement.id}`}
          className="rounded-sm hover:text-flow-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flow-600"
        >
          {announcement.title}
        </Link>
      </h2>
      <p className="mt-1 text-xs text-ink-muted">
        {announcement.author.name} · {formatDate(announcement.published_at)}
      </p>
      {announcement.summary ? (
        <p className="mt-3 text-sm font-medium leading-6 text-ink">{announcement.summary}</p>
      ) : null}
      <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-ink-muted">
        {announcement.content}
      </p>
      <Link
        to={`${detailBase}/${announcement.id}`}
        className="mt-4 inline-flex rounded-sm text-sm font-semibold text-flow-700 hover:text-flow-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flow-600"
      >
        Read announcement
      </Link>
    </article>
  )
}

function AnnouncementsPage({ role }: AnnouncementsPageProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementFeedItem[]>([])
  const [pagination, setPagination] = useState<AnnouncementFeedPagination>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const detailBase = `/${role}/announcements`

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
    setPage(nextPage)
    setLoading(true)
    setError(null)
  }

  return (
    <>
      <PageHeading
        title="Announcements"
      />
      {error ? (
        <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? (
        <Card>
          <p className="px-5 py-10 text-center text-sm text-ink-muted" role="status">
            Loading announcements…
          </p>
        </Card>
      ) : announcements.length ? (
        <>
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <AnnouncementListCard
                key={announcement.id}
                announcement={announcement}
                detailBase={detailBase}
              />
            ))}
          </div>
          {pagination.last_page > 1 ? (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3 text-sm">
              <span className="text-ink-muted">
                {pagination.total} announcements · Page {pagination.current_page} of {pagination.last_page}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label="Previous page"
                  disabled={page <= 1}
                  onClick={() => changePage(Math.max(1, page - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label="Next page"
                  disabled={page >= pagination.last_page}
                  onClick={() => changePage(Math.min(pagination.last_page, page + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <Card>
          <EmptyState
            icon={Megaphone}
            title="No announcements"
            description="Published notices will appear here."
          />
        </Card>
      )}
    </>
  )
}

export function StudentAnnouncementsPage() {
  return <AnnouncementsPage role="student" />
}

export function ProfessorAnnouncementsPage() {
  return <AnnouncementsPage role="professor" />
}
