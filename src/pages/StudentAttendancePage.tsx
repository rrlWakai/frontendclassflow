import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardCheck, QrCode } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeading } from '@/components/common/PageHeading'
import { StudentQrScanner } from '@/components/attendance/StudentQrScanner'
import { useSchedules } from '@/hooks/useSchedules'
import {
  fetchEligibleAttendanceSessions,
  fetchMyExcuseRequests,
  fetchMyAttendance,
  fetchMyAttendanceSummary,
  submitAttendanceExcuse,
} from '@/services/api/attendance'
import type {
  AttendanceExcuseRequest,
  AttendanceRecordItem,
  AttendanceSession,
  AttendanceSummary,
  OwnAttendanceSummary,
} from '@/types/attendance'
import type { OwnAttendanceFilters } from '@/services/api/attendance'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatTimeRange, nextClass, todaysSchedules } from '@/utils/schedule'

const emptySummary: AttendanceSummary = {
  present: 0,
  absent: 0,
  late: 0,
  excused: 0,
  total: 0,
}

export function StudentAttendancePage() {
  const { schedules, loading: schedulesLoading, error: schedulesError } = useSchedules()
  const [records, setRecords] = useState<AttendanceRecordItem[]>([])
  const [summary, setSummary] = useState<AttendanceSummary>(emptySummary)
  const [summaryDetails, setSummaryDetails] = useState<OwnAttendanceSummary | null>(null)
  const [filters, setFilters] = useState<OwnAttendanceFilters>({})
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [eligibleSessions, setEligibleSessions] = useState<Array<{
    session: AttendanceSession
    qr_active: boolean
    attendance: { status: 'present' | 'absent' | 'late' | 'excused'; check_in_at: string | null } | null
  }>>([])
  const [excuseRequests, setExcuseRequests] = useState<AttendanceExcuseRequest[]>([])
  const [requestingSessionId, setRequestingSessionId] = useState<number | null>(null)
  const [excuseReason, setExcuseReason] = useState('')
  const [isSubmittingExcuse, setIsSubmittingExcuse] = useState(false)

  const closeScanner = useCallback(() => setScannerOpen(false), [])
  const handleQrRecorded = useCallback(
    () => setRefreshVersion((version) => version + 1),
    [],
  )

  useEffect(() => {
    let active = true
    const requestFilters = { ...filters, page, per_page: 25 }

    void Promise.resolve()
      .then(() => {
        if (!active) return null
        setIsLoading(true)
        setError(null)
        return Promise.all([
          fetchMyAttendance(requestFilters),
          fetchMyAttendanceSummary(filters),
          fetchEligibleAttendanceSessions(),
          fetchMyExcuseRequests(),
        ])
      })
      .then((result) => {
        if (!active || !result) return
        const [history, details, eligible, excuses] = result
        setRecords(history.records)
        setSummary(history.summary)
        setLastPage(history.pagination.last_page)
        setTotal(history.pagination.total)
        setSummaryDetails(details)
        setEligibleSessions(eligible)
        setExcuseRequests(excuses)
      })
      .catch((failure: unknown) => {
        if (active) setError(getApiErrorMessage(failure, 'Unable to load your attendance history.'))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [filters, page, refreshVersion])

  function updateFilter<K extends keyof OwnAttendanceFilters>(
    key: K,
    value: OwnAttendanceFilters[K],
  ) {
    setPage(1)
    setFilters((current) => ({ ...current, [key]: value || undefined }))
  }

  async function submitExcuse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (requestingSessionId === null || excuseReason.trim().length < 3) return
    setIsSubmittingExcuse(true)
    setError(null)
    try {
      await submitAttendanceExcuse(requestingSessionId, excuseReason.trim())
      setRequestingSessionId(null)
      setExcuseReason('')
      setRefreshVersion((version) => version + 1)
    } catch (failure) {
      setError(getApiErrorMessage(failure, 'Unable to submit your excuse request.'))
    } finally {
      setIsSubmittingExcuse(false)
    }
  }

  return (
    <div>
      <PageHeading
        title="Attendance"
        description="Review your attendance and class check-ins."
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={scannerOpen ? 'secondary' : 'primary'}
              onClick={() => setScannerOpen((current) => !current)}
            >
              <QrCode className="size-4" aria-hidden="true" />
              {scannerOpen ? 'Hide scanner' : 'Scan QR code'}
            </Button>
          </div>
        )}
      />

      {error ? (
        <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{error}</p>
          <Button
            type="button"
            className="mt-3"
            size="sm"
            variant="outline"
            onClick={() => setRefreshVersion((version) => version + 1)}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {scannerOpen ? (
        <div className="mb-5">
          <StudentQrScanner onClose={closeScanner} onRecorded={handleQrRecorded} />
        </div>
      ) : null}

      <div className="mb-5 grid gap-5 xl:grid-cols-3">
        <Card className="p-5">
          <CardHeader>
            <h2 className="text-base font-semibold text-ink">My class schedule</h2>
          </CardHeader>
          {schedulesError ? (
            <p role="alert" className="mt-3 text-sm text-red-700">{schedulesError}</p>
          ) : schedulesLoading ? (
            <p role="status" className="mt-3 text-sm text-ink-muted">Loading your schedule…</p>
          ) : schedules.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">No published classes are assigned to your enrollment.</p>
          ) : (
            <>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Today</p>
              <ul className="mt-1 divide-y divide-line">
                {todaysSchedules(schedules).map((schedule) => (
                  <li key={schedule.id} className="py-2">
                    <p className="text-sm font-medium text-ink">
                      {schedule.offering.subject.code} · {schedule.offering.section.code}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">{formatTimeRange(schedule.start_time, schedule.end_time)}</p>
                  </li>
                ))}
                {todaysSchedules(schedules).length === 0 ? (
                  <li className="py-2 text-sm text-ink-muted">No classes scheduled today.</li>
                ) : null}
              </ul>
              {nextClass(schedules) ? (
                <p className="mt-3 border-t border-line pt-3 text-xs text-ink-muted">
                  Next: {nextClass(schedules)?.schedule.offering.subject.code} ·{' '}
                  {nextClass(schedules)?.startsInDays === 0
                    ? 'today'
                    : `in ${nextClass(schedules)?.startsInDays} day(s)`}
                </p>
              ) : null}
            </>
          )}
        </Card>

        <Card className="p-5">
          <CardHeader>
            <h2 className="text-base font-semibold text-ink">Today’s eligible sessions</h2>
          </CardHeader>
          {eligibleSessions.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">No attendance sessions are available for your classes today.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {eligibleSessions.map(({ session, qr_active, attendance }) => (
                <li key={session.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-ink">
                      {session.offering.subject.code} · {session.offering.section.code}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {session.schedule.start_time}–{session.schedule.end_time}
                    </p>
                  </div>
                  <p className="shrink-0 text-right text-xs text-ink-muted">
                    {attendance ? attendance.status : qr_active ? 'QR open' : 'QR closed'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <CardHeader>
            <h2 className="text-base font-semibold text-ink">Excuse requests</h2>
          </CardHeader>
          {excuseRequests.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">You have no excuse requests.</p>
          ) : (
            <ul className="mt-3 max-h-56 divide-y divide-line overflow-y-auto">
              {excuseRequests.slice(0, 8).map((request) => (
                <li key={request.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-ink">
                      {request.subject?.code ?? 'Class'} · {request.session?.class_date ?? 'Meeting'}
                    </p>
                    <span className="text-xs capitalize text-ink-muted">{request.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">{request.decision_reason ?? request.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {requestingSessionId !== null ? (
        <form onSubmit={(event) => void submitExcuse(event)} className="mb-5 rounded-xl border border-line bg-white p-4">
          <label className="block space-y-1.5 text-sm font-medium text-ink">
            Reason for excuse request
            <textarea
              required
              minLength={3}
              maxLength={4000}
              rows={3}
              value={excuseReason}
              onChange={(event) => setExcuseReason(event.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm font-normal"
              placeholder="Explain why you could not attend this class."
            />
          </label>
          <div className="mt-3 flex justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setRequestingSessionId(null)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmittingExcuse}>
              Submit request
            </Button>
          </div>
        </form>
      ) : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['Present', summary.present],
          ['Absent', summary.absent],
          ['Late', summary.late],
          ['Excused', summary.excused],
          ['Recorded classes', summary.total],
        ].map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(18rem,0.8fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <h2 className="text-base font-semibold text-ink">Attendance history</h2>
          </CardHeader>

          <div className="grid gap-3 px-5 pb-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1.5 text-sm font-medium text-ink">
              Academic term
              <select
                value={filters.academic_term_id ?? ''}
                onChange={(event) => updateFilter(
                  'academic_term_id',
                  event.target.value ? Number(event.target.value) : undefined,
                )}
                className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm font-normal"
              >
                <option value="">All terms</option>
                {summaryDetails?.terms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.academic_year} · {term.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-ink">
              Subject
              <select
                value={filters.subject_offering_id ?? ''}
                onChange={(event) => updateFilter(
                  'subject_offering_id',
                  event.target.value ? Number(event.target.value) : undefined,
                )}
                className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm font-normal"
              >
                <option value="">All subjects</option>
                {summaryDetails?.offerings
                  .filter((offering) =>
                    !filters.academic_term_id ||
                    offering.academic_term_id === filters.academic_term_id,
                  )
                  .map((offering) => (
                    <option key={offering.id} value={offering.id}>
                      {offering.subject.code} · {offering.academic_term}
                    </option>
                  ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-ink">
              Status
              <select
                value={filters.status ?? ''}
                onChange={(event) => updateFilter(
                  'status',
                  (event.target.value || undefined) as OwnAttendanceFilters['status'],
                )}
                className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm font-normal"
              >
                <option value="">All statuses</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1.5 text-sm font-medium text-ink">
                From
                <input
                  type="date"
                  value={filters.from_date ?? ''}
                  onChange={(event) => updateFilter('from_date', event.target.value || undefined)}
                  className="h-10 w-full rounded-lg border border-line px-2 text-sm font-normal"
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium text-ink">
                To
                <input
                  type="date"
                  value={filters.to_date ?? ''}
                  onChange={(event) => updateFilter('to_date', event.target.value || undefined)}
                  className="h-10 w-full rounded-lg border border-line px-2 text-sm font-normal"
                />
              </label>
            </div>
          </div>

          {isLoading ? (
            <p role="status" className="px-5 py-16 text-center text-sm text-ink-muted">
              Loading your attendance…
            </p>
          ) : records.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No attendance records yet"
              description="Your attendance history will appear after a Professor submits a class session."
            />
          ) : (
            <>
              <div className="divide-y divide-line border-t border-line sm:hidden">
                {records.map(({ attendance, session }) => (
                  <article key={attendance.id} className="space-y-3 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{session.offering.subject.code} · {session.offering.section.code}</p>
                        <p className="mt-1 text-xs text-ink-muted">{session.offering.subject.title}</p>
                      </div>
                      <Badge tone={attendance.status === 'present' ? 'success' : attendance.status === 'absent' ? 'danger' : attendance.status === 'late' ? 'warning' : 'flow'}>{attendance.status}</Badge>
                    </div>
                    {attendance.status === 'absent' &&
                    !excuseRequests.some((request) =>
                      request.attendance_session_id === session.id &&
                      request.student_subject_enrollment_id === attendance.student_subject_enrollment_id,
                    ) ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => {
                        setRequestingSessionId(session.id)
                        setExcuseReason('')
                      }}>
                        Request excuse
                      </Button>
                    ) : null}
                    <div className="grid grid-cols-2 gap-3 text-xs text-ink-muted">
                      <div><p className="font-semibold uppercase tracking-wide text-[10px] text-ink-muted">Class meeting</p><p className="mt-1 text-ink">{session.class_date}</p><p>{session.schedule.start_time}–{session.schedule.end_time}</p></div>
                      <div><p className="font-semibold uppercase tracking-wide text-[10px] text-ink-muted">Notes</p><p className="mt-1 leading-5 text-ink">{attendance.remarks ?? 'No notes'}</p></div>
                    </div>
                  </article>
                ))}
              </div>
              <div className="hidden overflow-x-auto border-t border-line sm:block">
                <table className="w-full min-w-[690px] text-left text-sm">
                  <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    <tr>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Date / time</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {records.map(({ attendance, session }) => (
                      <tr key={attendance.id} className="align-top">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-ink">
                            {session.offering.subject.code} · {session.offering.section.code}
                          </p>
                          <p className="mt-1 text-xs text-ink-muted">{session.offering.subject.title}</p>
                          <p className="mt-1 text-xs text-ink-muted">
                            {session.offering.academic_term.academic_year} · {session.offering.academic_term.name}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-xs text-ink-muted">
                          <p>{session.class_date}</p>
                          <p className="mt-1">{session.schedule.start_time}–{session.schedule.end_time}</p>
                          {session.status === 'cancelled' ? (
                            <p className="mt-1 text-amber-700">Session cancelled</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4">
                          <Badge tone={
                            attendance.status === 'present'
                              ? 'success'
                              : attendance.status === 'absent'
                                ? 'danger'
                                : attendance.status === 'late'
                                  ? 'warning'
                                  : 'flow'
                          }>
                            {attendance.status}
                          </Badge>
                        </td>
                        <td className="max-w-56 px-4 py-4 text-xs leading-5 text-ink-muted">
                          {attendance.remarks ?? '—'}
                          {attendance.status === 'absent' &&
                          !excuseRequests.some((request) =>
                            request.attendance_session_id === session.id &&
                            request.student_subject_enrollment_id === attendance.student_subject_enrollment_id,
                          ) ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="mt-2"
                              onClick={() => {
                                setRequestingSessionId(session.id)
                                setExcuseReason('')
                              }}
                            >
                              Request excuse
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <p className="text-xs text-ink-muted">
                  {total} record{total === 1 ? '' : 's'} · Page {page} of {lastPage}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={page >= lastPage}
                    onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
                  >
                    Next
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>

        <Card className="p-5">
          <CardHeader>
            <h2 className="text-base font-semibold text-ink">By subject</h2>
          </CardHeader>
          {isLoading ? (
            <p role="status" className="py-8 text-sm text-ink-muted">Loading summaries…</p>
          ) : summaryDetails?.by_subject.length ? (
            <ul className="mt-3 space-y-3">
              {summaryDetails.by_subject.map((subject) => (
                <li key={subject.id} className="rounded-xl border border-line p-3">
                <p className="font-semibold text-ink">{subject.code} · {subject.title}</p>
                <p className="mt-1 text-xs text-ink-muted">{subject.academic_term}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {subject.present} present · {subject.absent} absent · {subject.late} late · {subject.excused} excused
                  </p>
                <p className="mt-2 text-xs text-ink-muted">
                  {subject.attendance_percentage === null
                    ? 'Attendance percentage pending'
                    : `${subject.attendance_percentage}% attendance · ${subject.weighted_contribution}/20`}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {subject.absent} actual absences · {subject.late_absence_equivalents} late-derived ·{' '}
                  {subject.absence_equivalents} total equivalents · {subject.allowed_absences === null
                    ? 'allowance not configured'
                    : `${subject.allowed_absences} allowed · ${subject.remaining_absences} remaining${subject.allowance_exceeded ? ' · exceeded' : ''}`}
                </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No subject summaries"
              description="Subject totals appear when attendance is recorded."
            />
          )}
        </Card>
      </div>
    </div>
  )
}
