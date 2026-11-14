import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { ArrowRight, Eye, EyeOff, ExternalLink, LockKeyhole, Mail } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { RegistrationForm } from '@/components/auth/RegistrationForm'
import type { ClassFlowRole, LoginCredentials } from '@/types/auth'
import { getApiErrorMessage } from '@/utils/apiError'
import './RoleLoginPage.css'

interface RoleLoginPageProps {
  role: ClassFlowRole
}

function getReturnTo(state: unknown, role: ClassFlowRole) {
  if (typeof state !== 'object' || state === null || !('from' in state)) {
    return null
  }

  const from = state.from
  if (
    typeof from !== 'object' ||
    from === null ||
    !('pathname' in from) ||
    typeof from.pathname !== 'string'
  ) {
    return null
  }

  if (from.pathname !== `/${role}` && !from.pathname.startsWith(`/${role}/`)) {
    return null
  }

  const search = 'search' in from && typeof from.search === 'string' ? from.search : ''
  const hash = 'hash' in from && typeof from.hash === 'string' ? from.hash : ''
  return `${from.pathname}${search}${hash}`
}

const roles: { role: ClassFlowRole; label: string }[] = [
  { role: 'student', label: 'Student' },
  { role: 'professor', label: 'Professor' },
]

const adminAppUrl = import.meta.env.VITE_ADMIN_APP_URL || '/admin'

