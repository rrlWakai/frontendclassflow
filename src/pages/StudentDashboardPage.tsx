import { useEffect, useState } from 'react'
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  MapPin,
  Percent,
  UserRound,
} from 'lucide-react'
import { Alert } from '@/components/common/Alert'
import { Badge } from '@/components/common/Badge'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { LinkButton } from '@/components/common/LinkButton'
import { PageHeading } from '@/components/common/PageHeading'
import { AnnouncementFeed } from '@/components/announcements/AnnouncementFeed'
import { UpcomingActivities } from '@/components/activities/UpcomingActivities'
import { WeeklySchedule } from '@/components/scheduling/WeeklySchedule'
import { StudentScheduleConflicts } from '@/components/scheduling/StudentScheduleConflicts'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useSchedules } from '@/hooks/useSchedules'
import { fetchMyAttendanceSummary } from '@/services/api/attendance'
import type { OwnAttendanceSummary } from '@/types/attendance'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatLongDate } from '@/utils/format'
import {
  dayLabels,
  formatTimeRange,
  getManilaNow,
  instructorNames,
  nextClass,
  roomLabel,
  todaysSchedules,
} from '@/utils/schedule'

function attendanceRate(summary: OwnAttendanceSummary | null): number | null {
  if (!summary || summary.summary.total === 0) return null
  return Math.round((summary.summary.present / summary.summary.total) * 100)
}

