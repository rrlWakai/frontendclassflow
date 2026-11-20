import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { AlertTriangle, Camera, CheckCircle2, LoaderCircle, QrCode } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card, CardBody } from '@/components/common/Card'
import { PageHeading } from '@/components/common/PageHeading'
import { checkInToRoom, endRoomUsage, fetchMyRoomUsage, previewRoomCheckIn } from '@/services/api/roomMonitoring'
import type { RoomCheckInResult, RoomMonitoringPreview } from '@/types/roomMonitoring'
import { getApiErrorMessage } from '@/utils/apiError'

type ScannerState = 'idle' | 'requesting' | 'scanning' | 'validating' | 'ready' | 'saving' | 'success' | 'error'

const QR_PREFIX = 'ccsync-room-v1:'

function extractIdentifier(payload: string): string | null {
  const value = payload.trim()
  const identifier = value.startsWith(QR_PREFIX) ? value.slice(QR_PREFIX.length) : value

  return /^[a-f0-9]{64}$/.test(identifier) ? identifier : null
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

export function ProfessorRoomScannerPage() {
  const [state, setState] = useState<ScannerState>('idle')
  const [preview, setPreview] = useState<RoomMonitoringPreview | null>(null)
  const [result, setResult] = useState<RoomCheckInResult | null>(null)
  const [qrIdentifier, setQrIdentifier] = useState<string | null>(null)
  const [mismatchReason, setMismatchReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [activeUsage, setActiveUsage] = useState<RoomCheckInResult['occupancy'] | null>(null)
  const [history, setHistory] = useState<RoomCheckInResult['occupancy'][]>([])
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const stoppedRef = useRef(true)
  const scanRef = useRef<() => void>(() => undefined)
  const processingRef = useRef(false)

  const stopCamera = useCallback(() => {
    stoppedRef.current = true
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const handlePayload = useCallback(async (payload: string) => {
    if (processingRef.current) return
    processingRef.current = true
    stopCamera()
    const identifier = extractIdentifier(payload)
    if (!identifier) {
      setError('This is not a registered CCSync room QR code.')
      setState('error')
      processingRef.current = false
      return
    }

    setQrIdentifier(identifier)
    setState('validating')
    setError(null)
    try {
      const validated = await previewRoomCheckIn(identifier)
      setPreview(validated)
      setMismatchReason('')
      setState('ready')
    } catch (failure) {
      setError(getApiErrorMessage(failure, 'The room QR code or your schedule could not be validated.'))
      setState('error')
    } finally {
      processingRef.current = false
    }
  }, [stopCamera])

  const scan = useCallback(() => {
    if (stoppedRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current

    if (video && canvas && video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const image = context.getImageData(0, 0, canvas.width, canvas.height)
        const qr = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' })
        if (qr?.data) {
          void handlePayload(qr.data)
          return
        }
      }
    }

    frameRef.current = window.requestAnimationFrame(() => scanRef.current())
  }, [handlePayload])

  useEffect(() => {
    scanRef.current = scan
  }, [scan])

  const startCamera = useCallback(async () => {
    stopCamera()
    setError(null)
    setPreview(null)
    setResult(null)
    setQrIdentifier(null)
    processingRef.current = false

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError('Camera scanning requires a secure HTTPS connection and an available camera.')
      setState('error')
      return
    }

    stoppedRef.current = false
    setState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      if (stoppedRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      streamRef.current = stream
      const video = videoRef.current
      if (!video) {
        stopCamera()
        setError('The camera preview could not be opened.')
        setState('error')
        return
      }
      video.srcObject = stream
      await video.play()
      setState('scanning')
      frameRef.current = window.requestAnimationFrame(scan)
    } catch (failure) {
      stopCamera()
      const cameraError = failure instanceof DOMException
        ? failure.name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow camera access in your browser settings and retry.'
          : failure.name === 'NotFoundError'
            ? 'No camera was found on this device.'
            : 'The camera could not be started. Close other camera apps and retry.'
        : 'The camera could not be started. Please retry.'
      setError(cameraError)
      setState('error')
    }
  }, [scan, stopCamera])

  useEffect(() => () => stopCamera(), [stopCamera])

  useEffect(() => {
    void fetchMyRoomUsage().then((data) => {
      setHistory(data.occupancies)
      const current = data.occupancies.find((item) => !item.checked_out_at && item.scheduled_end_at && new Date(item.scheduled_end_at) > new Date())
      setActiveUsage(current ?? null)
    }).catch(() => undefined)
  }, [result])

  async function submitCheckIn() {
    if (!preview || !qrIdentifier) return
    setState('saving')
    setError(null)
    try {
      const checkedIn = await checkInToRoom(
        qrIdentifier,
        mismatchReason.trim() || undefined,
      )
      setResult(checkedIn)
      setActiveUsage(checkedIn.occupancy)
      setState('success')
    } catch (failure) {
      setError(getApiErrorMessage(failure, 'Room check-in could not be completed.'))
      setState('error')
    }
  }

  function reset() {
    setPreview(null)
    setResult(null)
    setQrIdentifier(null)
    setMismatchReason('')
    setError(null)
    setState('idle')
  }

  const unavailable = preview !== null && (
    !preview.room_available || preview.professor_has_other_active_occupancy
  )
  const mismatchReasonInvalid = Boolean(preview?.requires_mismatch_override && mismatchReason.trim().length < 10)

  return (
    <>
      <PageHeading
        eyebrow="Professor tools"
        title="Room scanner"
        description="Scan the permanent QR code inside your assigned classroom to record room occupancy."
      />

      <Card>
        <CardBody className="space-y-5">
          {activeUsage ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-flow-200 bg-flow-50 p-4">
              <div><p className="font-semibold">Active room usage · {activeUsage.room.code}</p><p className="text-sm text-ink-muted">Checked in {activeUsage.checked_in_at ? formatTime(activeUsage.checked_in_at) : '—'}</p></div>
              <Button variant="outline" onClick={() => void endRoomUsage().then((ended) => { setActiveUsage(null); setResult(ended); setState('success') }).catch((failure) => setError(getApiErrorMessage(failure, 'Unable to end room usage.')))}>End room usage</Button>
            </div>
          ) : null}
          {state === 'success' && result ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center gap-3 text-emerald-900">
                <CheckCircle2 className="size-7" aria-hidden="true" />
                <div>
                  <h2 className="font-semibold">{result.already_checked_in ? 'Room check-in already recorded' : 'Room check-in confirmed'}</h2>
                  <p className="mt-1 text-sm">
                    {result.occupancy.room.name} ({result.occupancy.room.code}) · {result.occupancy.subject?.code ?? 'Class'}
                    {' · '}{result.occupancy.section?.code ?? 'Section'}
                    {' · '}{result.occupancy.scheduled_start_at ? formatTime(result.occupancy.scheduled_start_at) : '—'}
                    {'–'}{result.occupancy.scheduled_end_at ? formatTime(result.occupancy.scheduled_end_at) : '—'}
                    {' · '}checked in {result.occupancy.checked_in_at ? formatTime(result.occupancy.checked_in_at) : '—'}
                  </p>
                  {result.occupancy.discrepancy_status === 'open' ? (
                    <p className="mt-2 text-sm font-medium">Your room mismatch was recorded for Admin review.</p>
                  ) : null}
                </div>
              </div>
              <Button className="mt-4" variant="outline" onClick={reset}>Scan another room</Button>
            </div>
          ) : state === 'ready' && preview ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-line bg-stone-50 p-4">
                <h2 className="font-semibold">{preview.room.name} ({preview.room.code})</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {[preview.room.building, preview.room.floor ? `Floor ${preview.room.floor}` : null].filter(Boolean).join(' · ') || 'Location unavailable'}
                </p>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <p><span className="font-medium">Subject:</span> {preview.schedule.subject?.code ?? 'Unknown'} — {preview.schedule.subject?.title ?? 'Unknown subject'}</p>
                  <p><span className="font-medium">Section:</span> {preview.schedule.section?.code ?? 'Unknown'}</p>
                  <p><span className="font-medium">Class time:</span> {formatTime(preview.schedule.starts_at)}–{formatTime(preview.schedule.ends_at)}</p>
                  <p><span className="font-medium">Scheduled room:</span> {preview.scheduled_room.code} — {preview.scheduled_room.name}</p>
                </div>
              </div>
              {preview.requires_mismatch_override ? (
                <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-4">
                  <p className="font-semibold text-amber-950">Room mismatch</p>
                  <p className="text-sm text-amber-900">
                    Your schedule assigns {preview.scheduled_room.code}, but this QR identifies {preview.room.code}.
                    The timetable will not be changed. Your check-in requires a reason and will be flagged for Admin review.
                  </p>
                  <label htmlFor="room-mismatch-reason" className="block text-sm font-medium text-amber-950">Reason for using this room</label>
                  <textarea
                    id="room-mismatch-reason"
                    value={mismatchReason}
                    onChange={(event) => setMismatchReason(event.target.value)}
                    maxLength={500}
                    rows={3}
                    className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
                    placeholder="Explain why the scheduled room is not being used."
                  />
                </div>
              ) : null}
              {!preview.room_available ? (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {preview.room_reserved_for_another_class
                    ? 'This room is reserved for another published class during this time.'
                    : 'This room is currently occupied or not available for check-in.'}
                </p>
              ) : null}
              {preview.professor_has_other_active_occupancy ? (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  You already have an active occupancy for another class. Simultaneous room check-ins are not allowed.
                </p>
              ) : null}
              {preview.current_room_occupancy ? (
                <p className="text-sm text-ink-muted">
                  Current occupancy: {preview.current_room_occupancy.professor.name ?? 'Professor'} ·
                  {' '}{preview.current_room_occupancy.subject?.code ?? 'Class'} · checked in{' '}
                  {preview.current_room_occupancy.checked_in_at ? formatTime(preview.current_room_occupancy.checked_in_at) : '—'}
                </p>
              ) : (
                <p className="text-sm text-ink-muted">
                  Current room state: {preview.room_reserved_for_another_class ? 'Reserved for another class' : 'Available'}
                </p>
              )}
              <p className="text-xs text-ink-muted">
                Check-in is permitted up to {preview.early_check_in_minutes} minutes before the scheduled start, using server time.
              </p>
              {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => void submitCheckIn()}
                  disabled={unavailable || mismatchReasonInvalid}
                >
                  Confirm room check-in
                </Button>
                <Button variant="outline" onClick={reset}>Cancel</Button>
              </div>
            </div>
          ) : state === 'error' ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5" role="alert">
              <div className="flex items-start gap-3 text-red-900">
                <AlertTriangle className="mt-0.5 size-5" aria-hidden="true" />
                <div>
                  <h2 className="font-semibold">Unable to check in</h2>
                  <p className="mt-1 text-sm">{error}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => void startCamera()}>Try scanning again</Button>
                {preview ? <Button variant="outline" onClick={() => setState('ready')}>Review schedule</Button> : null}
              </div>
            </div>
          ) : state === 'validating' || state === 'saving' ? (
            <div role="status" className="flex flex-col items-center py-10 text-center">
              <LoaderCircle className="size-8 animate-spin text-flow-600" aria-hidden="true" />
              <p className="mt-3 font-semibold">{state === 'saving' ? 'Recording room check-in…' : 'Validating room and schedule…'}</p>
            </div>
          ) : (
            <>
              {(state === 'requesting' || state === 'scanning') ? (
                <div className="relative overflow-hidden rounded-xl bg-night-950">
                  <video ref={videoRef} autoPlay muted playsInline className="aspect-[4/3] w-full object-cover" />
                  {state === 'requesting' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-night-950/85 text-white">
                      <LoaderCircle className="size-8 animate-spin" aria-hidden="true" />
                      <p className="mt-3 font-semibold">Waiting for camera permission…</p>
                    </div>
                  ) : (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="size-56 max-w-[72%] rounded-2xl border-2 border-flow-300 shadow-[0_0_0_9999px_rgba(11,18,40,0.42)]" />
                    </div>
                  )}
                  <p className="absolute inset-x-0 bottom-0 bg-night-950/80 p-3 text-center text-xs text-white">Center the room QR in the frame.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-line px-5 py-10 text-center">
                  <QrCode className="mx-auto size-9 text-flow-600" aria-hidden="true" />
                  <h2 className="mt-3 font-semibold">Ready to scan a room QR code</h2>
                  <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
                    The code identifies a room only. Your signed-in professor account and published schedule determine whether check-in is allowed.
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {state === 'idle' ? (
                  <Button onClick={() => void startCamera()}>
                    <Camera className="size-4" aria-hidden="true" />
                    Start room scanner
                  </Button>
                ) : null}
                {state === 'scanning' || state === 'requesting' ? (
                  <Button variant="outline" onClick={() => { stopCamera(); setState('idle') }}>Stop camera</Button>
                ) : null}
              </div>
            </>
          )}
          <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
        </CardBody>
      </Card>
      <Card className="mt-6">
        <CardBody>
          <h2 className="font-semibold">My room usage history</h2>
          {history.length === 0 ? <p className="mt-3 text-sm text-ink-muted">No room usage records yet.</p> : (
            <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b border-line text-xs uppercase text-ink-muted"><th className="px-2 py-2">Room</th><th className="px-2 py-2">Class</th><th className="px-2 py-2">Start</th><th className="px-2 py-2">End</th><th className="px-2 py-2">Status</th></tr></thead><tbody>{history.map((item) => <tr key={item.id} className="border-b border-line"><td className="px-2 py-2">{item.room.code}</td><td className="px-2 py-2">{item.subject?.code ?? '—'} · {item.section?.code ?? '—'}</td><td className="px-2 py-2">{item.checked_in_at ? formatTime(item.checked_in_at) : '—'}</td><td className="px-2 py-2">{item.checked_out_at ? formatTime(item.checked_out_at) : '—'}</td><td className="px-2 py-2">{item.checked_out_at ? 'Completed' : 'Active'}</td></tr>)}</tbody></table></div>
          )}
        </CardBody>
      </Card>
    </>
  )
}
