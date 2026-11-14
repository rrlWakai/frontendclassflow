import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
} from 'lucide-react'
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

const roles: {
  role: ClassFlowRole
  label: string
  icon: typeof GraduationCap
  note: string
}[] = [
  {
    role: 'student',
    label: 'Student',
    icon: GraduationCap,
    note: 'Use your institutional email. Class schedules, attendance records, and announcements stay in sync with your enrolled sections.',
  },
  {
    role: 'professor',
    label: 'Professor',
    icon: BriefcaseBusiness,
    note: 'Faculty accounts require administrator approval before sign-in. Registration corrections can be resubmitted from the account form.',
  },
]

const highlights = [
  'Section rosters and class schedules',
  'Session attendance and QR check-in',
  'Class announcements and activities',
]

const adminAppUrl = import.meta.env.VITE_ADMIN_APP_URL || '/admin'
const campusPhoto = `${import.meta.env.BASE_URL}images/ccs-campus.png`

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
  const focusTabAfterNavigation = useRef(false)
  const roleTabRefs = useRef<Partial<Record<ClassFlowRole, HTMLButtonElement>>>({})

  const activeRole = roles.find((option) => option.role === role) ?? roles[0]

  useEffect(() => {
    if (!focusTabAfterNavigation.current) {
      return
    }

    focusTabAfterNavigation.current = false
    roleTabRefs.current[role]?.focus()
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

  function openRegistration() {
    setIsRegistering(true)
    setError(null)
  }

  function closeRegistration() {
    setIsRegistering(false)
    setError(null)
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
    <div className="cf-auth">
      <div className="cf-auth__shell">
        <aside className="cf-auth__showcase" aria-label="About ClassFlow">
          <img
            className="cf-auth__showcase-photo"
            src={campusPhoto}
            alt="College of Computer Studies campus building"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
          <div className="cf-auth__showcase-wash" aria-hidden="true" />

          <div className="cf-auth__showcase-inner">
            <Link to="/" className="cf-auth__brand" aria-label="ClassFlow home">
              <span className="cf-auth__brand-mark" aria-hidden="true">
                <svg viewBox="0 0 32 32" fill="none">
                  <path
                    d="M5 20c3.5-7 7-7 10.5 0s7 7 10.5 0"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                  <circle cx="24" cy="12.5" r="2" fill="currentColor" />
                </svg>
              </span>
              <span className="cf-auth__brand-text">
                <span className="cf-auth__brand-name">ClassFlow</span>
                <span className="cf-auth__brand-sub">College of Computer Studies</span>
              </span>
            </Link>

            <div className="cf-auth__showcase-body">
              <p className="cf-auth__eyebrow">CCSync Academic Platform</p>
              <h1 className="cf-auth__headline">
                The academic day for Computer Studies, kept in one calm place.
              </h1>
              <p className="cf-auth__description">
                ClassFlow brings class schedules, attendance, and coursework
                communication together for CCS faculty and students, aligned to the
                sections and terms the college already runs.
              </p>

              <ul className="cf-auth__points">
                {highlights.map((item) => (
                  <li key={item}>
                    <Check aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="cf-auth__showcase-foot">
              <span>Lyceum of the Philippines University</span>
              <span className="cf-auth__dot" aria-hidden="true" />
              <span>San Pablo City Campus</span>
            </div>
          </div>
        </aside>

        <div className="cf-auth__panel">
          <div className="cf-auth__panel-inner">
            <div className="cf-auth__compact-brand">
              <Link to="/">ClassFlow</Link>
              <span className="cf-auth__compact-campus">
                CCS · LSPU San Pablo City Campus
              </span>
            </div>

            <section
              id="classflow-login-panel"
              className="cf-auth__card"
              role="tabpanel"
              tabIndex={-1}
              aria-labelledby={`classflow-role-tab-${role}`}
            >
              {isRegistering ? (
                <RegistrationForm onBack={closeRegistration} />
              ) : (
                <>
                  <h1 className="cf-auth__heading">
                    Welcome to ClassFlow
                  </h1>
                  <p className="cf-auth__subheading">
                    Sign in with the email issued by the college to continue.
                  </p>

                  <div
                    className="cf-auth__tabs"
                    role="tablist"
                    aria-label="Sign-in role"
                  >
                    {roles.map((option) => {
                      const Icon = option.icon
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
                          className="cf-auth__tab"
                          onClick={() => selectRole(option.role)}
                          onKeyDown={handleRoleKeyDown}
                        >
                          <Icon aria-hidden="true" />
                          {option.label}
                        </button>
                      )
                    })}
                  </div>

                  <p className="cf-auth__role-note">{activeRole.note}</p>

                  <form
                    className="cf-auth__form"
                    onSubmit={handleSubmit}
                    aria-busy={isSubmitting}
                  >
                    <div className="cf-auth__field">
                      <label className="cf-auth__label" htmlFor="classflow-email">
                        Email address
                      </label>
                      <div className="cf-auth__control">
                        <span className="cf-auth__control-icon">
                          <Mail aria-hidden="true" />
                        </span>
                        <input
                          id="classflow-email"
                          name="email"
                          type="email"
                          className="cf-auth__input cf-auth__input--icon"
                          autoComplete="username"
                          placeholder="you@lspu.edu.ph"
                          value={credentials.email}
                          onChange={(event) =>
                            setCredentials((current) => ({
                              ...current,
                              email: event.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="cf-auth__field">
                      <div className="cf-auth__label-row">
                        <label className="cf-auth__label" htmlFor="classflow-password">
                          Password
                        </label>
                        <button
                          type="button"
                          className="cf-auth__link"
                          onClick={() =>
                            setError(
                              'Password reset is not available yet. Ask the CCS administrator to reset your ClassFlow password.',
                            )
                          }
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="cf-auth__control">
                        <span className="cf-auth__control-icon">
                          <LockKeyhole aria-hidden="true" />
                        </span>
                        <input
                          id="classflow-password"
                          name="password"
                          type={isPasswordVisible ? 'text' : 'password'}
                          className="cf-auth__input cf-auth__input--icon cf-auth__input--reveal"
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
                          className="cf-auth__reveal"
                          aria-label={
                            isPasswordVisible ? 'Hide password' : 'Show password'
                          }
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

                    <label className="cf-auth__check" htmlFor="classflow-remember">
                      <input
                        id="classflow-remember"
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

                    <div aria-live="polite">
                      {error ? (
                        <div className="cf-auth__alert" role="alert">
                          <AlertCircle aria-hidden="true" />
                          <p>{error}</p>
                        </div>
                      ) : null}
                    </div>

                    <button
                      className="cf-auth__submit"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="cf-auth__spinner" aria-hidden="true" />
                          Signing in…
                        </>
                      ) : (
                        <>
                          Sign in
                          <ArrowRight aria-hidden="true" />
                        </>
                      )}
                    </button>

                    <div className="cf-auth__row">
                      <span className="cf-auth__hint">New to ClassFlow?</span>
                      <button
                        type="button"
                        className="cf-auth__link"
                        onClick={openRegistration}
                      >
                        Create an account
                      </button>
                    </div>

                    <p className="cf-auth__hint">
                      Student accounts activate immediately. Professor accounts are
                      reviewed by an administrator before first sign-in.
                    </p>
                  </form>
                </>
              )}
            </section>

            <footer className="cf-auth__panel-foot">
              <span>© {new Date().getFullYear()} CCSync · College of Computer Studies</span>
              <a href={adminAppUrl}>
                Administrator sign-in
                <ExternalLink aria-hidden="true" />
              </a>
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}