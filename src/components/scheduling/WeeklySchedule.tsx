import { CalendarDays, Clock3, MapPin, UserRound } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { EmptyState } from '@/components/common/EmptyState'
import type { MySchedule } from '@/types/scheduling'
import {
  dayLabels,
  formatTimeRange,
  getManilaNow,
  instructorNames,
  roomLabel,
} from '@/utils/schedule'
import { cn } from '@/utils/cn'

interface WeeklyScheduleProps {
  schedules: MySchedule[]
  loading: boolean
  error: string | null
  role: 'Professor' | 'Student'
  className?: string
}

export function WeeklySchedule({ schedules, loading, error, role, className }: WeeklyScheduleProps) {
  if (loading) {
    return (
      <p role="status" className={cn('px-5 py-10 text-center text-sm text-ink-muted', className)}>
        Loading your published timetable…
      </p>
    )
  }

  if (error) {
    return (
      <div role="alert" className={cn('px-5 py-8', className)}>
        <p className="text-sm font-semibold text-danger">Schedule unavailable</p>
        <p className="mt-1 text-sm leading-6 text-ink-muted">{error}</p>
      </div>
    )
  }

  if (schedules.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No published classes yet"
        description="Published class meetings connected to your account will appear here."
        className={className}
      />
    )
  }

  const today = getManilaNow().dayOfWeek
  const grouped = dayLabels
    .map((label, index) => ({
      day: index + 1,
      label,
      meetings: schedules
        .filter((schedule) => schedule.day_of_week === index + 1)
        .sort((left, right) => left.start_time.localeCompare(right.start_time)),
    }))
    .filter((group) => group.meetings.length > 0)

  return (
    <div className={cn('divide-y divide-line', className)}>
      {grouped.map(({ day, label, meetings }) => {
        const isToday = day === today

        return (
          <section
            key={day}
            className={cn('grid gap-3 px-5 py-4 sm:grid-cols-[7.5rem_minmax(0,1fr)]', isToday && 'bg-brand-50/60')}
            aria-labelledby={`schedule-day-${day}`}
          >
            <div>
              <h3
                id={`schedule-day-${day}`}
                className={cn(
                  'text-sm font-semibold',
                  isToday ? 'text-brand-800' : 'text-ink',
                )}
              >
                {label}
              </h3>
              {isToday ? (
                <span className="mt-1 inline-block text-xs font-semibold uppercase tracking-[0.1em] text-gold-700">
                  Today
                </span>
              ) : (
                <span className="mt-1 block text-xs text-ink-subtle">
                  {meetings.length} meeting{meetings.length === 1 ? '' : 's'}
                </span>
              )}
            </div>

            <ol className="space-y-2">
              {meetings.map((schedule) => {
                const instructor = instructorNames(schedule)

                return (
                  <li
                    key={schedule.id}
                    className="grid gap-2 border-l-2 border-line pl-3 sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:items-center"
                  >
                    <p className="tabular text-xs font-semibold text-ink-muted">
                      {formatTimeRange(schedule.start_time, schedule.end_time)}
                    </p>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">
                        {schedule.offering.subject.code} · {schedule.offering.subject.title}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {schedule.offering.section.code} · {schedule.offering.academic_term.name}{' '}
                        {schedule.offering.academic_term.academic_year}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-muted">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" aria-hidden="true" />
                          {roomLabel(schedule)}
                        </span>
                        {role === 'Student' && instructor ? (
                          <span className="inline-flex items-center gap-1">
                            <UserRound className="size-3.5" aria-hidden="true" />
                            {instructor}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <Badge tone={schedule.modality === 'online' ? 'info' : 'neutral'}>
                      {schedule.modality.replaceAll('_', ' ')}
                    </Badge>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
      <p className="flex items-center gap-2 px-5 py-3 text-xs text-ink-muted">
        <Clock3 className="size-3.5" aria-hidden="true" />
        All times are in Asia/Manila.
      </p>
    </div>
  )
}
