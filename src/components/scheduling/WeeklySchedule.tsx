import { CalendarDays, Clock3, MapPin, UserRound } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Card } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import type { MySchedule } from '@/types/scheduling'

const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function todayDayOfWeek(): number {
  const day = new Date().getDay()
  return day === 0 ? 7 : day
}

interface WeeklyScheduleProps {
  schedules: MySchedule[]
  loading: boolean
  error: string | null
  role: 'Professor' | 'Student'
}

export function WeeklySchedule({ schedules, loading, error, role }: WeeklyScheduleProps) {
  if (loading) {
    return <Card className="p-8 text-center text-sm text-ink-muted">Loading your published schedule…</Card>
  }

  if (error) {
    return (
      <Card className="p-5" role="alert">
        <p className="text-sm font-semibold text-red-700">Schedule unavailable</p>
        <p className="mt-1 text-sm text-ink-muted">{error}</p>
      </Card>
    )
  }

  if (schedules.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={CalendarDays}
          title="No published classes yet"
          description="Published class meetings connected to your account will appear here."
        />
      </Card>
    )
  }

  const sorted = [...schedules].sort((a, b) =>
    a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time),
  )

  return (
    <div className="space-y-3">
      {sorted.map((schedule) => {
        const room = schedule.room_allocations.find((allocation) => allocation.status === 'active')?.room
        const instructors = schedule.assignments
          .filter((assignment) => assignment.status === 'active')
          .map((assignment) => assignment.professor.name)
          .join(', ')

        return (
          <Card key={schedule.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-semibold text-ink">
                {schedule.offering.subject.code} · {schedule.offering.subject.title}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {schedule.offering.section.code} · {schedule.offering.academic_term.name} {schedule.offering.academic_term.academic_year}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-muted">
                {role === 'Student' && instructors ? <span className="inline-flex items-center gap-1.5"><UserRound className="size-3.5" aria-hidden="true" />{instructors}</span> : null}
                <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" aria-hidden="true" />{room ? `${room.code}${room.building ? ` · ${room.building}` : ''}` : schedule.modality.replaceAll('_', ' ')}</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-ink">{dayLabels[schedule.day_of_week - 1]}{schedule.day_of_week === todayDayOfWeek() ? <Badge tone="coral" className="ml-2">Today</Badge> : null}</p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-ink-muted"><Clock3 className="size-3.5" aria-hidden="true" />{schedule.start_time}–{schedule.end_time}</p>
              </div>
              <Badge tone={schedule.modality === 'online' ? 'flow' : 'neutral'}>{schedule.modality.replaceAll('_', ' ')}</Badge>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
