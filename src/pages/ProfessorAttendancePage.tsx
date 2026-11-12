import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { CalendarDays, ClipboardCheck, QrCode } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card, CardHeader } from '@/components/common/Card'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeading } from '@/components/common/PageHeading'
import { ProfessorQrPanel } from '@/components/attendance/ProfessorQrPanel'
import { useSchedules } from '@/hooks/useSchedules'
import {
  createAttendanceSession,
  fetchAttendanceSession,
  fetchMyAttendanceSessions,
  saveAttendanceRecords,
  updateAttendanceSessionStatus,
} from '@/services/api/attendance'
import type {
  AttendanceSession,
  AttendanceSessionDetail,
  AttendanceStatus,
} from '@/types/attendance'
import { getApiErrorMessage, getApiFieldErrors } from '@/utils/apiError'

interface AttendanceDraft {
  status: AttendanceStatus | ''
  checkInAt: string
  remarks: string
}

const statuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused']

function localDateValue(): string {
  const date = new Date()
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function ProfessorAttendancePage() {
  const { schedules, loading: schedulesLoading, error: schedulesError } = useSchedules()
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [selectedScheduleId, setSelectedScheduleId] = useState('')
  const [classDate, setClassDate] = useState(localDateValue)
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [detail, setDetail] = useState<AttendanceSessionDetail | null>(null)
  const [showQr, setShowQr] = useState(false)
  const [drafts, setDrafts] = useState<Record<number, AttendanceDraft>>({})
  const [correctionReason, setCorrectionReason] = useState('')
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [confirmDialog, setConfirmDialog] = useState<{
    variant: 'confirm' | 'prompt'
    title: string
    description?: string
    confirmLabel: string
    cancelLabel: string
    destructive: boolean
    inputLabel?: string
    inputPlaceholder?: string
    inputValue?: string
    onConfirm: (value: string) => void
  } | null>(null)

  useEffect(() => {
    let active = true
    void fetchMyAttendanceSessions()
      .then((result) => {
        if (active) setSessions(result)
      })
      .catch((failure: unknown) => {
        if (active) setError(getApiErrorMessage(failure, 'Unable to load your attendance sessions.'))
      })
      .finally(() => {
        if (active) setIsLoadingSessions(false)
      })

    return () => {
      active = false
    }
  }, [refreshVersion])

  useEffect(() => {
    if (selectedSessionId === null) return

    let active = true
    void Promise.resolve()
      .then(() => {
        if (!active) return
        setIsLoadingDetail(true)
        setError(null)
        return fetchAttendanceSession(selectedSessionId)
      })
      .then((result) => {
        if (!active || !result) return
        setDetail(result)
        setDrafts(Object.fromEntries(result.roster.map((entry) => [
          entry.student_subject_enrollment_id,
          {
            status: entry.attendance?.status ?? '',
            checkInAt: entry.attendance?.check_in_at ?? '',
            remarks: entry.attendance?.remarks ?? '',
          },
        ])))
        setCorrectionReason('')
      })
      .catch((failure: unknown) => {
        if (active) setError(getApiErrorMessage(failure, 'Unable to load this attendance session.'))
      })
      .finally(() => {
        if (active) setIsLoadingDetail(false)
      })

    return () => {
      active = false
    }
  }, [selectedSessionId])

  const activeScheduleId = selectedScheduleId || (schedules[0] ? String(schedules[0].id) : '')

  async function handleCreateSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeScheduleId) return

    setIsCreating(true)
    setDetail(null)
    setShowQr(false)
    setIsLoadingDetail(true)
    setError(null)
    setFieldErrors({})
    try {
      const session = await createAttendanceSession(Number(activeScheduleId), classDate)
      setSelectedSessionId(session.id)
      setRefreshVersion((version) => version + 1)
    } catch (failure) {
      setError(getApiErrorMessage(failure, 'Unable to create the attendance session.'))
      setFieldErrors(getApiFieldErrors(failure))
    } finally {
      setIsCreating(false)
      setIsLoadingDetail(false)
    }
  }

  function updateDraft(
    enrollmentId: number,
    field: keyof AttendanceDraft,
    value: AttendanceDraft[keyof AttendanceDraft],
  ) {
    setDrafts((current) => ({
      ...current,
      [enrollmentId]: { ...current[enrollmentId], [field]: value },
    }))
  }

  function recordsPayload() {
    if (!detail) return []

    return detail.roster.flatMap((entry) => {
      const draft = drafts[entry.student_subject_enrollment_id]
      if (!draft?.status) return []
      if (detail.session.status === 'submitted' && !entry.attendance) return []

      return [{
        student_subject_enrollment_id: entry.student_subject_enrollment_id,
        status: draft.status,
        check_in_at: draft.checkInAt || null,
        remarks: draft.remarks.trim() || null,
      }]
    })
  }

  const allStudentsMarked = Boolean(detail?.roster.length) && detail?.roster.every(
    (entry) => Boolean(drafts[entry.student_subject_enrollment_id]?.status),
  )

  function attendanceCounts() {
    if (!detail) return { total: 0, marked: 0, present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 }

    let marked = 0
    let present = 0
    let absent = 0
    let late = 0
    let excused = 0

    detail.roster.forEach((entry) => {
      const draft = drafts[entry.student_subject_enrollment_id]
      const status = draft?.status ?? entry.attendance?.status
      if (status) {
        marked += 1
        if (status === 'present') present += 1
        if (status === 'absent') absent += 1
        if (status === 'late') late += 1
        if (status === 'excused') excused += 1
      }
    })

    return {
      total: detail.roster.length,
      marked,
      present,
      absent,
      late,
      excused,
      unmarked: detail.roster.length - marked,
    }
  }

  function unmarkedEnrollmentIds() {
    if (!detail) return []
    return detail.roster
      .filter((entry) => !drafts[entry.student_subject_enrollment_id]?.status)
      .map((entry) => entry.student_subject_enrollment_id)
  }

  async function markAllPresent() {
    if (!detail || detail.session.status !== 'open') return

    const ids = unmarkedEnrollmentIds()
    if (ids.length === 0) return

    setConfirmDialog({
      variant: 'confirm',
      title: 'Mark all present',
      description: `Mark ${ids.length} unmarked student${ids.length === 1 ? '' : 's'} as Present. Already assigned statuses (Absent, Late, Excused) will be preserved.`,
      confirmLabel: 'Mark all present',
      cancelLabel: 'Cancel',
      destructive: false,
      onConfirm: () => {
        setDrafts((current) => {
          const next = { ...current }
          ids.forEach((id) => {
            next[id] = { status: 'present', checkInAt: '', remarks: '' }
          })
          return next
        })
        setConfirmDialog(null)
      },
    })
  }

  async function handleSave(submitSession = false) {
    if (!detail || !allStudentsMarked) return

    setIsSaving(true)
    setError(null)
    setFieldErrors({})
    try {
      await saveAttendanceRecords(
        detail.session.id,
        recordsPayload(),
        detail.session.status === 'submitted' ? correctionReason.trim() : undefined,
      )

      if (submitSession) {
        await updateAttendanceSessionStatus(detail.session.id, 'submitted')
      }

      setDetail(await fetchAttendanceSession(detail.session.id))
      setCorrectionReason('')
      setRefreshVersion((version) => version + 1)
    } catch (failure) {
      setError(getApiErrorMessage(failure, 'Unable to save attendance.'))
      setFieldErrors(getApiFieldErrors(failure))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCancelSession() {
    if (!detail) return

    setConfirmDialog({
      variant: 'confirm',
      title: 'Cancel attendance session',
      description: 'Its records will be retained and the session will no longer accept check-ins.',
      confirmLabel: 'Cancel session',
      cancelLabel: 'Keep session',
      destructive: true,
      onConfirm: () => {
        setConfirmDialog({
          variant: 'prompt',
          title: 'Cancellation reason',
          description: 'Provide a reason for cancelling this session.',
          confirmLabel: 'Confirm cancellation',
          cancelLabel: 'Back',
          destructive: true,
          inputLabel: 'Reason',
          inputPlaceholder: 'Why is this session being cancelled?',
          onConfirm: async (reason) => {
            setConfirmDialog(null)
            if (!reason || reason.trim().length < 3) return
            setIsSaving(true)
            setError(null)
            try {
              await updateAttendanceSessionStatus(detail.session.id, 'cancelled', reason.trim())
              setDetail(await fetchAttendanceSession(detail.session.id))
              setRefreshVersion((version) => version + 1)
            } catch (failure) {
              setError(getApiErrorMessage(failure, 'Unable to cancel this session.'))
            } finally {
              setIsSaving(false)
            }
          },
        })
      },
    })
  }

  return (
    <div>
      <PageHeading
        eyebrow="Professor workspace"
        title="Attendance"
        description="Record attendance for your assigned published classes and review your session history."
        actions={<Badge tone="flow">My classes</Badge>}
      />

      {error ? (
        <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{error}</p>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(19rem,0.8fr)_minmax(0,1.8fr)]">
        <div className="space-y-5">
          <Card className="p-5">
            <CardHeader>
              <h2 className="text-base font-semibold text-ink">Start a class session</h2>
              <p className="mt-1 text-xs leading-5 text-ink-muted">
                Only your assigned published schedules are available.
              </p>
            </CardHeader>
            {schedulesError ? (
              <p role="alert" className="mt-3 text-sm text-red-700">{schedulesError}</p>
            ) : schedulesLoading ? (
              <p role="status" className="mt-4 text-sm text-ink-muted">Loading assigned classes…</p>
            ) : schedules.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No assigned classes"
                description="Attendance entry is available after a schedule is published for your assignment."
              />
            ) : (
              <form className="mt-4 space-y-4" onSubmit={(event) => void handleCreateSession(event)}>
                <label className="block space-y-1.5 text-sm font-medium text-ink">
                  Published class
                  <select
                    value={activeScheduleId}
                    onChange={(event) => setSelectedScheduleId(event.target.value)}
                    className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm"
                  >
                    {schedules.map((schedule) => (
                      <option key={schedule.id} value={schedule.id}>
                        {schedule.offering.subject.code} · {schedule.offering.section.code} · {schedule.start_time}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5 text-sm font-medium text-ink">
                  Class date
                  <input
                    type="date"
                    required
                    max={localDateValue()}
                    min={schedules.find((schedule) => String(schedule.id) === activeScheduleId)?.offering.academic_term.starts_on}
                    value={classDate}
                    onChange={(event) => setClassDate(event.target.value)}
                    className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm"
                  />
                </label>
                {fieldErrors.class_date?.[0] ? (
                  <p className="text-xs font-medium text-red-600">{fieldErrors.class_date[0]}</p>
                ) : null}
                <Button type="submit" className="w-full" isLoading={isCreating}>
                  Create attendance session
                </Button>
              </form>
            )}
          </Card>

          <Card className="p-5">
            <CardHeader>
              <h2 className="text-base font-semibold text-ink">My sessions</h2>
            </CardHeader>
            {isLoadingSessions ? (
              <p role="status" className="py-8 text-center text-sm text-ink-muted">Loading sessions…</p>
            ) : sessions.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="No sessions yet"
                description="Created sessions will appear here."
              />
            ) : (
              <ul className="mt-3 space-y-2">
                {sessions.map((session) => (
                  <li key={session.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setDetail(null)
                        setShowQr(false)
                        setIsLoadingDetail(true)
                        setError(null)
                        setSelectedSessionId(session.id)
                      }}
                      className={[
                        'w-full rounded-xl border p-3 text-left transition',
                        selectedSessionId === session.id
                          ? 'border-flow-400 bg-flow-50'
                          : 'border-line bg-white hover:bg-canvas',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            {session.offering.subject.code} · {session.offering.section.code}
                          </p>
                          <p className="mt-1 text-xs text-ink-muted">
                            {session.class_date} · {session.offering.academic_term.name}
                          </p>
                        </div>
                        <Badge tone={session.status === 'submitted' ? 'success' : session.status === 'cancelled' ? 'danger' : 'neutral'}>
                          {session.status}
                        </Badge>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="min-w-0 p-5">
          {selectedSessionId === null ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Select or create a session"
              description="Open a session to record attendance, submit the roster, or review previous records."
            />
          ) : isLoadingDetail ? (
            <p role="status" className="py-16 text-center text-sm text-ink-muted">Loading session roster…</p>
          ) : detail ? (
            <div className="space-y-5">
              <CardHeader className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                    {detail.session.class_date} · {detail.session.offering.academic_term.name}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-ink">
                    {detail.session.offering.subject.code} · {detail.session.offering.section.code}
                  </h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    {detail.session.schedule.start_time}–{detail.session.schedule.end_time}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {detail.session.status === 'open' ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant={showQr ? 'secondary' : 'outline'}
                        onClick={() => setShowQr((current) => !current)}
                      >
                        <QrCode className="size-4" aria-hidden="true" />
                        {showQr ? 'Hide QR' : 'QR attendance'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={unmarkedEnrollmentIds().length === 0 || isSaving}
                        onClick={() => void markAllPresent()}
                      >
                        Mark all present
                      </Button>
                    </>
                  ) : null}
                  <Badge tone={detail.session.status === 'submitted' ? 'success' : detail.session.status === 'cancelled' ? 'danger' : 'neutral'}>
                    {detail.session.status}
                  </Badge>
                </div>
              </CardHeader>

              {detail.session.status === 'open' && detail ? (
                <div className="rounded-xl border border-line bg-canvas/60 p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
                      Attendance progress
                    </span>
                    <span className="text-sm font-semibold text-ink">
                      {attendanceCounts().marked} of {attendanceCounts().total} marked
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-flow-500 transition-all duration-300"
                      style={{ width: `${detail.roster.length ? Math.round((attendanceCounts().marked / detail.roster.length) * 100) : 0}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs leading-5">
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                      <span className="text-emerald-800">{attendanceCounts().present} present</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-red-500" aria-hidden="true" />
                      <span className="text-red-700">{attendanceCounts().absent} absent</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                      <span className="text-amber-800">{attendanceCounts().late} late</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-flow-500" aria-hidden="true" />
                      <span className="text-flow-800">{attendanceCounts().excused} excused</span>
                    </span>
                    {attendanceCounts().unmarked > 0 ? (
                      <span className="flex items-center justify-end gap-1 text-right">
                        <span className="size-1.5 rounded-full bg-ink-muted" aria-hidden="true" />
                        <span className="text-ink-muted font-medium">{attendanceCounts().unmarked} unmarked</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {showQr && detail.session.status === 'open' ? (
                <ProfessorQrPanel
                  key={detail.session.id}
                  session={detail.session}
                  onClose={() => setShowQr(false)}
                />
              ) : null}

              {detail.session.status === 'cancelled' ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  Cancelled: {detail.session.cancellation_reason}
                </p>
              ) : null}

              <div className="overflow-x-auto rounded-lg border border-line">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-white text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    <tr>
                      <th className="px-3 py-3">Student</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Check-in</th>
                      <th className="px-3 py-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {detail.roster.map((entry) => {
                      const draft = drafts[entry.student_subject_enrollment_id]
                      const canEdit = detail.session.status === 'open' ||
                        (detail.session.status === 'submitted' && entry.attendance !== null)

                      return (
                        <tr key={entry.student_subject_enrollment_id} className="align-top">
                          <td className="px-3 py-3">
                            <p className="font-medium text-ink">{entry.student.name}</p>
                            <p className="text-xs text-ink-muted">{entry.student.student_number}</p>
                            {entry.attendance?.changes?.map((change, index) => (
                              <p key={`${entry.attendance?.id}-${index}`} className="mt-1 text-[11px] leading-4 text-ink-muted">
                                Corrected by {change.changed_by ?? 'authorized user'}: {change.correction_reason}
                              </p>
                            ))}
                          </td>
                          <td className="px-3 py-3">
                            {canEdit ? (
                              <select
                                value={draft?.status ?? ''}
                                onChange={(event) => updateDraft(
                                  entry.student_subject_enrollment_id,
                                  'status',
                                  event.target.value as AttendanceDraft['status'],
                                )}
                                className="h-9 rounded-lg border border-line bg-white px-2 text-sm"
                                aria-label={`Attendance status for ${entry.student.name}`}
                              >
                                <option value="">Select</option>
                                {statuses.map((status) => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                            ) : (
                              <Badge tone={entry.attendance ? 'success' : 'neutral'}>
                                {entry.attendance?.status ?? 'Not recorded'}
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {canEdit ? (
                              <input
                                type="time"
                                value={draft?.checkInAt ?? ''}
                                onChange={(event) => updateDraft(
                                  entry.student_subject_enrollment_id,
                                  'checkInAt',
                                  event.target.value,
                                )}
                                className="h-9 rounded-lg border border-line px-2 text-sm"
                                aria-label={`Check-in time for ${entry.student.name}`}
                              />
                            ) : entry.attendance?.check_in_at ?? '—'}
                          </td>
                          <td className="px-3 py-3">
                            {canEdit ? (
                              <input
                                type="text"
                                value={draft?.remarks ?? ''}
                                maxLength={2000}
                                onChange={(event) => updateDraft(
                                  entry.student_subject_enrollment_id,
                                  'remarks',
                                  event.target.value,
                                )}
                                className="h-9 w-full min-w-40 rounded-lg border border-line px-2 text-sm"
                                aria-label={`Remarks for ${entry.student.name}`}
                              />
                            ) : entry.attendance?.remarks ?? '—'}
                          </td>
                        </tr>
                      )
                    })}
                    {detail.roster.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-10 text-center text-sm text-ink-muted">
                          No eligible students are enrolled for this meeting.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              {detail.session.status === 'submitted' ? (
                <label className="block space-y-1.5 text-sm font-medium text-ink">
                  Correction reason
                  <textarea
                    rows={2}
                    maxLength={2000}
                    value={correctionReason}
                    onChange={(event) => setCorrectionReason(event.target.value)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm font-normal"
                  />
                  {fieldErrors.correction_reason?.[0] ? (
                    <span className="block text-xs font-medium text-red-600">
                      {fieldErrors.correction_reason[0]}
                    </span>
                  ) : null}
                </label>
              ) : null}

              {fieldErrors.records?.[0] ? (
                <p role="alert" className="text-sm text-red-700">{fieldErrors.records[0]}</p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
                {detail.session.status !== 'cancelled' ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => void handleCancelSession()}
                  >
                    Cancel session
                  </Button>
                ) : null}
                {detail.session.status === 'open' ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      isLoading={isSaving}
                      disabled={!allStudentsMarked}
                      onClick={() => void handleSave()}
                    >
                      Save draft
                    </Button>
                    <Button
                      type="button"
                      isLoading={isSaving}
                      disabled={!allStudentsMarked}
                      onClick={() => {
                        if (!detail) return
                        setConfirmDialog({
                          variant: 'confirm',
                          title: 'Submit attendance',
                          description: 'Finalize attendance records for this class session. Submitted sessions can still be corrected with a reason.',
                          confirmLabel: 'Submit attendance',
                          cancelLabel: 'Keep as draft',
                          destructive: false,
                          onConfirm: () => {
                            setConfirmDialog(null)
                            void handleSave(true)
                          },
                        })
                      }}
                    >
                      Submit attendance
                    </Button>
                  </>
                ) : detail.session.status === 'submitted' ? (
                  <Button
                    type="button"
                    isLoading={isSaving}
                    disabled={!allStudentsMarked || correctionReason.trim().length < 3}
                    onClick={() => void handleSave()}
                  >
                    Save correction
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={ClipboardCheck}
              title="Session unavailable"
              description="This session could not be loaded. Refresh your session list and try again."
            />
          )}
        </Card>
      </div>

      {confirmDialog && (
        <ConfirmationDialog
          onClose={() => setConfirmDialog(null)}
          variant={confirmDialog.variant}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmLabel={confirmDialog.confirmLabel}
          cancelLabel={confirmDialog.cancelLabel}
          destructive={confirmDialog.destructive}
          inputLabel={confirmDialog.inputLabel}
          inputPlaceholder={confirmDialog.inputPlaceholder}
          inputValue={confirmDialog.inputValue}
          isLoading={isSaving}
          onConfirm={confirmDialog.onConfirm}
        />
      )}
    </div>
  )
}