export function StudentDashboardPage() {
  useDocumentTitle('Dashboard')
  const { user } = useAuth()
  const { schedules, loading: schedulesLoading, error: schedulesError } = useSchedules()
  const [attendanceSummary, setAttendanceSummary] = useState<OwnAttendanceSummary | null>(null)
  const [attendanceLoading, setAttendanceLoading] = useState(true)
  const [attendanceError, setAttendanceError] = useState<string | null>(null)
  const firstName = user?.name.split(' ')[0] ?? 'Student'
  const now = getManilaNow()
  const hour = Math.floor(now.minutes / 60)
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const upcoming = nextClass(schedules, now)
  const today = todaysSchedules(schedules, now)
  const rate = attendanceRate(attendanceSummary)

  useEffect(() => {
    let active = true
    void fetchMyAttendanceSummary({})
      .then((result) => {
        if (active) setAttendanceSummary(result)
      })
      .catch((failure: unknown) => {
        if (active) {
          setAttendanceError(getApiErrorMessage(failure, 'Unable to load attendance summary.'))
        }
      })
      .finally(() => {
        if (active) setAttendanceLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <PageHeading
        eyebrow="Student workspace"
        title={`${greeting}, ${firstName}.`}
        description={`${formatLongDate()} · Your timetable, attendance, and college notices in one place.`}
        actions={
          <LinkButton
            to="/student/attendance"
            leftIcon={<ClipboardCheck className="size-4" aria-hidden="true" />}
          >
            Attendance & QR check-in
          </LinkButton>
        }
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <Card className="overflow-hidden">
          <div className="border-b border-line bg-surface-subtle px-5 py-3">
            <p className="eyebrow">Up next</p>
          </div>
          <CardBody className="min-h-56">
            {schedulesLoading ? (
              <p role="status" className="py-12 text-center text-sm text-ink-muted">
                Reading your published timetable…
              </p>
            ) : schedulesError ? (
              <Alert tone="warning" title="Timetable unavailable">
                {schedulesError}
              </Alert>
            ) : upcoming ? (
              <div className="flex h-full flex-col justify-between gap-8">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={upcoming.inProgress ? 'success' : 'brand'}>
                      {upcoming.inProgress ? 'In progress' : 'Next class'}
                    </Badge>
                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-subtle">
                      {upcoming.startsInDays === 0
                        ? 'Today'
                        : upcoming.startsInDays === 1
                          ? 'Tomorrow'
                          : dayLabels[upcoming.schedule.day_of_week - 1]}
                    </span>
                  </div>
                  <p className="mt-4 text-2xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-3xl">
                    {upcoming.schedule.offering.subject.code} ·{' '}
                    {upcoming.schedule.offering.subject.title}
                  </p>
                  <p className="mt-2 text-sm text-ink-muted">
                    {upcoming.schedule.offering.section.code} ·{' '}
                    {upcoming.schedule.offering.academic_term.name}{' '}
                    {upcoming.schedule.offering.academic_term.academic_year}
                  </p>
                </div>
                <div className="grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-3">
                  <p className="flex items-start gap-2 text-ink">
                    <Clock3 className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden="true" />
                    <span className="tabular">
                      {formatTimeRange(
                        upcoming.schedule.start_time,
                        upcoming.schedule.end_time,
                      )}
                    </span>
                  </p>
                  <p className="flex items-start gap-2 text-ink">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden="true" />
                    {roomLabel(upcoming.schedule)}
                  </p>
                  <p className="flex items-start gap-2 text-ink">
                    <UserRound className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden="true" />
                    {instructorNames(upcoming.schedule) || 'Instructor to be assigned'}
                  </p>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming class"
                description="Published class meetings connected to your active enrollments will appear here."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Attendance</h2>
              <p className="mt-1 text-sm text-ink-muted">Your recorded sessions</p>
            </div>
            <Percent className="size-5 text-gold-700" aria-hidden="true" />
          </CardHeader>
          <CardBody>
            {attendanceLoading ? (
              <p role="status" className="py-8 text-center text-sm text-ink-muted">
                Loading attendance…
              </p>
            ) : attendanceError ? (
              <Alert tone="warning" title="Attendance unavailable">
                {attendanceError}
              </Alert>
            ) : attendanceSummary && attendanceSummary.summary.total > 0 && rate !== null ? (
              <>
                <p className="tabular text-4xl font-bold leading-none text-brand-800">
                  {rate}%
                </p>
                <p className="mt-2 text-sm text-ink-muted">
                  {attendanceSummary.summary.present} present of{' '}
                  {attendanceSummary.summary.total} recorded sessions
                </p>
                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-ink-muted">Present</dt>
                    <dd className="tabular font-semibold text-success">
                      {attendanceSummary.summary.present}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-ink-muted">Absent</dt>
                    <dd className="tabular font-semibold text-danger">
                      {attendanceSummary.summary.absent}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-ink-muted">Late</dt>
                    <dd className="tabular font-semibold text-warning">
                      {attendanceSummary.summary.late}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-ink-muted">Excused</dt>
                    <dd className="tabular font-semibold text-brand-700">
                      {attendanceSummary.summary.excused}
                    </dd>
                  </div>
                </dl>
                <LinkButton
                  to="/student/attendance"
                  variant="outline"
                  size="sm"
                  className="mt-5 w-full"
                  leftIcon={<ArrowRight className="size-4" aria-hidden="true" />}
                >
                  Review attendance
                </LinkButton>
              </>
            ) : (
              <EmptyState
                icon={ClipboardCheck}
                title="No attendance recorded"
                description="Your attendance status will appear after a professor submits a class session."
                action={
                  <LinkButton to="/student/attendance" variant="outline" size="sm">
                    Open attendance
                  </LinkButton>
                }
              />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(17rem,0.7fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">This week</h2>
              <p className="mt-1 text-sm text-ink-muted">Your published class timetable</p>
            </div>
            <Badge tone="neutral">
              {schedules.length} meeting{schedules.length === 1 ? '' : 's'}
            </Badge>
          </CardHeader>
          <WeeklySchedule
            schedules={schedules}
            loading={schedulesLoading}
            error={schedulesError}
            role="Student"
          />
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <h2 className="text-lg font-semibold text-ink">Today</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {dayLabels[now.dayOfWeek - 1]} · {formatLongDate()}
            </p>
          </CardHeader>
          {today.length ? (
            <ol className="divide-y divide-line">
              {today.map((schedule) => (
                <li key={schedule.id} className="px-5 py-4">
                  <p className="tabular text-xs font-semibold text-brand-700">
                    {formatTimeRange(schedule.start_time, schedule.end_time)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {schedule.offering.subject.code} · {schedule.offering.section.code}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {roomLabel(schedule)}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-semibold text-ink">No classes today</p>
              <p className="mt-1 text-sm leading-6 text-ink-muted">
                Check the weekly timetable for your next meeting.
              </p>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <AnnouncementFeed compact />
        <UpcomingActivities compact />
      </div>

      <div className="mt-5">
        <StudentScheduleConflicts compact />
      </div>
    </div>
  )
}
