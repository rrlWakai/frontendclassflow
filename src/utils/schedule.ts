import type { MySchedule } from '@/types/scheduling'

export const dayLabels = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

export const dayShortLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const weekdayNumbers: Record<string, number> = {
  Sun: 7,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

export interface ManilaNow {
  dayOfWeek: number
  minutes: number
  dateKey: string
}

export function getManilaNow(reference = new Date()): ManilaNow {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(reference)

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    dayOfWeek: weekdayNumbers[values.weekday] ?? 1,
    minutes: Number(values.hour) * 60 + Number(values.minute),
    dateKey: `${values.year}-${values.month}-${values.day}`,
  }
}

export function timeToMinutes(value: string): number {
  const [hours = '0', minutes = '0'] = value.split(':')
  return Number(hours) * 60 + Number(minutes)
}

export function formatTime(value: string): string {
  const [hourText = '0', minuteText = '00'] = value.split(':')
  const hour = Number(hourText)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12

  return `${displayHour}:${minuteText.slice(0, 2)} ${suffix}`
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}

export function roomLabel(schedule: MySchedule): string {
  const allocation = schedule.room_allocations.find((item) => item.status === 'active')

  if (!allocation) {
    return schedule.modality === 'online' ? 'Online' : 'Room to be assigned'
  }

  return `${allocation.room.code}${allocation.room.building ? ` · ${allocation.room.building}` : ''}`
}

export function instructorNames(schedule: MySchedule): string {
  return schedule.assignments
    .filter((assignment) => assignment.status === 'active')
    .map((assignment) => assignment.professor.name)
    .join(', ')
}

export interface NextClass {
  schedule: MySchedule
  inProgress: boolean
  startsInDays: number
}

export function nextClass(schedules: MySchedule[], now = getManilaNow()): NextClass | null {
  let best: NextClass | null = null

  schedules.forEach((schedule) => {
    const start = timeToMinutes(schedule.start_time)
    const end = timeToMinutes(schedule.end_time)
    let dayDelta = (schedule.day_of_week - now.dayOfWeek + 7) % 7

    if (dayDelta === 0 && end <= now.minutes) {
      dayDelta = 7
    }

    const candidate: NextClass = {
      schedule,
      inProgress: dayDelta === 0 && start <= now.minutes && now.minutes <= end,
      startsInDays: dayDelta,
    }

    if (
      best === null ||
      candidate.startsInDays < best.startsInDays ||
      (candidate.startsInDays === best.startsInDays &&
        timeToMinutes(candidate.schedule.start_time) < timeToMinutes(best.schedule.start_time))
    ) {
      best = candidate
    }
  })

  return best
}

export function todaysSchedules(schedules: MySchedule[], now = getManilaNow()): MySchedule[] {
  return schedules
    .filter((schedule) => schedule.day_of_week === now.dayOfWeek)
    .sort((left, right) => left.start_time.localeCompare(right.start_time))
}
