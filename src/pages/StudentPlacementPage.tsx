import { useEffect, useMemo, useState } from 'react'
import { GraduationCap, History, MapPin, UserRound } from 'lucide-react'
import { Alert } from '@/components/common/Alert'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeading } from '@/components/common/PageHeading'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { fetchMyPlacement, submitMajorSelection } from '@/services/api/placement'
import type { MajorSelectionEligibility, StudentPlacementOverview } from '@/types/placement'
import { getApiErrorMessage, getApiFieldErrors } from '@/utils/apiError'

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function selectionTone(status: string): 'success' | 'danger' | 'warning' | 'neutral' {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'danger'
  if (status === 'submitted') return 'warning'
  return 'neutral'
}

function eligibilityNotice(
  eligibility: MajorSelectionEligibility,
): { tone: 'info' | 'warning'; title: string; message: string } | null {
  if (eligibility.eligible) return null

  switch (eligibility.reason) {
    case 'major_already_assigned':
      return {
        tone: 'info',
        title: 'Major already assigned',
        message: 'Your assigned major carries forward. Major selection is not needed again.',
      }
    case 'not_yet_eligible':
      return {
        tone: 'info',
        title: 'Selection opens during third-year transition',
        message: 'You can choose a major when you are promoted from second year into third year.',
      }
    case 'not_eligible':
      return {
        tone: 'info',
        title: 'Major selection is not available',
        message: 'Major selection is only available during the transition into third year.',
      }
    case 'placement_missing':
      return {
        tone: 'warning',
        title: 'Placement required',
        message: 'A current academic placement is required before you can select a major.',
      }
    case 'target_level_missing':
      return {
        tone: 'warning',
        title: 'Third-year level not configured',
        message: 'The third-year level must be configured before major selection can open.',
      }
    default:
      return {
        tone: 'warning',
        title: 'Major selection unavailable',
        message: 'Contact your program office if you believe this is incorrect.',
      }
  }
}