export function RoleLoginPage({ role }: RoleLoginPageProps) {
  const { status, user, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
    remember: true,
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0 })
  const focusTabAfterNavigation = useRef(false)
  const roleTabsRef = useRef<HTMLDivElement>(null)
  const roleTabRefs = useRef<Partial<Record<ClassFlowRole, HTMLButtonElement>>>({})

  useEffect(() => {
    if (!focusTabAfterNavigation.current) {
      return
    }

    focusTabAfterNavigation.current = false
    roleTabRefs.current[role]?.focus()
  }, [role])

  useLayoutEffect(() => {
    const roleTabs = roleTabsRef.current
    const selectedTab = roleTabRefs.current[role]

    if (!roleTabs || !selectedTab) {
      return
    }

    const updateIndicator = () => {
      const tabsBounds = roleTabs.getBoundingClientRect()
      const selectedBounds = selectedTab.getBoundingClientRect()

      setIndicatorStyle({
        top: selectedBounds.top - tabsBounds.top,
        height: selectedBounds.height,
      })
    }

    updateIndicator()

    const resizeObserver = new ResizeObserver(updateIndicator)
    resizeObserver.observe(roleTabs)
    roles.forEach(({ role: tabRole }) => {
      const tab = roleTabRefs.current[tabRole]
      if (tab) {
        resizeObserver.observe(tab)
      }
    })
    window.addEventListener('resize', updateIndicator)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateIndicator)
    }
  }, [role])

  if (status === 'authenticated' && user) {
    const returnTo = user.role === role ? getReturnTo(location.state, role) : null
    return <Navigate to={returnTo ?? `/${user.role}/dashboard`} replace />
  }

  function selectRole(nextRole: ClassFlowRole, shouldFocus = false) {
    if (nextRole === role) {
      return
    }

    focusTabAfterNavigation.current = shouldFocus
    navigate(`/${nextRole}/login`, { state: location.state })
  }

  function handleRoleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = roles.findIndex((option) => option.role === role)
    let nextIndex: number

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % roles.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + roles.length) % roles.length
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = roles.length - 1
        break
      default:
        return
    }

    event.preventDefault()
    selectRole(roles[nextIndex].role, true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login(
        {
          ...credentials,
          email: credentials.email.trim(),
        },
        role,
      )
    } catch (submissionError) {
      setError(
        getApiErrorMessage(
          submissionError,
          'Unable to sign in. Check your credentials and try again.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`classflow-login classflow-login--${role}${isRegistering ? ' classflow-login--register' : ''}`}>
      <div className="classflow-login__shell">
        <header className="classflow-login__header">
          <Link to="/" className="classflow-login__brand" aria-label="ClassFlow home">
            ClassFlow
          </Link>
          <span className="classflow-login__college">
            College of Computer Studies
          </span>
        </header>

        <main className="classflow-login__main">
          <section className="classflow-login__introduction" aria-label="Choose an account type">
            <p className="classflow-login__welcome">Welcome back</p>

            <div
              ref={roleTabsRef}
              className="classflow-login__role-tabs"
              role="tablist"
              aria-label="Sign-in role"
            >
              {roles.map((option) => {
                const isSelected = option.role === role

                return (
                  <button
                    key={option.role}
                    ref={(element) => {
                      if (element) {
                        roleTabRefs.current[option.role] = element
                      }
                    }}
                    id={`classflow-role-tab-${option.role}`}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    aria-controls="classflow-login-panel"
                    tabIndex={isSelected ? 0 : -1}
                    className="classflow-login__role-tab"
                    onClick={() => selectRole(option.role)}
                    onKeyDown={handleRoleKeyDown}
                  >
                    {option.label}
                  </button>
                )
              })}
              <span
                className="classflow-login__indicator"
                style={{
                  height: `${indicatorStyle.height}px`,
                  transform: `translateY(${indicatorStyle.top}px)`,
                }}
                aria-hidden="true"
              />
            </div>
          </section>

          <section
            id="classflow-login-panel"
            className="classflow-login__form-section"
            role="tabpanel"
            tabIndex={-1}
            aria-labelledby={`classflow-role-tab-${role}`}
          >
            {isRegistering ? (
              <RegistrationForm onBack={() => setIsRegistering(false)} />
            ) : (
              <>
              <form
                className="classflow-login__form"
                onSubmit={handleSubmit}
                aria-busy={isSubmitting}
              >
              <div className="classflow-login__field">
                <label htmlFor="classflow-email">School email</label>
                <div className="classflow-login__text-input">
                  <Mail aria-hidden="true" />
                  <input
                    id="classflow-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    placeholder="you@lspu.edu.ph"
                    value={credentials.email}
                    onChange={(event) =>
                      setCredentials((current) => ({ ...current, email: event.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="classflow-login__field">
                <label htmlFor="classflow-password">Password</label>
                <div className="classflow-login__password-input">
                  <LockKeyhole aria-hidden="true" />
                  <input
                    id="classflow-password"
                    name="password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(event) =>
                      setCredentials((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    required
                  />
                  <button
                    type="button"
                    className="classflow-login__visibility-toggle"
                    aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                    aria-pressed={isPasswordVisible}
                    onClick={() => setIsPasswordVisible((visible) => !visible)}
                  >
                    {isPasswordVisible ? (
                      <EyeOff aria-hidden="true" />
                    ) : (
                      <Eye aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <label className="classflow-login__remember">
                <input
                  type="checkbox"
                  checked={credentials.remember ?? false}
                  onChange={(event) =>
                    setCredentials((current) => ({
                      ...current,
                      remember: event.target.checked,
                    }))
                  }
                />
                <span>Keep me signed in on this device</span>
              </label>

              <button
                className="classflow-login__submit"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
                <ArrowRight aria-hidden="true" />
              </button>

              <div className="classflow-login__feedback" aria-live="polite">
                {error ? (
                  <p className="classflow-login__error" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
              </form>
              <button
                type="button"
                className="classflow-login__create-account"
                onClick={() => setIsRegistering(true)}
              >
                Create an account
              </button>
              </>
            )}
          </section>
        </main>

        <footer className="classflow-login__footer">
          <span>Administrator?</span>{' '}
          <a href={adminAppUrl}>
            Open CCSync Admin
            <ExternalLink aria-hidden="true" />
          </a>
        </footer>
      </div>
    </div>
  )
}
