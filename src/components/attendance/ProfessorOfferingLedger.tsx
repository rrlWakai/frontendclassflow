import { useEffect, useMemo, useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import {
  decideAttendanceExcuse,
  exportOfferingAttendanceLedger,
  fetchOfferingAttendanceLedger,
  fetchOfferingExcuses,
} from '@/services/api/attendance'
import type { AttendanceExcuseRequest, OfferingAttendanceLedger } from '@/types/attendance'
import type { MySchedule } from '@/types/scheduling'
import { getApiErrorMessage } from '@/utils/apiError'

interface ProfessorOfferingLedgerProps {
  schedules: MySchedule[]
}

export function ProfessorOfferingLedger({ schedules }: ProfessorOfferingLedgerProps) {
  const offerings = useMemo(() => {
    const unique = new Map<number, MySchedule['offering']>()
    schedules.forEach((schedule) => unique.set(schedule.offering.id, schedule.offering))
    return [...unique.values()]
  }, [schedules])
  const [offeringId, setOfferingId] = useState<number | null>(null)
  const [ledger, setLedger] = useState<OfferingAttendanceLedger | null>(null)
  const [excuses, setExcuses] = useState<AttendanceExcuseRequest[]>([])
  const [decisionReasons, setDecisionReasons] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshVersion, setRefreshVersion] = useState(0)

  useEffect(() => {
    if (offerings.length === 0) {
      setOfferingId(null)
      return
    }
    if (offeringId === null || !offerings.some((offering) => offering.id === offeringId)) {
      setOfferingId(offerings[0].id)
    }
  }, [offerings, offeringId])

  useEffect(() => {
    if (offeringId === null) return
    let active = true
    setLoading(true)
    setError(null)
    void Promise.all([
      fetchOfferingAttendanceLedger(offeringId),
      fetchOfferingExcuses(offeringId),
    ])
      .then(([result, requests]) => {
        if (!active) return
        setLedger(result)
        setExcuses(requests)
      })
      .catch((failure: unknown) => {
        if (active) setError(getApiErrorMessage(failure, 'Unable to load the offering attendance ledger.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [offeringId, refreshVersion])

  async function decide(requestId: number, status: 'approved' | 'rejected') {
    const reason = decisionReasons[requestId]?.trim() ?? ''
    if (reason.length < 3) {
      setError('Enter a decision reason of at least three characters.')
      return
    }
    setSavingId(requestId)
    setError(null)
    try {
      await decideAttendanceExcuse(requestId, status, reason)
      setRefreshVersion((version) => version + 1)
    } catch (failure) {
      setError(getApiErrorMessage(failure, 'Unable to save the excuse decision.'))
    } finally {
      setSavingId(null)
    }
  }

  async function downloadLedger() {
    if (offeringId === null) return
    setExporting(true)
    setError(null)
    try {
      const blob = await exportOfferingAttendanceLedger(offeringId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `attendance-${ledger?.offering.subject.code ?? offeringId}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (failure) {
      setError(getApiErrorMessage(failure, 'Unable to export the attendance ledger.'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <Card className="mt-5 min-w-0 p-5">
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Semester attendance ledger</h2>
          <p className="mt-1 text-sm text-ink-muted">Offering totals include held meetings only. Missing sessions are flagged for follow-up.</p>
        </div>
        <Button type="button" size="sm" variant="outline" disabled={!ledger || exporting} isLoading={exporting} onClick={() => void downloadLedger()}>
          <Download className="size-4" aria-hidden="true" />
          Export .xlsx
        </Button>
      </CardHeader>

      {offerings.length === 0 ? (
        <EmptyState icon={FileSpreadsheet} title="No assigned offerings" description="Semester ledgers appear for your scheduled subject offerings." />
      ) : (
        <>
          <label className="mt-4 block max-w-lg space-y-1.5 text-sm font-medium text-ink">
            Subject offering
            <select
              value={offeringId ?? ''}
              onChange={(event) => setOfferingId(Number(event.target.value))}
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm font-normal"
            >
              {offerings.map((offering) => (
                <option key={offering.id} value={offering.id}>
                  {offering.subject.code} · {offering.section.code} · {offering.academic_term.name}
                </option>
              ))}
            </select>
          </label>

          {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
          {loading ? (
            <p role="status" className="py-8 text-sm text-ink-muted">Loading semester ledger…</p>
          ) : ledger ? (
            <div className="mt-5 space-y-6">
              <div className="flex flex-wrap gap-x-6 gap-y-2 border-y border-line py-3 text-sm text-ink-muted">
                <span>{ledger.held_meetings} held meetings</span>
                <span>{ledger.incomplete_meetings.length} incomplete scheduled meetings</span>
                <span>{ledger.policy ? `Absence allowance: ${ledger.policy.allowed_absences}` : 'Absence policy not configured'}</span>
              </div>

              {ledger.incomplete_meetings.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-ink">Sessions needing attention</h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {ledger.incomplete_meetings.map((meeting) => (
                      <li key={`${meeting.schedule_id}-${meeting.date}`} className="rounded-md border border-amber-200 px-2.5 py-1.5 text-xs text-amber-900">
                        {meeting.date} · {meeting.start_time}–{meeting.end_time}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="overflow-x-auto rounded-lg border border-line">
                <table className="w-full min-w-[1080px] text-left text-sm">
                  <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    <tr>
                      <th className="px-3 py-3">Student</th>
                      <th className="px-3 py-3">P / L / A / E</th>
                      <th className="px-3 py-3">Late-derived</th>
                      <th className="px-3 py-3">Absence equivalents</th>
                      <th className="px-3 py-3">Allowed / remaining</th>
                      <th className="px-3 py-3">Attendance</th>
                      <th className="px-3 py-3">Allowance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {ledger.students.map((student) => (
                      <tr key={student.student.student_subject_enrollment_id}>
                        <td className="px-3 py-3">
                          <p className="font-medium text-ink">{student.student.name}</p>
                          <p className="text-xs text-ink-muted">{student.student.student_number}</p>
                        </td>
                        <td className="px-3 py-3 tabular text-ink-muted">
                          {student.present} / {student.late} / {student.absent} / {student.excused}
                        </td>
                        <td className="px-3 py-3 tabular text-ink">{student.late_absence_equivalents}</td>
                        <td className="px-3 py-3 tabular text-ink">{student.absence_equivalents}</td>
                        <td className="px-3 py-3 tabular text-ink">
                          {student.allowed_absences === null
                            ? '—'
                            : `${student.allowed_absences} / ${student.remaining_absences}`}
                        </td>
                        <td className="px-3 py-3 text-ink">
                          {student.attendance_percentage === null
                            ? 'Pending'
                            : `${student.attendance_percentage}% · ${student.weighted_contribution}/20`}
                        </td>
                        <td className="px-3 py-3 text-ink">
                          {student.allowance_exceeded ? 'Exceeded' : student.allowed_absences === null ? 'Not configured' : 'Within allowance'}
                        </td>
                      </tr>
                    ))}
                    {ledger.students.length === 0 ? (
                      <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-ink-muted">No students eligible for held meetings.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="mt-6 border-t border-line pt-5">
            <h3 className="text-sm font-semibold text-ink">Excuse requests</h3>
            {excuses.length === 0 ? (
              <p className="mt-2 text-sm text-ink-muted">No requests for this offering.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {excuses.map((request) => (
                  <li key={request.id} className="py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {request.student?.name ?? 'Student'} · {request.session?.class_date ?? 'Meeting'}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted">{request.reason}</p>
                        {request.changes.map((change, index) => (
                          <p key={`${request.id}-${index}`} className="mt-1 text-xs text-ink-muted">
                            {change.changed_by ?? 'System'} · {change.new_status}: {change.reason}
                          </p>
                        ))}
                      </div>
                      <span className="text-xs capitalize text-ink-muted">{request.status}</span>
                    </div>
                    {request.status === 'pending' ? (
                      <div className="mt-3 flex flex-wrap items-end gap-2">
                        <label className="min-w-60 flex-1 space-y-1 text-xs font-medium text-ink">
                          Decision reason
                          <input
                            value={decisionReasons[request.id] ?? ''}
                            onChange={(event) => setDecisionReasons((current) => ({ ...current, [request.id]: event.target.value }))}
                            className="h-9 w-full rounded-lg border border-line px-2 text-sm font-normal"
                            placeholder="Reason for approval or rejection"
                          />
                        </label>
                        <Button type="button" size="sm" variant="outline" isLoading={savingId === request.id} disabled={savingId !== null} onClick={() => void decide(request.id, 'rejected')}>
                          Reject
                        </Button>
                        <Button type="button" size="sm" isLoading={savingId === request.id} disabled={savingId !== null} onClick={() => void decide(request.id, 'approved')}>
                          Approve
                        </Button>
                      </div>
                    ) : request.decision_reason ? (
                      <p className="mt-2 text-xs text-ink-muted">Decision: {request.decision_reason}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </Card>
  )
}
