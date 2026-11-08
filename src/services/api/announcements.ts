import type { ApiSuccessResponse } from '@/types/api'
import type {
  AnnouncementDetail,
  AnnouncementFeedItem,
  AnnouncementFeedPagination,
} from '@/types/announcement'
import { apiClient } from '@/services/api/client'

interface AnnouncementFeedResponse {
  announcements: AnnouncementFeedItem[]
  pagination: AnnouncementFeedPagination
}

export async function fetchAnnouncements(page = 1): Promise<AnnouncementFeedResponse> {
  const { data } = await apiClient.get<ApiSuccessResponse<AnnouncementFeedResponse>>(
    '/announcements',
    { params: { page, per_page: 10 } },
  )

  return data.data
}

export async function fetchAnnouncement(id: number): Promise<AnnouncementDetail> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ announcement: AnnouncementDetail }>
  >(`/announcements/${id}`)

  return data.data.announcement
}
