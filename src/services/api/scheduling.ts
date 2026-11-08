import type { ApiSuccessResponse } from '@/types/api'
import type { MySchedule } from '@/types/scheduling'
import type { MyScheduleConflictPage } from '@/types/scheduling'
import { apiClient } from '@/services/api/client'

export async function fetchMySchedules(): Promise<MySchedule[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ schedules: MySchedule[] }>>('/schedules/me')

  return data.data.schedules
}

export async function fetchMyScheduleConflicts(): Promise<MyScheduleConflictPage> {
  const { data } = await apiClient.get<ApiSuccessResponse<MyScheduleConflictPage>>(
    '/student-schedule-conflicts/me',
  )

  return data.data
}
