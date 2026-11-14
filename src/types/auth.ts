export type ClassFlowRole = 'professor' | 'student'

export type AuthRole = ClassFlowRole | 'administrator' | 'department_personnel'

export interface ProgramSummary {
  code: string
  name: string
}

export interface StudentProfile {
  type: 'student'
  studentNumber: string
  program: ProgramSummary | null
  admittedOn: string | null
}

export interface ProfessorProfile {
  type: 'professor'
  employeeNumber: string | null
  employmentType: string
  specialization: string | null
  program: ProgramSummary | null
}

export type AuthProfile = StudentProfile | ProfessorProfile

export interface AuthUser {
  id: number
  name: string
  email: string
  role: AuthRole | null
  roleLabel: string | null
  status: string
  profile: AuthProfile | null
}

export interface AuthSession {
  user: AuthUser
}

export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error'

export function isClassFlowRole(role: AuthRole | null): role is ClassFlowRole {
  return role === 'professor' || role === 'student'
}
