import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent, ReactNode } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  Info,
} from 'lucide-react'
import {
  fetchProfessorCorrection,
  fetchRegistrationOptions,
  registerProfessor,
  registerStudent,
  resubmitProfessor,
} from '@/services/api/registration'
import type {
  ProfessorCorrection,
  RegistrationOptions,
} from '@/services/api/registration'
import { getApiErrorMessage, getApiFieldErrors } from '@/utils/apiError'

type AccountType = 'student' | 'professor'

const accountTypes: {
  type: AccountType
  label: string
  icon: typeof GraduationCap
}[] = [
  { type: 'student', label: 'Student', icon: GraduationCap },
  { type: 'professor', label: 'Professor', icon: BriefcaseBusiness },
]

interface RegistrationFormProps {
  onBack: () => void
}

interface Values {
  name: string
  student_number: string
  email: string
  password: string
  password_confirmation: string
  program_id: string
  year_level_id: string
  section_id: string
  employment_type: 'full_time' | 'part_time'
  department_affiliation: 'ccs' | 'other' | ''
  department_id: string
}

const initialValues: Values = {
  name: '',
  student_number: '',
  email: '',
  password: '',
  password_confirmation: '',
  program_id: '',
  year_level_id: '',
  section_id: '',
  employment_type: 'full_time',
  department_affiliation: '',
  department_id: '',
}

function firstError(errors: Record<string, string[]>, field: string) {
  return errors[field]?.[0]
}

