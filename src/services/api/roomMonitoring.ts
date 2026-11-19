import type { ApiSuccessResponse } from '@/types/api'
import type { RoomCheckInResult, RoomMonitoringPreview } from '@/types/roomMonitoring'
import { apiClient } from '@/services/api/client'

export async function previewRoomCheckIn(qrIdentifier: string): Promise<RoomMonitoringPreview> {
  const { data } = await apiClient.post<ApiSuccessResponse<RoomMonitoringPreview>>(
    '/room-monitoring/preview',
    { qr_identifier: qrIdentifier },
  )

  return data.data
}

export async function checkInToRoom(
  qrIdentifier: string,
  mismatchReason?: string,
): Promise<RoomCheckInResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<RoomCheckInResult>>(
    '/room-monitoring/check-in',
    {
      qr_identifier: qrIdentifier,
      mismatch_reason: mismatchReason,
    },
  )

  return data.data
}