export function StudentPlacementPage() {
  useDocumentTitle('My placement')
  const [overview, setOverview] = useState<StudentPlacementOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedPeriodId, setSelectedPeriodId] = useState('')
  const [selectedMajorId, setSelectedMajorId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [refreshVersion, setRefreshVersion] = useState(0)

  useEffect(() => {
    let active = true
    void fetchMyPlacement()
      .then((result) => {
        if (!active) return
        setOverview(result)
        setLoadError(null)
        const periodId = result.major_selection_periods[0]?.id ?? result.major_selection?.period?.id
        setSelectedPeriodId(periodId ? String(periodId) : '')
        setSelectedMajorId(
          result.major_selection?.major?.id
            ? String(result.major_selection.major.id)
            : result.major_options[0]?.id
              ? String(result.major_options[0].id)
              : '',
        )
      })
      .catch((failure: unknown) => {
        if (active) setLoadError(getApiErrorMessage(failure, 'Unable to load your academic placement.'))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [refreshVersion])

  const selectedPeriod = useMemo(
    () => overview?.major_selection_periods.find((period) => String(period.id) === selectedPeriodId) ?? null,
    [overview, selectedPeriodId],
  )

  const existingSelection = overview?.major_selection ?? null
  const eligibility = overview?.major_selection_eligibility ?? null
  const notice = eligibility ? eligibilityNotice(eligibility) : null
  const canChangeSelection =
    eligibility?.eligible === true &&
    selectedPeriod !== null &&
    (existingSelection === null || selectedPeriod.allow_changes)

  async function handleSubmit() {
    if (!selectedPeriod || !selectedMajorId) return

    setIsSaving(true)
    setActionError(null)
    setSuccess(null)

    try {
      await submitMajorSelection(selectedPeriod.id, Number(selectedMajorId))
      setSuccess('Your major selection has been recorded and will lock when the window closes.')
      setRefreshVersion((version) => version + 1)
    } catch (failure) {
      setActionError(
        Object.values(getApiFieldErrors(failure)).flat()[0] ??
          getApiErrorMessage(failure, 'Unable to submit your major selection.'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <PageHeading
        eyebrow="Academic placement"
        title="My placement"
        description="Review your current year level, major, and section, and choose a major when a selection window is open."
        actions={
          <Button
            variant="outline"
            onClick={() => setRefreshVersion((version) => version + 1)}
          >
            Refresh
          </Button>
        }
      />

      {loadError ? (
        <Alert tone="danger" title="Placement unavailable" className="mt-6">
          {loadError}
        </Alert>
      ) : isLoading ? (
        <p role="status" className="mt-10 text-center text-sm text-ink-muted">
          Loading your placement…
        </p>
      ) : overview ? (
        <div className="mt-6 space-y-5">
          {success ? (
            <Alert tone="success" title="Selection submitted">
              {success}
            </Alert>
          ) : null}
          {actionError ? (
            <Alert tone="danger" title="Unable to save selection">
              {actionError}
            </Alert>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
            <Card>
              <CardHeader className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink">Current placement</h2>
                <GraduationCap className="size-5 text-gold-700" aria-hidden="true" />
              </CardHeader>
              <CardBody>
                {overview.current_placement ? (
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Academic year</dt>
                      <dd className="mt-1 text-sm font-semibold text-ink">
                        {overview.current_placement.academic_year?.label ?? '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Term</dt>
                      <dd className="mt-1 text-sm text-ink">
                        {overview.current_placement.academic_term?.name ?? '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Year level</dt>
                      <dd className="mt-1 text-sm text-ink">
                        {overview.current_placement.year_level?.name ?? '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Major</dt>
                      <dd className="mt-1 text-sm text-ink">
                        {overview.current_placement.major
                          ? `${overview.current_placement.major.code} · ${overview.current_placement.major.name}`
                          : 'Not yet assigned'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Section</dt>
                      <dd className="mt-1 flex items-center gap-1.5 text-sm text-ink">
                        <MapPin className="size-4 text-brand-700" aria-hidden="true" />
                        {overview.current_placement.section?.code ?? 'Unassigned'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Effective on</dt>
                      <dd className="mt-1 text-sm text-ink">{overview.current_placement.effective_on ?? '—'}</dd>
                    </div>
                  </dl>
                ) : (
                  <EmptyState
                    icon={UserRound}
                    title="No placement yet"
                    description="Your academic placement will appear after registration or promotion is finalized."
                  />
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink">Major selection</h2>
                {existingSelection ? (
                  <Badge tone={selectionTone(existingSelection.status)}>{existingSelection.status}</Badge>
                ) : eligibility?.eligible ? (
                  <Badge tone="neutral">Not selected</Badge>
                ) : (
                  <Badge tone={eligibility?.has_major ? 'success' : 'neutral'}>
                    {eligibility?.has_major ? 'Assigned' : 'Not available'}
                  </Badge>
                )}
              </CardHeader>
              <CardBody>
                {notice ? (
                  <Alert tone={notice.tone} title={notice.title} className="mb-4">
                    {notice.message}
                  </Alert>
                ) : null}

                {existingSelection ? (
                  <div className="rounded-lg border border-line bg-surface-subtle p-4">
                    <p className="text-sm font-semibold text-ink">
                      {existingSelection.major
                        ? `${existingSelection.major.code} · ${existingSelection.major.name}`
                        : 'No major recorded'}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Submitted {formatDate(existingSelection.selected_at)}
                    </p>
                    {existingSelection.remarks ? (
                      <p className="mt-2 text-xs text-ink-muted">Remarks: {existingSelection.remarks}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-ink-muted">
                      {existingSelection.status === 'submitted'
                        ? 'Your selection is recorded and will lock when the window closes.'
                        : existingSelection.status === 'approved'
                          ? 'Your major is confirmed and carries forward into fourth year.'
                          : 'Your selection was rejected. You can choose again while a window is open.'}
                    </p>
                  </div>
                ) : eligibility?.eligible ? (
                  <p className="text-sm text-ink-muted">
                    You have not submitted a major selection for an open selection window.
                  </p>
                ) : null}

                {eligibility?.eligible ? (
                  overview.major_selection_periods.length === 0 ? (
                    <p className="mt-4 rounded-lg border border-dashed border-line px-4 py-5 text-sm text-ink-muted">
                      No major selection window is open for your program right now.
                      {existingSelection ? ' Your recorded selection remains locked.' : ' The next window will be announced.'}
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {overview.major_selection_periods.length > 1 ? (
                        <div className="space-y-1.5">
                          <label htmlFor="major-period" className="block text-sm font-medium text-ink">
                            Selection period
                          </label>
                          <select
                            id="major-period"
                            value={selectedPeriodId}
                            onChange={(event) => setSelectedPeriodId(event.target.value)}
                            className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                          >
                            {overview.major_selection_periods.map((period) => (
                              <option key={period.id} value={period.id}>
                                {period.academic_year?.label ?? 'Academic year'} · {period.target_year_level?.name ?? 'Target level'}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}

                      {selectedPeriod?.academic_year ? (
                        <p className="text-xs text-ink-muted">
                          Selecting for {selectedPeriod.target_year_level?.name ?? 'third year'} in {selectedPeriod.academic_year.label}.
                        </p>
                      ) : null}

                      <div className="space-y-1.5">
                        <label htmlFor="major-option" className="block text-sm font-medium text-ink">
                          Major
                        </label>
                        <select
                          id="major-option"
                          value={selectedMajorId}
                          disabled={!canChangeSelection}
                          onChange={(event) => setSelectedMajorId(event.target.value)}
                          className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-stone-50 disabled:text-ink-muted"
                        >
                          <option value="">Select a major</option>
                          {overview.major_options.map((major) => (
                            <option key={major.id} value={major.id}>
                              {major.code} — {major.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedPeriod?.closes_at ? (
                        <p className="text-xs text-ink-muted">
                          Closes {formatDate(selectedPeriod.closes_at)}
                          {selectedPeriod.allow_changes ? ' · changes allowed before closing' : ' · changes locked'}
                        </p>
                      ) : null}

                      <Button
                        className="w-full"
                        isLoading={isSaving}
                        disabled={!canChangeSelection || !selectedMajorId}
                        onClick={() => void handleSubmit()}
                      >
                        {existingSelection ? 'Update major selection' : 'Submit major selection'}
                      </Button>
                      {!canChangeSelection && existingSelection ? (
                        <p className="text-xs text-ink-muted">
                          This window no longer allows changes. Contact your program office if you need help.
                        </p>
                      ) : null}
                    </div>
                  )
                ) : null}
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink">Placement history</h2>
              <History className="size-5 text-gold-700" aria-hidden="true" />
            </CardHeader>
            <CardBody>
              {overview.placement_history.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="No placement history"
                  description="Placements will appear here after your registration or promotion is recorded."
                />
              ) : (
                <div className="overflow-x-auto rounded-lg border border-line">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-surface-subtle text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      <tr>
                        <th className="px-4 py-3">Academic year / term</th>
                        <th className="px-4 py-3">Year level</th>
                        <th className="px-4 py-3">Major</th>
                        <th className="px-4 py-3">Section</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {overview.placement_history.map((placement) => (
                        <tr key={placement.id}>
                          <td className="px-4 py-3 text-ink-muted">
                            <p className="text-ink">{placement.academic_year?.label ?? '—'}</p>
                            <p className="mt-0.5 text-xs">{placement.academic_term?.name ?? '—'}</p>
                          </td>
                          <td className="px-4 py-3 text-ink-muted">{placement.year_level?.name ?? '—'}</td>
                          <td className="px-4 py-3 text-ink-muted">
                            {placement.major ? `${placement.major.code} · ${placement.major.name}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-ink-muted">{placement.section?.code ?? 'Unassigned'}</td>
                          <td className="px-4 py-3">
                            <Badge tone={placement.is_current ? 'success' : 'neutral'}>
                              {placement.is_current ? 'current' : placement.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