export function RegistrationForm({ onBack }: RegistrationFormProps) {
  const [accountType, setAccountType] = useState<AccountType>('student')
  const [values, setValues] = useState<Values>(initialValues)
  const [options, setOptions] = useState<RegistrationOptions | null>(null)
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [success, setSuccess] = useState<string | null>(null)
  const [isCorrectionMode, setIsCorrectionMode] = useState(false)
  const [isCorrectionVerified, setIsCorrectionVerified] = useState(false)
  const [correctionReason, setCorrectionReason] = useState<string | null>(null)
  const [correctionPassword, setCorrectionPassword] = useState('')
  const [correctionOriginalEmail, setCorrectionOriginalEmail] = useState('')
  const accountTypeRefs = useRef<Partial<Record<AccountType, HTMLButtonElement | null>>>({})

  useEffect(() => {
    let active = true

    void fetchRegistrationOptions()
      .then((result) => {
        if (active) {
          setOptions(result)
          setError(null)
        }
      })
      .catch((optionsError: unknown) => {
        if (active) {
          setError(getApiErrorMessage(optionsError, 'Unable to load registration options.'))
        }
      })
      .finally(() => {
        if (active) setIsLoadingOptions(false)
      })

    return () => {
      active = false
    }
  }, [])

  const selectedProgramId = Number(values.program_id)
  const selectedYearLevelId = Number(values.year_level_id)
  const availableYearLevels = useMemo(() => {
    if (!options) return []
    const levelIds = new Set(
      options.sections
        .filter((section) => section.program_id === selectedProgramId)
        .map((section) => section.year_level_id),
    )
    return options.year_levels.filter((level) => levelIds.has(level.id))
  }, [options, selectedProgramId])
  const availableSections = useMemo(
    () =>
      options?.sections.filter(
        (section) =>
          section.program_id === selectedProgramId &&
          section.year_level_id === selectedYearLevelId,
      ) ?? [],
    [options, selectedProgramId, selectedYearLevelId],
  )
  const availableDepartments =
    options?.departments.filter((department) => department.code !== 'CCS') ?? []

  function update<K extends keyof Values>(field: K, value: Values[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: [] }))
    setError(null)
    setSuccess(null)
  }

  async function loadCorrection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const correction: ProfessorCorrection = await fetchProfessorCorrection(
        values.email.trim(),
        correctionPassword,
      )
      setValues((current) => ({
        ...current,
        name: correction.name,
        email: correction.email,
        employment_type: correction.employment_type,
        department_affiliation: correction.department_affiliation,
        department_id: String(correction.department_id),
        password: correctionPassword,
        password_confirmation: correctionPassword,
      }))
      setCorrectionReason(correction.correction_reason)
      setCorrectionOriginalEmail(correction.email)
      setIsCorrectionVerified(true)
    } catch (verificationError) {
      setError(getApiErrorMessage(verificationError, 'Unable to verify this returned registration.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  function selectAccountType(type: AccountType) {
    setAccountType(type)
    setIsCorrectionMode(false)
    setIsCorrectionVerified(false)
    setValues(initialValues)
    setError(null)
    setFieldErrors({})
  }

  function handleAccountTypeKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const navigationKeys = [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ]
    if (!navigationKeys.includes(event.key)) {
      return
    }

    event.preventDefault()

    const currentIndex = accountTypes.findIndex((option) => option.type === accountType)
    let nextIndex = currentIndex

    if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = accountTypes.length - 1
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % accountTypes.length
    } else {
      nextIndex = (currentIndex - 1 + accountTypes.length) % accountTypes.length
    }

    const nextType = accountTypes[nextIndex]
    if (!nextType) {
      return
    }

    selectAccountType(nextType.type)
    accountTypeRefs.current[nextType.type]?.focus()
  }

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setFieldErrors({})

    try {
      if (accountType === 'student') {
        await registerStudent({
          name: values.name.trim(),
          student_number: values.student_number.trim(),
          email: values.email.trim(),
          password: values.password,
          password_confirmation: values.password_confirmation,
          program_id: Number(values.program_id),
          year_level_id: Number(values.year_level_id),
          section_id: Number(values.section_id),
        })
        setSuccess('Student account created. You can now sign in.')
      } else {
        const submission = {
          name: values.name.trim(),
          email: values.email.trim(),
          password: isCorrectionMode ? correctionPassword : values.password,
          password_confirmation: isCorrectionMode ? correctionPassword : values.password_confirmation,
          employment_type: values.employment_type,
          department_affiliation: values.department_affiliation as 'ccs' | 'other',
          department_id: Number(values.department_id),
        }
        if (isCorrectionMode) {
          await resubmitProfessor({
            ...submission,
            current_email: correctionOriginalEmail,
          })
          setSuccess('Your updated registration was resubmitted for administrator review.')
        } else {
          await registerProfessor(submission)
          setSuccess('Registration submitted. Your professor account is pending administrator approval.')
        }
      }
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'Unable to submit your registration.'))
      setFieldErrors(getApiFieldErrors(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  function startCorrectionMode() {
    setAccountType('professor')
    setIsCorrectionMode(true)
    setIsCorrectionVerified(false)
    setCorrectionReason(null)
    setCorrectionOriginalEmail('')
    setValues(initialValues)
    setError(null)
    setSuccess(null)
  }

  if (success) {
    return (
      <div className="cf-auth__form">
        <div className="cf-auth__success">
          <CheckCircle2 aria-hidden="true" />
          <p role="status">{success}</p>
        </div>

        <h1 className="cf-auth__heading">Registration submitted</h1>

        <button type="button" className="cf-auth__submit" onClick={onBack}>
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="cf-auth__form">
        <button type="button" className="cf-auth__back" onClick={onBack}>
          <ArrowLeft aria-hidden="true" /> Back to sign in
        </button>
        <h1 className="cf-auth__heading">Create an account</h1>
        <p className="cf-auth__subheading">Use your institutional email.</p>

        <fieldset className="cf-auth__fieldset">
          <legend className="cf-auth__legend">Account type</legend>

          <div
            className="cf-auth__account-types"
            role="radiogroup"
            aria-label="Account type"
            onKeyDown={handleAccountTypeKeyDown}
          >
            {accountTypes.map((option) => {
              const Icon = option.icon
              const isSelected = accountType === option.type

              return (
                <button
                  key={option.type}
                  ref={(element) => {
                    accountTypeRefs.current[option.type] = element
                  }}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  className="cf-auth__account-type"
                  onClick={() => {
                    selectAccountType(option.type)
                  }}
                >
                  <span className="cf-auth__account-type-icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="cf-auth__account-type-label">{option.label}</span>
                  <span className="cf-auth__account-type-check" aria-hidden="true">
                    <CheckCircle2 />
                  </span>
                </button>
              )
            })}
          </div>

          {isLoadingOptions ? (
            <p className="cf-auth__hint" role="status">
              Loading registration options…
            </p>
          ) : null}

          {accountType === 'professor' && !isCorrectionMode ? (
            <button
              type="button"
              className="cf-auth__text-button"
              onClick={startCorrectionMode}
            >
              Resubmit a returned registration
            </button>
          ) : null}
        </fieldset>

        {error ? (
          <div className="cf-auth__alert" role="alert">
            <AlertCircle aria-hidden="true" />
            <p>{error}</p>
          </div>
        ) : null}

        {isCorrectionMode && !isCorrectionVerified ? (
          <form
            className="cf-auth__form"
            onSubmit={(event) => void loadCorrection(event)}
          >
            <p className="cf-auth__hint">
              Enter the institutional email and current password for the returned
              registration.
            </p>
            <Field
              label="Institutional email"
              name="correction-email"
              error={firstError(fieldErrors, 'email')}
            >
              <input
                id="correction-email"
                className="cf-auth__input"
                type="email"
                autoComplete="email"
                required
                value={values.email}
                onChange={(event) => update('email', event.target.value)}
              />
            </Field>
            <Field label="Current password" name="correction-password">
              <input
                id="correction-password"
                className="cf-auth__input"
                type="password"
                autoComplete="current-password"
                required
                value={correctionPassword}
                onChange={(event) => setCorrectionPassword(event.target.value)}
              />
            </Field>
            <button type="submit" className="cf-auth__submit" disabled={isSubmitting}>
              {isSubmitting ? 'Checking…' : 'Load returned registration'}
            </button>
          </form>
        ) : null}

        {!isCorrectionMode || isCorrectionVerified ? (
          <form
            className="cf-auth__form"
            onSubmit={(event) => void submitRegistration(event)}
          >
            {correctionReason ? (
              <div className="cf-auth__notice">
                <Info aria-hidden="true" />
                <div>
                  <p>
                    <strong>Requested correction</strong>
                  </p>
                  <p>{correctionReason}</p>
                </div>
              </div>
            ) : null}

            <fieldset className="cf-auth__fieldset">
              <legend className="cf-auth__legend">Personal information</legend>

              <Field
                label="Full name"
                name="registration-name"
                error={firstError(fieldErrors, 'name')}
              >
                <input
                  id="registration-name"
                  className="cf-auth__input"
                  type="text"
                  autoComplete="name"
                  required
                  value={values.name}
                  onChange={(event) => update('name', event.target.value)}
                />
              </Field>

              {accountType === 'student' ? (
                <Field
                  label="Student number"
                  name="registration-student-number"
                  error={firstError(fieldErrors, 'student_number')}
                >
                  <input
                    id="registration-student-number"
                    className="cf-auth__input"
                    type="text"
                    autoComplete="off"
                    maxLength={32}
                    required
                    value={values.student_number}
                    onChange={(event) => update('student_number', event.target.value)}
                  />
                </Field>
              ) : null}

              <Field
                label="Institutional email"
                name="registration-email"
                error={firstError(fieldErrors, 'email')}
              >
                <input
                  id="registration-email"
                  className="cf-auth__input"
                  type="email"
                  autoComplete="email"
                  required
                  value={values.email}
                  onChange={(event) => update('email', event.target.value)}
                />
              </Field>
            </fieldset>

            {accountType === 'student' ? (
              <fieldset className="cf-auth__fieldset">
                <legend className="cf-auth__legend">Academic placement</legend>

                <div className="cf-auth__grid">
                  <SelectField
                    label="Program"
                    name="registration-program"
                    value={values.program_id}
                    error={firstError(fieldErrors, 'program_id')}
                    disabled={!options?.programs.length}
                    wide
                    onChange={(value) => {
                      update('program_id', value)
                      update('year_level_id', '')
                      update('section_id', '')
                    }}
                  >
                    <option value="">Select a program</option>
                    {options?.programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.code} · {program.name}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField
                    label="Year level"
                    name="registration-year-level"
                    value={values.year_level_id}
                    error={firstError(fieldErrors, 'year_level_id')}
                    disabled={!values.program_id || !availableYearLevels.length}
                    onChange={(value) => {
                      update('year_level_id', value)
                      update('section_id', '')
                    }}
                  >
                    <option value="">Select a year level</option>
                    {availableYearLevels.map((yearLevel) => (
                      <option key={yearLevel.id} value={yearLevel.id}>
                        {yearLevel.name}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField
                    label="Section"
                    name="registration-section"
                    value={values.section_id}
                    error={firstError(fieldErrors, 'section_id')}
                    disabled={!values.year_level_id || !availableSections.length}
                    onChange={(value) => update('section_id', value)}
                  >
                  <option value="">Select a section</option>
                  {availableSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.code}
                      {section.name ? ` · ${section.name}` : ''}
                    </option>
                  ))}
                </SelectField>
              </div>
            </fieldset>
          ) : (
            <fieldset className="cf-auth__fieldset">
              <legend className="cf-auth__legend">Professional information</legend>

              <div className="cf-auth__grid">
                <SelectField
                  label="Employment type"
                  name="registration-employment-type"
                  value={values.employment_type}
                  onChange={(value) =>
                    update('employment_type', value as Values['employment_type'])
                  }
                >
                  <option value="full_time">Full-time Professor</option>
                  <option value="part_time">Part-time Professor</option>
                </SelectField>
                <SelectField
                  label="Department affiliation"
                  name="registration-affiliation"
                  value={values.department_affiliation}
                  error={firstError(fieldErrors, 'department_affiliation')}
                  onChange={(value) => {
                    const affiliation = value as Values['department_affiliation']
                    const ccsDepartment = options?.departments.find(
                      (department) => department.code === 'CCS',
                    )
                    update('department_affiliation', affiliation)
                    update(
                      'department_id',
                      affiliation === 'ccs' && ccsDepartment
                        ? String(ccsDepartment.id)
                        : '',
                    )
                  }}
                >
                  <option value="">Select affiliation</option>
                  <option value="ccs">College of Computer Studies (CCS)</option>
                  <option value="other">Other Department</option>
                </SelectField>
                {values.department_affiliation === 'other' ? (
                  <SelectField
                    label="Other department"
                    name="registration-department"
                    value={values.department_id}
                    error={firstError(fieldErrors, 'department_id')}
                    disabled={!availableDepartments.length}
                    onChange={(value) => update('department_id', value)}
                    wide
                  >
                    <option value="">
                      {availableDepartments.length
                        ? 'Select a department'
                        : 'No other departments are configured yet'}
                    </option>
                    {availableDepartments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </SelectField>
                ) : null}
              </div>
            </fieldset>
          )}

          {!isCorrectionVerified ? (
            <fieldset className="cf-auth__fieldset">
              <legend className="cf-auth__legend">Security</legend>

              <div className="cf-auth__grid">
                <Field
                  label="Password"
                  name="registration-password"
                  error={firstError(fieldErrors, 'password')}
                  hint="At least 12 characters."
                >
                  <input
                    id="registration-password"
                    className="cf-auth__input"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    required
                    value={values.password}
                    onChange={(event) => update('password', event.target.value)}
                  />
                </Field>
                <Field
                  label="Confirm password"
                  name="registration-confirm-password"
                  error={firstError(fieldErrors, 'password_confirmation')}
                >
                  <input
                    id="registration-confirm-password"
                    className="cf-auth__input"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    required
                    value={values.password_confirmation}
                    aria-invalid={Boolean(
                      firstError(fieldErrors, 'password_confirmation'),
                    )}
                    onChange={(event) =>
                      update('password_confirmation', event.target.value)
                    }
                  />
                </Field>
              </div>
            </fieldset>
          ) : null}

          <button
            className="cf-auth__submit"
            type="submit"
            disabled={
              isSubmitting ||
              isLoadingOptions ||
              (accountType === 'professor' &&
                (!options?.departments.some(
                  (department) => department.code === 'CCS',
                ) ||
                  (values.department_affiliation === 'other' &&
                    !availableDepartments.length)))
            }
          >
            {isSubmitting
              ? 'Submitting…'
              : isCorrectionMode
                ? 'Resubmit registration'
                : 'Create account'}
          </button>
          </form>
        ) : null}
      </div>
    </div>
  )
}

interface FieldProps {
  label: string
  name: string
  error?: string
  hint?: string
  wide?: boolean
  children: ReactNode
}

function Field({ label, name, error, hint, wide = false, children }: FieldProps) {
  return (
    <div className={wide ? 'cf-auth__field cf-auth__field--wide' : 'cf-auth__field'}>
      <label className="cf-auth__label" htmlFor={name}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="cf-auth__field-error">{error}</p>
      ) : hint ? (
        <p className="cf-auth__hint">{hint}</p>
      ) : null}
    </div>
  )
}

interface SelectFieldProps {
  label: string
  name: string
  value: string
  error?: string
  disabled?: boolean
  wide?: boolean
  onChange: (value: string) => void
  children: ReactNode
}

function SelectField({
  label,
  name,
  value,
  error,
  disabled = false,
  wide = false,
  onChange,
  children,
}: SelectFieldProps) {
  return (
    <div className={wide ? 'cf-auth__field cf-auth__field--wide' : 'cf-auth__field'}>
      <label className="cf-auth__label" htmlFor={name}>
        {label}
      </label>
      <div className="cf-auth__control">
        <select
          id={name}
          className="cf-auth__input"
          required
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChange(event.target.value)}
        >
          {children}
        </select>
        <span className="cf-auth__select-chevron" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none">
            <path
              d="M6 8.5 10 12.5 14 8.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      {error ? <p className="cf-auth__field-error">{error}</p> : null}
    </div>
  )
}
