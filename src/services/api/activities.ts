import type { ApiSuccessResponse } from '@/types/api'
import type {
  Activity,
  ActivityFilters,
  ActivityPagination,
} from '@/types/activity'
import { apiClient } from '@/services/api/client'

interface ActivityPage {
  activities: Activity[]
  pagination: ActivityPagination
}

export async function fetchActivities(filters: ActivityFilters): Promise<ActivityPage> {
  const { data } = await apiClient.get<ApiSuccessResponse<ActivityPage>>('/activities', {
    params: filters,
  })

  return data.data
}

export async function fetchActivity(id: number): Promise<Activity> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ activity: Activity }>>(
    `/activities/${id}`,
  )

  return data.data.activity
}
