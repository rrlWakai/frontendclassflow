import type { ApiSuccessResponse } from '@/types/api'
import type {
  StudentMajorSelection,
  StudentPlacementOverview,
} from '@/types/placement'
import { apiClient } from '@/services/api/client'

export async function fetchMyPlacement(): Promise<StudentPlacementOverview> {
  const { data } = await apiClient.get<ApiSuccessResponse<StudentPlacementOverview>>(
    '/students/me/placement',
  )

  return data.data
}

export async function submitMajorSelection(
  periodId: number,
  majorId: number,
): Promise<StudentMajorSelection> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ major_selection: StudentMajorSelection }>>(
    `/students/me/major-selection/${periodId}`,
    { major_id: majorId },
  )

  return data.data.major_selection
}
