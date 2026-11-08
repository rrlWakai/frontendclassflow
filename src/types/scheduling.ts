export interface MySchedule {
  id: number
  subject_offering_id: number
  day_of_week: number
  start_time: string
  end_time: string
  schedule_type: 'lecture' | 'laboratory' | 'seminar' | 'other'
  modality: 'face_to_face' | 'online' | 'hybrid'
  status: 'published'
  offering: {
    id: number
    expected_students: number | null
    subject: { id: number; code: string; title: string }
    section: {
      id: number
      code: string
      name: string | null
      program: { id: number; code: string; name: string }
      year_level: { id: number; name: string }
    }

    academic_term: {
      id: number
      academic_year: string
      term: string
      name: string
      starts_on: string
      ends_on: string
    }
  }
  assignments: Array<{
    id: number
    faculty_assignment_id: number
    is_primary: boolean
    status: string
    assignment_role: string
    professor: { id: number; name: string }
  }>
  room_allocations: Array<{
    id: number
    room_id: number
    status: string
    room: { id: number; code: string; name: string; building: string | null; capacity: number }
  }>
}

export interface MyScheduleConflict {
  id: string
  student: {
    id: number
    name: string | null
    student_number: string
    program: { id: number; code: string; name: string } | null
    year_levels: Array<{ id: number; level: number; name: string }>
  }
  academic_term: {
    id: number
    academic_year: string
    term: string
    name: string
    starts_on: string | null
    ends_on: string | null
  }
  day_of_week: number
  day_label: string
  overlap: { start_time: string; end_time: string }
  classes: Array<{
    schedule_id: number
    subject_offering_id: number
    subject: { id: number; code: string; title: string }
    section: {
      id: number
      code: string
      name: string | null
      program: { id: number; code: string; name: string } | null
      year_level: { id: number; level: number; name: string } | null
    }
    start_time: string
    end_time: string
    room: { id: number; code: string; name: string; building: string | null } | null
    professors: Array<{ id: number; name: string }>
  }>
}

export interface MyScheduleConflictPage {
  academic_term: MyScheduleConflict['academic_term'] | null
  summary: {
    students_checked: number
    students_with_conflicts: number
    conflict_pairs: number
  }
  conflicts: MyScheduleConflict[]
  pagination: { current_page: number; last_page: number; per_page: number; total: number }
}
