import type { ApiSuccessResponse } from '@/types/api'
import { apiClient, bootstrapCsrfCookie } from '@/services/api/client'

export interface RegistrationProgram {
  id: number
  code: string
  name: string
}

export interface RegistrationYearLevel {
  id: number
  level: number
  name: string
}

export interface RegistrationSection {
  id: number
  code: string
  name: string | null
  program_id: number
  year_level_id: number
}

export interface RegistrationDepartment {
  id: number
  code: string
  name: string
}

export interface RegistrationOptions {
  programs: RegistrationProgram[]
  year_levels: RegistrationYearLevel[]
  sections: RegistrationSection[]
  departments: RegistrationDepartment[]
}

export interface ProfessorRegistrationInput {
  name: string
  email: string
  password: string
  password_confirmation: string
  employment_type: 'full_time' | 'part_time'
  department_affiliation: 'ccs' | 'other'
  department_id: number
}

export interface ProfessorCorrection {
  name: string
  email: string
  employment_type: 'full_time' | 'part_time'
  department_affiliation: 'ccs' | 'other'
  department_id: number
  correction_reason: string
}

export async function fetchRegistrationOptions(): Promise<RegistrationOptions> {
  const { data } =
    await apiClient.get<ApiSuccessResponse<RegistrationOptions>>('/auth/registration/options')

  return data.data
}

export async function registerStudent(input: {
  name: string
  student_number: string
  email: string
  password: string
  password_confirmation: string
  program_id: number
  year_level_id: number
  section_id: number
}): Promise<void> {
  await bootstrapCsrfCookie()
  await apiClient.post('/auth/register/student', input)
}

export async function registerProfessor(input: ProfessorRegistrationInput): Promise<void> {
  await bootstrapCsrfCookie()
  await apiClient.post('/auth/register/professor', input)
}

export async function fetchProfessorCorrection(
  email: string,
  password: string,
): Promise<ProfessorCorrection> {
  await bootstrapCsrfCookie()
  const { data } = await apiClient.post<
    ApiSuccessResponse<{ registration: ProfessorCorrection }>
  >('/auth/register/professor/correction', { email, password })

  return data.data.registration
}

export async function resubmitProfessor(
  input: ProfessorRegistrationInput & { current_email: string },
): Promise<void> {
  await bootstrapCsrfCookie()
  await apiClient.post('/auth/register/professor/resubmit', input)
}
