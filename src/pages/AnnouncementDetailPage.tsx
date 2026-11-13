import { useEffect, useState } from 'react'
import { ArrowLeft, Megaphone } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { Card, CardBody } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeading } from '@/components/common/PageHeading'
import { useAuth } from '@/hooks/useAuth'
import { fetchAnnouncement } from '@/services/api/announcements'
import type { AnnouncementDetail } from '@/types/announcement'
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

type FetchState = {
  id: number | null
  announcement: AnnouncementDetail | null
  error: string | null
}

export function AnnouncementDetailPage() {
  const { announcementId } = useParams()
  const { user } = useAuth()
  const [fetchState, setFetchState] = useState<FetchState>({
    id: null,
    announcement: null,
    error: null,
  })
  const role = user?.role === 'professor' ? 'professor' : 'student'
  const listPath = `/${role}/announcements`
  const id = Number(announcementId)
  const valid = Number.isSafeInteger(id) && id >= 1

  useEffect(() => {
    if (!valid) return undefined

    let active = true
    void fetchAnnouncement(id)
      .then((result) => {
        if (active) {
          setFetchState({ id, announcement: result, error: null })
        }
      })
      .catch((failure: unknown) => {
        if (active) {
          setFetchState({
            id,
            announcement: null,
            error: getApiErrorMessage(failure, 'Unable to load this announcement.'),
          })
        }
      })

    return () => {
      active = false
    }
  }, [id, valid])

  if (!valid) {
    return (
      <>
        <PageHeading
          eyebrow="Announcements"
          title="Announcement unavailable"
          description="This announcement could not be found."
        />
        <Card>
          <EmptyState
            icon={Megaphone}
            title="This announcement is unavailable"
            description="This announcement could not be found."
            action={(
              <Link
                to={listPath}
                className="inline-flex h-11 items-center rounded-xl border border-line bg-white px-4 text-sm font-medium text-ink hover:border-flow-300 hover:bg-flow-50"
              >
                Back to announcements
              </Link>
            )}
          />
        </Card>
      </>
    )
  }

  const loading = fetchState.id !== id
  const announcement = loading ? null : fetchState.announcement
  const error = loading ? null : fetchState.error

  if (loading) {
    return (
      <Card>
        <p className="px-5 py-10 text-center text-sm text-ink-muted" role="status">
          Loading announcement…
        </p>
      </Card>
    )
  }

  if (error || !announcement) {
    return (
      <>
        <PageHeading
          eyebrow="Announcements"
          title="Announcement unavailable"
          description={error ?? 'It may have expired or may not be targeted to your account.'}
        />
        <Card>
          <EmptyState
            icon={Megaphone}
            title="This announcement is unavailable"
            description={error ?? 'It may have expired or may not be targeted to your account.'}
            action={(
              <Link
                to={listPath}
                className="inline-flex h-11 items-center rounded-xl border border-line bg-white px-4 text-sm font-medium text-ink hover:border-flow-300 hover:bg-flow-50"
              >
                Back to announcements
              </Link>
            )}
          />
        </Card>
      </>
    )
  }

  return (
    <>
      <div className="mb-6">
        <Link
          to={listPath}
          className="inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-flow-700 hover:text-flow-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flow-600"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All announcements
        </Link>
      </div>
      <PageHeading
        eyebrow="Announcement"
        title={announcement.title}
        description="View the full announcement details."
      />
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{formatLabel(announcement.category)}</Badge>
            {announcement.priority !== 'normal' ? (
              <Badge tone={announcement.priority === 'urgent' ? 'danger' : 'warning'}>
                {formatLabel(announcement.priority)}
              </Badge>
            ) : null}
          </div>
          <p className="mt-3 text-sm text-ink-muted">
            {announcement.author.name} · {formatDate(announcement.published_at)}
          </p>
          {announcement.summary ? (
            <p className="mt-6 border-l-2 border-flow-400 pl-4 text-base font-medium leading-7 text-ink">
              {announcement.summary}
            </p>
          ) : null}
          <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-ink">
            {announcement.content}
          </div>
          {announcement.expires_at ? (
            <p className="mt-6 border-t border-line pt-4 text-xs text-ink-muted">
              Available until {formatDate(announcement.expires_at)}
            </p>
          ) : null}
        </CardBody>
      </Card>
    </>
  )
}
