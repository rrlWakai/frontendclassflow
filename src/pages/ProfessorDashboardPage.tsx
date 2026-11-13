import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  ClipboardCheck,
  Clock,
  Users,
} from 'lucide-react'
import { ApiStatusCard } from '@/components/common/ApiStatusCard'
import { Badge } from '@/components/common/Badge'
import { Card, CardHeader } from '@/components/common/Card'
import { PageHeading } from '@/components/common/PageHeading'
import { AnnouncementFeed } from '@/components/announcements/AnnouncementFeed'
import { UpcomingActivities } from '@/components/activities/UpcomingActivities'
import { WeeklySchedule } from '@/components/scheduling/WeeklySchedule'
import { useAuth } from '@/hooks/useAuth'
import { useSchedules } from '@/hooks/useSchedules'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { formatLongDate } from '@/utils/format'
import { getManilaNow } from '@/utils/schedule'

interface StatItem {
  label: string
  value: string
  icon: LucideIcon
  tone: string
}

const stats: StatItem[] = [
  {
    label: 'Active classes',
    value: '0',
    icon: BookOpen,
    tone: 'bg-flow-50 text-flow-700',
  },
  {
    label: 'Students',
    value: '0',
    icon: Users,
    tone: 'bg-indigo-50 text-indigo-700',
  },
  {
    label: 'Attendance captured',
    value: '—',
    icon: ClipboardCheck,
    tone: 'bg-coral-100 text-coral-600',
  },
]

export function ProfessorDashboardPage() {
  const { user } = useAuth()
  const { schedules, loading: schedulesLoading, error: schedulesError } = useSchedules()
  const navigate = useNavigate()
  const firstName = user?.name.split(' ')[0] ?? 'Professor'
  const now = getManilaNow()
  const hour = Math.floor(now.minutes / 60)
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const todayDay = new Date().getDay()
  const todayDayOfWeek = todayDay === 0 ? 7 : todayDay
  const todaysSchedules = schedules
    .filter((schedule) => schedule.day_of_week === todayDayOfWeek)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
  return (
    <div>
      <PageHeading
        variant="dashboard"
        title={`${greeting}, ${firstName}.`}
        highlightName={firstName}
        description="Your teaching overview, all in one place."
        actions={<Badge tone="flow">Faculty</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                  {stat.label}
                </p>
                <span
                  className={cn(
                    'flex size-9 items-center justify-center rounded-xl',
                    stat.tone,
                  )}
                >
                  <Icon className="size-[18px]" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">
                {stat.label === 'Active classes' ? schedules.length.toString() : stat.value}
              </p>
            </Card>
          )
        })}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
<Card>
        <CardHeader className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-ink">Teaching queue</h2>
          <Badge tone={schedules.length ? 'success' : 'neutral'}>{schedules.length} classes</Badge>
        </CardHeader>
        <WeeklySchedule schedules={schedules} loading={schedulesLoading} error={schedulesError} role="Professor" />
      </Card>

      <div className="space-y-5">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
              Today
            </p>
            <Clock className="size-4 text-flow-600" aria-hidden="true" />
          </div>
          <p className="mt-3 text-lg font-semibold leading-7 text-ink">
            {formatLongDate()}
          </p>
            {todaysSchedules.length ? (
              <>
                <p className="mt-2 text-sm text-ink-muted">
                  {todaysSchedules.length} class meeting{todaysSchedules.length === 1 ? '' : 's'} scheduled today.
                </p>
                <ul className="mt-3 space-y-2">
                  {todaysSchedules.map((schedule) => (
                    <li key={schedule.id} className="flex items-center justify-between gap-3 rounded-lg border border-line p-3">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">
                          {schedule.offering.subject.code} · {schedule.offering.section.code}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {schedule.start_time}–{schedule.end_time}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/professor/attendance')}
                        className="text-sm font-medium text-flow-600 hover:text-flow-700 underline-offset-4 hover:underline"
                      >
                        Take attendance
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-2 text-xs leading-5 text-ink-muted">
                No class meetings scheduled for today.
              </p>
            )}
          </Card>

          <ApiStatusCard />
        </div>
      </div>

      <AnnouncementFeed />
      <UpcomingActivities />
    </div>
  )
}
