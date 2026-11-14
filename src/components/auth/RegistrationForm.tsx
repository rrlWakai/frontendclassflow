import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
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
      <div className="classflow-register">
        <h1 className="classflow-register__title">Registration complete</h1>
        <p className="classflow-register__success" role="status">{success}</p>
        <button type="button" className="classflow-login__submit" onClick={onBack}>
          Back to sign in <ArrowLeft aria-hidden="true" />
        </button>
      </div>
    )
  }

  return (
    <div className="classflow-register">
      <button type="button" className="classflow-register__back" onClick={onBack}>
        <ArrowLeft aria-hidden="true" /> Back to sign in
      </button>
      <h1 className="classflow-register__title">Create an account</h1>

      <div className="classflow-register__types" role="group" aria-label="Account type">
        {(['student', 'professor'] as const).map((type) => (
          <button
            key={type}
            type="button"
            className={accountType === type ? 'is-selected' : ''}
            aria-pressed={accountType === type}
            onClick={() => {
              setAccountType(type)
              setIsCorrectionMode(false)
              setIsCorrectionVerified(false)
              setValues(initialValues)
              setError(null)
              setFieldErrors({})
            }}
          >
            {type === 'student' ? 'Student' : 'Professor'}
          </button>
        ))}
      </div>

      {isLoadingOptions ? (
        <p className="classflow-register__message" role="status">Loading registration options…</p>
      ) : null}
      {error ? <p className="classflow-login__error" role="alert">{error}</p> : null}

      {accountType === 'professor' && !isCorrectionMode ? (
        <button type="button" className="classflow-register__text-button" onClick={startCorrectionMode}>
          Resubmit a returned professor registration
        </button>
      ) : null}

      {isCorrectionMode && !isCorrectionVerified ? (
        <form className="classflow-login__form" onSubmit={(event) => void loadCorrection(event)}>
          <p className="classflow-register__message">
            Verify the institutional email and current password used for the returned registration.
          </p>
          <Field label="Institutional email" name="correction-email" error={firstError(fieldErrors, 'email')}>
            <input
              id="correction-email"
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
              type="password"
              autoComplete="current-password"
              required
              value={correctionPassword}
              onChange={(event) => setCorrectionPassword(event.target.value)}
            />
          </Field>
          <button type="submit" className="classflow-login__submit" disabled={isSubmitting}>
            {isSubmitting ? 'Checking…' : 'Load returned registration'}
          </button>
        </form>
      ) : null}

      {(!isCorrectionMode || isCorrectionVerified) ? (
        <form className="classflow-login__form" onSubmit={(event) => void submitRegistration(event)}>
          {correctionReason ? (
            <div className="classflow-register__correction" role="status">
              <strong>Requested correction</strong>
              <p>{correctionReason}</p>
            </div>
          ) : null}

          <Field label="Full name" name="registration-name" error={firstError(fieldErrors, 'name')}>
            <input
              id="registration-name"
              type="text"
              autoComplete="name"
              required
              value={values.name}
              onChange={(event) => update('name', event.target.value)}
            />
          </Field>

          {accountType === 'student' ? (
            <Field label="Student number" name="registration-student-number" error={firstError(fieldErrors, 'student_number')}>
              <input
                id="registration-student-number"
                type="text"
                autoComplete="off"
                maxLength={32}
                required
                value={values.student_number}
                onChange={(event) => update('student_number', event.target.value)}
              />
            </Field>
          ) : null}

          <Field label="Institutional email" name="registration-email" error={firstError(fieldErrors, 'email')}>
            <input
              id="registration-email"
              type="email"
              autoComplete="email"
              required
              value={values.email}
              onChange={(event) => update('email', event.target.value)}
            />
          </Field>

          {!isCorrectionVerified ? (
            <>
              <Field label="Password" name="registration-password" error={firstError(fieldErrors, 'password')}>
                <input
                  id="registration-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  required
                  value={values.password}
                  onChange={(event) => update('password', event.target.value)}
                />
              </Field>
              <Field label="Confirm password" name="registration-confirm-password">
                <input
                  id="registration-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  required
                  value={values.password_confirmation}
                  aria-invalid={Boolean(firstError(fieldErrors, 'password_confirmation'))}
                  onChange={(event) => update('password_confirmation', event.target.value)}
                />
                {firstError(fieldErrors, 'password_confirmation') ? (
                  <p className="classflow-register__field-error">
                    {firstError(fieldErrors, 'password_confirmation')}
                  </p>
                ) : null}
              </Field>
            </>
          ) : null}

          {accountType === 'student' ? (
            <>
              <SelectField
                label="Program"
                name="registration-program"
                value={values.program_id}
                error={firstError(fieldErrors, 'program_id')}
                disabled={!options?.programs.length}
                onChange={(value) => {
                  update('program_id', value)
                  update('year_level_id', '')
                  update('section_id', '')
                }}
              >
                <option value="">Select a program</option>
                {options?.programs.map((program) => (
                  <option key={program.id} value={program.id}>{program.code} · {program.name}</option>
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
                  <option key={yearLevel.id} value={yearLevel.id}>{yearLevel.name}</option>
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
                    {section.code}{section.name ? ` · ${section.name}` : ''}
                  </option>
                ))}
              </SelectField>
            </>
          ) : (
            <>
              <SelectField
                label="Employment type"
                name="registration-employment-type"
                value={values.employment_type}
                onChange={(value) => update('employment_type', value as Values['employment_type'])}
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
                    affiliation === 'ccs' && ccsDepartment ? String(ccsDepartment.id) : '',
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
                >
                  <option value="">
                    {availableDepartments.length ? 'Select a department' : 'No configured departments available'}
                  </option>
                  {availableDepartments.map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </SelectField>
              ) : null}
            </>
          )}

          <button
            className="classflow-login__submit"
            type="submit"
            disabled={
              isSubmitting ||
              isLoadingOptions ||
              (accountType === 'professor' &&
                (!options?.departments.some((department) => department.code === 'CCS') ||
                  (values.department_affiliation === 'other' && !availableDepartments.length)))
            }
          >
            {isSubmitting ? 'Submitting…' : isCorrectionMode ? 'Resubmit registration' : 'Create account'}
          </button>
        </form>
      ) : null}
    </div>
  )
}

interface FieldProps {
  label: string
  name: string
  error?: string
  children: ReactNode
}

function Field({ label, name, error, children }: FieldProps) {
  return (
    <div className="classflow-login__field">
      <label htmlFor={name}>{label}</label>
      {children}
      {error ? <p className="classflow-register__field-error">{error}</p> : null}
    </div>
  )
}

interface SelectFieldProps {
  label: string
  name: string
  value: string
  error?: string
  disabled?: boolean
  onChange: (value: string) => void
  children: ReactNode
}

function SelectField({
  label,
  name,
  value,
  error,
  disabled = false,
  onChange,
  children,
}: SelectFieldProps) {
  return (
    <div className="classflow-login__field">
      <label htmlFor={name}>{label}</label>
      <select
        id={name}
        required
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
      {error ? <p className="classflow-register__field-error">{error}</p> : null}
    </div>
  )
}
