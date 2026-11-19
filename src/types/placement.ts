export interface PlacementAcademicYear {
  id: number
  label: string
}

export interface PlacementAcademicTerm {
  id: number
  academic_year: string
  term: string
  name: string
}

export interface PlacementYearLevel {
  id: number
  level: number
  name: string
}

export interface PlacementMajor {
  id: number
  code: string
  name: string
}

export interface PlacementSection {
  id: number
  code: string
  name: string | null
}

export interface StudentPlacementRecord {
  id: number
  status: string
  is_current: boolean
  effective_on: string | null
  ends_on: string | null
  academic_year: PlacementAcademicYear | null
  academic_term: PlacementAcademicTerm | null
  year_level: PlacementYearLevel | null
  major: PlacementMajor | null
  section: PlacementSection | null
}

export interface MajorSelectionPeriod {
  id: number
  opens_at: string | null
  closes_at: string | null
  allow_changes: boolean
  status: string
  academic_year: PlacementAcademicYear | null
  program: { id: number; code: string; name: string } | null
  target_year_level: PlacementYearLevel | null
}

export interface MajorOption {
  id: number
  code: string
  name: string
  description: string | null
}

export interface StudentMajorSelection {
  id: number
  status: 'submitted' | 'approved' | 'rejected'
  selected_at: string | null
  reviewed_at: string | null
  remarks: string | null
  major: PlacementMajor | null
  academic_year: PlacementAcademicYear | null
  period: MajorSelectionPeriod | null
}

export type MajorSelectionEligibilityReason =
  | 'placement_missing'
  | 'major_already_assigned'
  | 'not_yet_eligible'
  | 'not_eligible'
  | 'target_level_missing'

export interface MajorSelectionEligibility {
  eligible: boolean
  reason: MajorSelectionEligibilityReason | null
  current_year_level: PlacementYearLevel | null
  target_year_level: PlacementYearLevel | null
  has_major: boolean
}

export interface StudentPlacementOverview {
  current_placement: StudentPlacementRecord | null
  placement_history: StudentPlacementRecord[]
  major_selection_eligibility: MajorSelectionEligibility
  major_selection_periods: MajorSelectionPeriod[]
  major_options: MajorOption[]
  major_selection: StudentMajorSelection | null
}
