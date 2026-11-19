export interface RoomMonitoringRoom {
  id: number
  code: string
  name: string
  building: string | null
  floor: string | null
  status: string
}

export interface RoomMonitoringPreview {
  room: RoomMonitoringRoom
  scheduled_room: RoomMonitoringRoom
  schedule: {
    class_schedule_id: number
    schedule_assignment_id: number
    subject: { id: number; code: string; title: string } | null
    section: { id: number; code: string; name: string | null } | null
    professor: string | null
    class_date: string
    starts_at: string
    ends_at: string
  }
  requires_mismatch_override: boolean
  room_available: boolean
  room_reserved_for_another_class: boolean
  current_room_occupancy: {
    professor: { name: string | null }
    subject: { code: string; title: string } | null
    section: { code: string; name: string | null } | null
    checked_in_at: string | null
  } | null
  professor_has_other_active_occupancy: boolean
  early_check_in_minutes: number
}

export interface RoomCheckInResult {
  occupancy: {
    id: number
    room: RoomMonitoringRoom
    scheduled_room: RoomMonitoringRoom
    professor: { id: number; name: string | null }
    subject: { code: string; title: string } | null
    section: { code: string; name: string | null } | null
    scheduled_start_at: string | null
    scheduled_end_at: string | null
    checked_in_at: string | null
    checked_out_at: string | null
    mismatch_reason: string | null
    discrepancy_status: 'none' | 'open' | 'resolved'
  }
  already_checked_in: boolean
}
