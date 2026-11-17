export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'
export type AttendanceSessionStatus = 'open' | 'submitted' | 'cancelled'
export type AttendanceSubmissionSource = 'manual' | 'qr' | 'system'

export interface AttendanceSession {
  id: number
  class_date: string
  status: AttendanceSessionStatus
  created_by_user_id: number | null
  submitted_at: string | null
  qr_opened_at: string | null
  qr_closed_at: string | null
  qr_active: boolean
  cancelled_at: string | null
  cancellation_reason: string | null
  schedule: {
    id: number
    day_of_week: number
    start_time: string
    end_time: string
    status: string
    rooms: Array<{ id: number; code: string; name: string | null }>
  }
  offering: {
    id: number
    subject: { id: number; code: string; title: string }
    section: {
      id: number
      code: string
      name: string | null
      program: { id: number; code: string; name: string }
    }
    academic_term: {
      id: number
      academic_year: string
      term: string
      name: string
    }
  }
  professors: Array<{ id: number; name: string }>
}

export interface AttendanceRecord {
  id: number
  student_subject_enrollment_id: number
  status: AttendanceStatus
  check_in_at: string | null
  remarks: string | null
  submission_source: AttendanceSubmissionSource
  recorded_by_user_id: number | null
  updated_by_user_id: number | null
  student: {
    id: number
    student_number: string
    name: string
  }
  changes?: Array<{
    previous_status: AttendanceStatus
    new_status: AttendanceStatus
    correction_reason: string
    changed_by: string | null
    changed_at: string | null
  }>
}

export interface AttendanceRosterEntry {
  student_subject_enrollment_id: number
  student: {
    id: number
    student_number: string
    name: string
  }
  attendance: AttendanceRecord | null
}

export interface AttendanceSessionDetail {
  session: AttendanceSession
  roster: AttendanceRosterEntry[]
}

export interface AttendanceRecordItem {
  attendance: AttendanceRecord
  session: AttendanceSession
}

export interface AttendancePagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface AttendanceSummary {
  present: number
  absent: number
  late: number
  excused: number
  total: number
}

export interface OwnAttendanceSummary {
  summary: AttendanceSummary
  by_subject: Array<{
    id: number
    code: string
    title: string
    academic_term_id: number
    academic_term: string
    total: number
    present: number
    absent: number
    late: number
    excused: number
    late_absence_equivalents: number
    absence_equivalents: number
    attendance_percentage: number | null
    weighted_contribution: number | null
    allowed_absences: number | null
    remaining_absences: number | null
    allowance_exceeded: boolean
  }>
  terms: Array<{
    id: number
    academic_year: string
    term: string
    name: string
  }>
  offerings: Array<{
    id: number
    subject: { id: number; code: string; title: string }
    academic_term_id: number
    academic_term: string
  }>
}

export interface AttendanceQrCheckedInStudent {
  student_subject_enrollment_id: number
  student: {
    id: number
    student_number: string
    name: string
  }
  status: AttendanceStatus
  check_in_at: string | null
  submission_source: AttendanceSubmissionSource
}

export interface AttendanceQrMonitoring {
  total_enrolled: number
  checked_in: number
  present: number
  late: number
  absent: number
  excused: number
  not_checked_in: number
  percentage: number
  checked_in_students: AttendanceQrCheckedInStudent[]
}

export interface AttendanceQrStatus {
  active: boolean
  opened_at: string | null
  closed_at: string | null
  expires_at: string | null
  deadline_at: string | null
  token_ttl_seconds: number
  monitoring: AttendanceQrMonitoring
}

export interface AttendanceQrStartResult {
  token: string
  qr: AttendanceQrStatus
}

export interface AttendanceQrCheckInResult {
  attendance: AttendanceRecord
  session: AttendanceSession
  already_recorded: boolean
}

export interface AttendanceLedgerStudent {
  student: {
    id: number
    student_subject_enrollment_id: number
    student_number: string
    name: string
  }
  present: number
  late: number
  absent: number
  excused: number
  late_absence_equivalents: number
  absence_equivalents: number
  eligible_meetings: number
  attendance_percentage: number | null
  weighted_contribution: number | null
  allowed_absences: number | null
  remaining_absences: number | null
  allowance_exceeded: boolean
}

export interface OfferingAttendanceLedger {
  offering: {
    id: number
    subject: { id: number; code: string; title: string }
    section: { id: number; code: string; name: string | null }
    academic_term: {
      id: number
      academic_year: string
      name: string
      starts_on: string
      ends_on: string
    }
  }
  held_meetings: number
  incomplete_meetings: Array<{
    date: string
    schedule_id: number
    start_time: string
    end_time: string
  }>
  meetings: Array<{
    date: string
    schedule_id: number
    session_id: number | null
    state: 'incomplete' | 'held' | 'in_progress'
    start_time: string
    end_time: string
  }>
  policy: { allowed_absences: number; effective_at: string; scope: 'institutional' | 'offering' } | null
  students: AttendanceLedgerStudent[]
}

export interface AttendanceExcuseRequest {
  id: number
  attendance_session_id: number
  student_subject_enrollment_id: number
  student?: { id: number; student_number: string; name: string | null } | null
  session: AttendanceSession | null
  subject: { code: string; title: string; section: string } | null
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  decision_reason: string | null
  decided_at: string | null
  changes: Array<{
    previous_status: string | null
    new_status: string
    reason: string
    changed_by: string | null
    changed_at: string | null
  }>
}
