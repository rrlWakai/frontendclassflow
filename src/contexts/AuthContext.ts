import { createContext } from 'react'
import type {
  AuthSession,
  AuthStatus,
  ClassFlowRole,
  LoginCredentials,
} from '@/types/auth'

export interface AuthContextValue {
  status: AuthStatus
  error: string | null
  session: AuthSession | null
  user: AuthSession['user'] | null
  login: (credentials: LoginCredentials, expectedRole: ClassFlowRole) => Promise<void>
  logout: () => Promise<void>
  retrySession: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
