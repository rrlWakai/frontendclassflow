import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { isAxiosError } from 'axios'
import { AuthContext } from '@/contexts/AuthContext'
import type { AuthContextValue } from '@/contexts/AuthContext'
import {
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
} from '@/services/api/auth'
import { UNAUTHORIZED_EVENT } from '@/services/api/client'
import { isClassFlowRole } from '@/types/auth'
import type {
  AuthSession,
  AuthStatus,
  ClassFlowRole,
  LoginCredentials,
} from '@/types/auth'

interface AuthProviderProps {
  children: ReactNode
}

const ROLE_MISMATCH_ERROR =
  'This account is not authorized for the selected sign-in entry. Use the correct professor or student entry point.'

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  const restoreSession = useCallback(async (isCurrent: () => boolean = () => true) => {
    try {
      const user = await fetchCurrentUser()

      if (!isCurrent()) {
        return
      }

      if (isClassFlowRole(user.role)) {
        setSession({ user })
        setStatus('authenticated')
        return
      }

      await logoutRequest()

      if (isCurrent()) {
        setSession(null)
        setStatus('unauthenticated')
      }
    } catch (sessionError) {
      if (!isCurrent()) {
        return
      }

      setSession(null)

      if (isAxiosError(sessionError) && sessionError.response?.status === 401) {
        setStatus('unauthenticated')
        return
      }

      setError('Unable to verify or end your session. Check the API connection and retry.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    let active = true

    void Promise.resolve().then(() => restoreSession(() => active))

    return () => {
      active = false
    }
  }, [restoreSession])

  useEffect(() => {
    const handleUnauthorized = () => {
      setSession(null)
      setError(null)
      setStatus('unauthenticated')
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)

    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    }
  }, [])

  const login = useCallback(
    async (credentials: LoginCredentials, expectedRole: ClassFlowRole) => {
      const nextSession = await loginRequest(credentials)

      if (nextSession.user.role !== expectedRole) {
        try {
          await logoutRequest()
        } catch {
          setSession(null)
          setError('Unable to end this session. Retry the session check before continuing.')
          setStatus('error')
          throw new Error('Unable to end this session. Retry the session check before continuing.')
        }

        throw new Error(ROLE_MISMATCH_ERROR)
      }

      setSession(nextSession)
      setError(null)
      setStatus('authenticated')
    },
    [],
  )

  const logout = useCallback(async () => {
    if (!session) {
      return
    }

    try {
      await logoutRequest()
      setSession(null)
      setError(null)
      setStatus('unauthenticated')
    } catch {
      setSession(null)
      setError('Unable to confirm sign out. Retry the session check.')
      setStatus('error')
    }
  }, [session])

  const retrySession = useCallback(() => {
    setStatus('loading')
    setError(null)

    return restoreSession()
  }, [restoreSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      error,
      session,
      user: session?.user ?? null,
      login,
      logout,
      retrySession,
    }),
    [error, login, logout, retrySession, session, status],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
