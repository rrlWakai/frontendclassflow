import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardCheck, QrCode } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeading } from '@/components/common/PageHeading'
import { StudentQrScanner } from '@/components/attendance/StudentQrScanner'
import {
  fetchMyAttendance,
  fetchMyAttendanceSummary,
} from '@/services/api/attendance'
import type {
  AttendanceRecordItem,
  AttendanceSummary,
  OwnAttendanceSummary,
} from '@/types/attendance'
import type { OwnAttendanceFilters } from '@/services/api/attendance'
import { getApiErrorMessage } from '@/utils/apiError'

const emptySummary: AttendanceSummary = {
  present: 0,
  absent: 0,
  late: 0,
  excused: 0,
  total: 0,
}

export function StudentAttendancePage() {
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
        ])
      })
      .then((result) => {
        if (!active || !result) return
        const [history, details] = result
        setRecords(history.records)
        setSummary(history.summary)
        setLastPage(history.pagination.last_page)
        setTotal(history.pagination.total)
        setSummaryDetails(details)
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

  return (
    <div>
      <PageHeading
        eyebrow="Student workspace"
        title="My attendance"
        description="Scan your Professor's QR code to check in, then review attendance recorded for your enrolled classes."
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="coral">Personal record</Badge>
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
            <p className="mt-1 text-xs text-ink-muted">
              Historical records remain available if a class schedule is later cancelled.
            </p>
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
            <p className="mt-1 text-xs text-ink-muted">Submitted attendance records only</p>
          </CardHeader>
          {isLoading ? (
            <p role="status" className="py-8 text-sm text-ink-muted">Loading summaries…</p>
          ) : summaryDetails?.by_subject.length ? (
            <ul className="mt-3 space-y-3">
              {summaryDetails.by_subject.map((subject) => (
                <li key={subject.id} className="rounded-xl border border-line p-3">
                  <p className="font-semibold text-ink">{subject.code} · {subject.title}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {subject.present} present · {subject.absent} absent · {subject.late} late · {subject.excused} excused
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
          <p className="mt-4 border-t border-line pt-4 text-xs leading-5 text-ink-muted">
            Attendance is read-only. Contact the Professor for a correction; updates are audited.
          </p>
        </Card>
      </div>
    </div>
  )
}
