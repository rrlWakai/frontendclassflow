import type { ApiSuccessResponse } from '@/types/api'
import type {
  AttendancePagination,
  AttendanceQrCheckInResult,
  AttendanceQrStartResult,
  AttendanceQrStatus,
  AttendanceRecordItem,
  AttendanceSession,
  AttendanceSessionDetail,
  AttendanceStatus,
  OwnAttendanceSummary,
} from '@/types/attendance'
import { apiClient } from '@/services/api/client'

export interface OwnAttendanceFilters {
  academic_term_id?: number
  subject_offering_id?: number
  status?: AttendanceStatus
  from_date?: string
  to_date?: string
  page?: number
  per_page?: number
}

export async function fetchMyAttendanceSessions(): Promise<AttendanceSession[]> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ sessions: AttendanceSession[]; pagination: AttendancePagination }>
  >('/attendance/sessions/me')
  return data.data.sessions
}

export async function createAttendanceSession(
  classScheduleId: number,
  classDate: string,
): Promise<AttendanceSession> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ session: AttendanceSession }>>(
    '/attendance/sessions',
    { class_schedule_id: classScheduleId, class_date: classDate },
  )
  return data.data.session
}

export async function fetchAttendanceSession(id: number): Promise<AttendanceSessionDetail> {
  const { data } = await apiClient.get<ApiSuccessResponse<AttendanceSessionDetail>>(
    `/attendance/sessions/${id}`,
  )
  return data.data
}

export async function saveAttendanceRecords(
  id: number,
  records: Array<{
    student_subject_enrollment_id: number
    status: AttendanceStatus
    check_in_at: string | null
    remarks: string | null
  }>,
  correctionReason?: string,
): Promise<void> {
  await apiClient.put(`/attendance/sessions/${id}/records`, {
    records,
    ...(correctionReason ? { correction_reason: correctionReason } : {}),
  })
}

export async function updateAttendanceSessionStatus(
  id: number,
  status: 'submitted' | 'cancelled',
  cancellationReason?: string,
): Promise<AttendanceSession> {
  const { data } = await apiClient.patch<ApiSuccessResponse<{ session: AttendanceSession }>>(
    `/attendance/sessions/${id}/status`,
    {
      status,
      ...(cancellationReason ? { cancellation_reason: cancellationReason } : {}),
    },
  )
  return data.data.session
}

export async function fetchMyAttendance(
  filters: OwnAttendanceFilters,
): Promise<{ records: AttendanceRecordItem[]; pagination: AttendancePagination; summary: OwnAttendanceSummary['summary'] }> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{
      records: AttendanceRecordItem[]
      pagination: AttendancePagination
      summary: OwnAttendanceSummary['summary']
    }>
  >('/attendance/records/me', { params: filters })
  return data.data
}

export async function fetchMyAttendanceSummary(
  filters: OwnAttendanceFilters,
): Promise<OwnAttendanceSummary> {
  const { data } = await apiClient.get<ApiSuccessResponse<OwnAttendanceSummary>>(
    '/attendance/summary/me',
    { params: filters },
  )
  return data.data
}

export async function fetchAttendanceQrStatus(
  sessionId: number,
): Promise<AttendanceQrStatus> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ qr: AttendanceQrStatus }>>(
    `/attendance/sessions/${sessionId}/qr`,
  )
  return data.data.qr
}

export async function startAttendanceQr(
  sessionId: number,
): Promise<AttendanceQrStartResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<AttendanceQrStartResult>>(
    `/attendance/sessions/${sessionId}/qr`,
  )
  return data.data
}

export async function stopAttendanceQr(
  sessionId: number,
): Promise<AttendanceQrStatus> {
  const { data } = await apiClient.delete<ApiSuccessResponse<{ qr: AttendanceQrStatus }>>(
    `/attendance/sessions/${sessionId}/qr`,
  )
  return data.data.qr
}

export async function submitAttendanceQr(
  token: string,
): Promise<AttendanceQrCheckInResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<AttendanceQrCheckInResult>>(
    '/attendance/qr/check-in',
    { token },
  )
  return data.data
}
