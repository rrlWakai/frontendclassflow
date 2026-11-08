export type ActivityCategory =
  | 'seminar'
  | 'workshop'
  | 'orientation'
  | 'meeting'
  | 'competition'
  | 'conference'
  | 'research'
  | 'celebration'
  | 'organization'
  | 'training'
  | 'other'

export type ActivityState = 'upcoming' | 'ongoing' | 'completed' | 'cancelled'

export interface ActivityRoom {
  id: number
  code: string
  name: string
  building: string | null
  floor: string | null
}

export interface Activity {
  id: number
  title: string
  summary: string | null
  description: string
  category: ActivityCategory
  organizer_name: string
  venue_name: string | null
  location_details: string | null
  room: ActivityRoom | null
  audience_summary: string
  starts_at: string
  ends_at: string
  status: 'published' | 'cancelled' | 'completed'
  activity_state: ActivityState
  cancellation_reason: string | null
  cancelled_at: string | null
  cancelled_by: { id: number; name: string } | null
  created_by: { id: number; name: string } | null
}

export interface ActivityPagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ActivityFilters {
  search?: string
  category?: ActivityCategory
  status?: ActivityState
  page?: number
  per_page?: number
}
