import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  CalendarDays,
  Clock,
  Percent,
  Sparkles,
} from 'lucide-react'
import { ApiStatusCard } from '@/components/common/ApiStatusCard'
import { Badge } from '@/components/common/Badge'
import { Card, CardHeader } from '@/components/common/Card'
import { PageHeading } from '@/components/common/PageHeading'
import { AnnouncementFeed } from '@/components/announcements/AnnouncementFeed'
import { UpcomingActivities } from '@/components/activities/UpcomingActivities'
import { WeeklySchedule } from '@/components/scheduling/WeeklySchedule'
import { StudentScheduleConflicts } from '@/components/scheduling/StudentScheduleConflicts'
import { useAuth } from '@/hooks/useAuth'
import { useSchedules } from '@/hooks/useSchedules'
import { fetchMyAttendanceSummary } from '@/services/api/attendance'
import type { OwnAttendanceSummary } from '@/types/attendance'
import { getApiErrorMessage } from '@/utils/apiError'
import { cn } from '@/utils/cn'
import { formatLongDate } from '@/utils/format'

interface OverviewItem {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  tone: string
}

const overview: OverviewItem[] = [
  {
    label: 'Enrolled classes',
    value: '0',
    hint: 'This semester',
    icon: BookOpen,
    tone: 'bg-coral-100 text-coral-600',
  },
  {
    label: 'Next class',
    value: '—',
    hint: 'Nothing scheduled',
    icon: CalendarDays,
    tone: 'bg-flow-50 text-flow-700',
  },
  {
    label: 'Attendance',
    value: '—',
    hint: 'No sessions yet',
    icon: Percent,
    tone: 'bg-indigo-50 text-indigo-700',
  },
]

export function StudentDashboardPage() {
  const { user } = useAuth()
  const { schedules, loading: schedulesLoading, error: schedulesError } = useSchedules()
  const [attendanceSummary, setAttendanceSummary] = useState<OwnAttendanceSummary | null>(null)
  const [attendanceError, setAttendanceError] = useState<string | null>(null)
  const firstName = user?.name.split(' ')[0] ?? 'Student'

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

    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <PageHeading
        eyebrow="Student workspace"
        title={`Hi, ${firstName}.`}
        description="Your published class schedule is limited to offerings where you are actively enrolled. Student academic workflows will follow in a later stage."
        actions={<Badge tone="coral">Student</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {overview.map((item) => {
          const Icon = item.icon

          return (
            <Card key={item.label} className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                  {item.label}
                </p>
                <span
                  className={cn(
                    'flex size-9 items-center justify-center rounded-xl',
                    item.tone,
                  )}
                >
                  <Icon className="size-[18px]" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
                {item.label === 'Enrolled classes'
                  ? schedules.length.toString()
                  : item.label === 'Next class' && schedules.length
                    ? schedules[0].start_time
                    : item.label === 'Attendance' && attendanceSummary?.summary.total
                      ? `${Math.round(
                          (attendanceSummary.summary.present / attendanceSummary.summary.total) * 100,
                        )}%`
                    : item.value}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {item.label === 'Attendance'
                  ? attendanceError
                    ? attendanceError
                    : attendanceSummary?.summary.total
                      ? `${attendanceSummary.summary.present} of ${attendanceSummary.summary.total} recorded sessions present`
                      : item.hint
                  : item.hint}
              </p>
            </Card>
          )
        })}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card className="relative overflow-hidden bg-night-950 p-6 text-white">
          <div
            className="absolute -right-16 -top-16 size-56 rounded-full bg-coral-500/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-20 left-10 size-48 rounded-full bg-flow-500/15 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative">
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-coral-300">
                <Sparkles className="size-3" aria-hidden="true" />
                Today&apos;s flow
              </span>
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                {schedules.length ? `${schedules.length} scheduled` : 'No classes'}
              </span>
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-flow-300">
              {formatLongDate()}
            </p>
            <h2 className="mt-3 max-w-md font-display text-2xl font-semibold leading-snug tracking-[-0.02em]">
            {schedules.length ? `${schedules[0].offering.subject.code} · ${schedules[0].offering.subject.title}` : 'Your published timetable will appear here.'}
            </h2>
            <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-white/45">
              <Clock className="size-3.5" aria-hidden="true" />
              {schedules.length ? `${schedules[0].offering.section.code} · ${schedules[0].start_time}–${schedules[0].end_time}` : 'Your enrolled offerings will appear after schedules are published.'}
            </div>
          </div>
        </Card>

        <ApiStatusCard />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">This week</h2>
              <p className="mt-0.5 text-xs text-ink-muted">Upcoming classes and sessions</p>
            </div>
            <Badge tone={schedules.length ? 'success' : 'neutral'}>{schedules.length ? `${schedules.length} classes` : 'Empty'}</Badge>
          </CardHeader>
          <WeeklySchedule schedules={schedules} loading={schedulesLoading} error={schedulesError} role="Student" />
        </Card>

        <Card className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            What to expect
          </p>
          <ul className="mt-4 space-y-3.5">
            {[
              'Published classes for your active enrollments',
              'Weekly meeting times and room assignments',
              'Professor names without exposing private contact details',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-ink">
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-coral-400"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-4 text-xs leading-5 text-ink-muted">
            Schedules are read-only here and are limited to your enrolled offerings.
          </p>
        </Card>
      </div>

      <AnnouncementFeed />
      <UpcomingActivities />
      <StudentScheduleConflicts />
    </div>
  )
}
