import { useCallback, useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import QRCode from 'qrcode'
import {
  CheckCircle2,
  Clock,
  QrCode,
  RefreshCw,
  StopCircle,
  Users,
  X,
} from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card, CardHeader } from '@/components/common/Card'
import {
  fetchAttendanceQrStatus,
  startAttendanceQr,
  stopAttendanceQr,
} from '@/services/api/attendance'
import type { AttendanceQrStatus, AttendanceSession } from '@/types/attendance'
import { getApiErrorMessage } from '@/utils/apiError'

interface ProfessorQrPanelProps {
  session: AttendanceSession
  onClose: () => void
}

function formatCountdown(seconds: number): string {
  return `0:${String(Math.max(0, seconds)).padStart(2, '0')}`
}

export function ProfessorQrPanel({ session, onClose }: ProfessorQrPanelProps) {
  const [qrStatus, setQrStatus] = useState<AttendanceQrStatus | null>(null)
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nowTick, setNowTick] = useState(() => Date.now())
  const rotatingRef = useRef(false)
  const initializedRef = useRef(false)

  const rotate = useCallback(async () => {
    if (rotatingRef.current) return

    rotatingRef.current = true
    setIsStarting(true)
    setError(null)

    try {
      const result = await startAttendanceQr(session.id)
      const image = await QRCode.toDataURL(result.token, {
        width: 560,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#0b1228', light: '#ffffff' },
      })

      setQrImage(image)
      setQrStatus(result.qr)
    } catch (failure) {
      setError(getApiErrorMessage(failure, 'Unable to generate the QR code.'))
    } finally {
      rotatingRef.current = false
      setIsStarting(false)
    }
  }, [session.id])

  useEffect(() => {
    let active = true

    void fetchAttendanceQrStatus(session.id)
      .then((status) => {
        if (active) setQrStatus(status)
      })
      .catch((failure: unknown) => {
        if (active) {
          setError(getApiErrorMessage(failure, 'Unable to load QR attendance status.'))
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [session.id])

  useEffect(() => {
    if (!qrStatus || isLoading || initializedRef.current) return

    initializedRef.current = true

    if (!qrStatus.active) return

    const timer = window.setTimeout(() => void rotate(), 0)

    return () => window.clearTimeout(timer)
  }, [isLoading, qrStatus, rotate])

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!qrStatus?.active || !qrStatus.expires_at) return

    const expiresAt = new Date(qrStatus.expires_at).getTime()
    const timer = window.setTimeout(
      () => void rotate(),
      Math.max(0, expiresAt - Date.now()) + 250,
    )

    return () => window.clearTimeout(timer)
  }, [qrStatus?.active, qrStatus?.expires_at, rotate])

  useEffect(() => {
    const timer = window.setInterval(() => {
      void fetchAttendanceQrStatus(session.id)
        .then((status) => {
          setQrStatus(status)

          if (!status.active) {
            setQrImage(null)
          }
        })
        .catch(() => undefined)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [session.id])

  async function handleStop() {
    if (!window.confirm('End QR attendance for this session? Students will no longer be able to check in.')) {
      return
    }

    setIsStopping(true)
    setError(null)

    try {
      const status = await stopAttendanceQr(session.id)
      setQrStatus(status)
      setQrImage(null)
    } catch (failure) {
      setError(getApiErrorMessage(failure, 'Unable to end QR attendance.'))
    } finally {
      setIsStopping(false)
    }
  }

  const secondsLeft = qrStatus?.expires_at
    ? Math.max(0, Math.ceil((new Date(qrStatus.expires_at).getTime() - nowTick) / 1000))
    : 0
  const monitoring = qrStatus?.monitoring
  const sessionOpen = session.status === 'open'

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-flow-700">
            QR attendance
          </p>
          <h2 className="mt-1 text-lg font-semibold text-ink">
            {session.offering.subject.code} - {session.offering.section.code}
          </h2>
          <p className="mt-1 text-xs text-ink-muted">
            {session.class_date} - {session.schedule.start_time}-{session.schedule.end_time}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={qrStatus?.active ? 'success' : 'neutral'}>
            {qrStatus?.active ? 'QR live' : 'QR inactive'}
          </Badge>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close QR panel">
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>

      <div className="space-y-5 p-5">
        {error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Subject', `${session.offering.subject.code} - ${session.offering.subject.title}`],
            ['Section', session.offering.section.code],
            ['Date', session.class_date],
            ['Status', session.status],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-line bg-canvas/60 px-3 py-2.5">
              <p className="text-xs text-ink-muted">{label}</p>
              <p className="mt-1 truncate font-medium text-ink">{value}</p>
            </div>
          ))}
        </div>

        {isLoading ? (
          <p role="status" className="py-10 text-center text-sm text-ink-muted">
            Loading QR attendance status.
          </p>
        ) : qrStatus?.active ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-white p-5 text-center">
              {qrImage ? (
                <img
                  src={qrImage}
                  alt={`QR attendance code for ${session.offering.subject.code}`}
                  className="w-full max-w-[22rem] rounded-xl"
                />
              ) : (
                <div className="flex size-56 items-center justify-center rounded-2xl border border-dashed border-line bg-canvas text-ink-muted">
                  <QrCode className="size-16" aria-hidden="true" />
                </div>
              )}
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
                QR code refreshes automatically
              </p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-flow-200 bg-flow-50 px-3 py-1.5 text-sm font-semibold text-flow-800">
                <Clock className="size-4" aria-hidden="true" />
                {qrImage ? `${formatCountdown(secondsLeft)} remaining` : 'Preparing a fresh code'}
              </div>
              <p className="mt-3 max-w-sm text-xs leading-5 text-ink-muted">
                Display this code. It refreshes automatically before expiring.
              </p>
            </div>

            <div className="space-y-4">
              {monitoring ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        ['Enrolled', monitoring.total_enrolled, Users],
                        ['Checked in', monitoring.checked_in, CheckCircle2],
                        ['Not checked in', monitoring.not_checked_in, Clock],
                        ['Attendance', `${monitoring.percentage}%`, QrCode],
                      ] as Array<[string, string | number, LucideIcon]>
                    ).map(([label, value, Icon]) => (
                      <div key={label} className="rounded-xl border border-line p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-ink-muted">{label}</p>
                          <Icon className="size-4 text-flow-600" aria-hidden="true" />
                        </div>
                        <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-ink-muted">
                      <span>Check-in progress</span>
                      <span>{monitoring.checked_in}/{monitoring.total_enrolled}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-flow-500 transition-all"
                        style={{ width: `${Math.min(100, monitoring.percentage)}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-line">
                    <div className="border-b border-line px-3 py-2">
                      <p className="text-xs font-semibold text-ink-muted">Checked in students</p>
                    </div>
                    {monitoring.checked_in_students.length ? (
                      <ul className="max-h-52 divide-y divide-line overflow-y-auto">
                        {monitoring.checked_in_students.map((entry) => (
                          <li key={entry.student_subject_enrollment_id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-ink">{entry.student.name}</p>
                              <p className="text-xs text-ink-muted">{entry.student.student_number}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <Badge tone={entry.status === 'late' ? 'warning' : 'success'}>
                                {entry.status}
                              </Badge>
                              <p className="mt-1 text-[11px] text-ink-muted">{entry.check_in_at ?? '-'}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="px-3 py-6 text-center text-sm text-ink-muted">
                        No students checked in yet.
                      </p>
                    )}
                  </div>
                </>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  isLoading={isStarting}
                  onClick={() => void rotate()}
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Refresh QR
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  isLoading={isStopping}
                  onClick={() => void handleStop()}
                >
                  <StopCircle className="size-4" aria-hidden="true" />
                  End QR attendance
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-canvas/50 px-6 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-flow-100 bg-flow-50 text-flow-700">
              <QrCode className="size-7" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-ink">
              {sessionOpen ? 'QR attendance is inactive' : 'QR check-in unavailable'}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">
              {sessionOpen
                ? 'Start QR attendance to display a code for students.'
                : 'Only open sessions support QR check-in.'}
            </p>
            {sessionOpen ? (
              <Button
                type="button"
                className="mt-5"
                isLoading={isStarting}
                onClick={() => void rotate()}
              >
                <QrCode className="size-4" aria-hidden="true" />
                Generate QR code
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </Card>
  )
}
