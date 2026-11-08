import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { useAuth } from '@/hooks/useAuth'
import { isClassFlowRole } from '@/types/auth'
import type { ClassFlowRole } from '@/types/auth'

interface RequireRoleProps {
  role: ClassFlowRole
}

export function RequireRole({ role }: RequireRoleProps) {
  const { status, user, error, retrySession } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <LoadingScreen />
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <p role="alert" className="max-w-md text-sm leading-6 text-ink-muted">
          {error}
        </p>
        <Button onClick={() => void retrySession()}>Retry session check</Button>
      </div>
    )
  }

  if (status !== 'authenticated' || !user) {
    return <Navigate to={`/${role}/login`} state={{ from: location }} replace />
  }

  if (user.role !== role) {
    if (isClassFlowRole(user.role)) {
      return <Navigate to={`/${user.role}/dashboard`} replace />
    }

    return <Navigate to={`/${role}/login`} state={{ from: location }} replace />
  }

  return <Outlet />
}
