import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import jsQR from 'jsqr'
import {
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  Key,
  LoaderCircle,
  QrCode,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card, CardHeader } from '@/components/common/Card'
import { submitAttendanceQr } from '@/services/api/attendance'
import type { AttendanceQrCheckInResult } from '@/types/attendance'
import { getApiErrorCode, getApiErrorMessage, getApiErrorStatus } from '@/utils/apiError'

type ScannerPhase = 'idle' | 'requesting' | 'scanning' | 'verifying' | 'success' | 'error'

interface ScannerFailure {
  code: string
  title: string
  message: string
}

interface StudentQrScannerProps {
  onClose: () => void
  onRecorded: () => void
}

const qrFailures: Record<string, { title: string; message: string }> = {
  token_expired: {
    title: 'QR code expired',
    message: 'That code is no longer valid. Ask your Professor to refresh the QR code, then scan again.',
  },
  token_invalid: {
    title: 'QR code invalid',
    message: 'This code was not recognized or has been replaced. Ask your Professor to show the current QR code.',
  },
  session_closed: {
    title: 'Session closed',
    message: 'This attendance session is no longer accepting QR check-ins.',
  },
  session_cancelled: {
    title: 'Session cancelled',
    message: 'This class meeting has been cancelled, so attendance cannot be recorded.',
  },
  not_enrolled: {
    title: 'Not enrolled',
    message: 'You do not have an eligible enrollment for the class linked to this QR code.',
  },
  already_recorded: {
    title: 'Already recorded',
    message: 'Your attendance is already on file for this session. You do not need to scan again.',
  },
  attendance_unavailable: {
    title: 'Attendance unavailable',
    message: 'QR attendance is not active for this session. Ask your Professor to start it.',
  },
  camera_denied: {
    title: 'Camera permission denied',
    message: 'Allow camera access in your browser settings, then try scanning again.',
  },
  camera_unavailable: {
    title: 'Camera unavailable',
    message: 'No camera could be opened. Close other camera apps or try another device, then retry.',
  },
  secure_context_required: {
    title: 'Secure connection required',
    message: 'Camera scanning requires HTTPS or localhost. Open ClassFlow from a secure address and retry.',
  },
  unexpected: {
    title: 'Attendance unavailable',
    message: 'The attendance check-in could not be completed. Please try again.',
  },
}

function cameraFailure(error: unknown): ScannerFailure {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return { code: 'camera_denied', ...qrFailures.camera_denied }
    }

    if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
      return { code: 'camera_unavailable', ...qrFailures.camera_unavailable }
    }

    if (error.name === 'NotReadableError') {
      return {
        code: 'camera_unavailable',
        title: qrFailures.camera_unavailable.title,
        message: 'The camera is already in use by another application. Close it and try again.',
      }
    }
  }

  return { code: 'camera_unavailable', ...qrFailures.camera_unavailable }
}

export function StudentQrScanner({ onClose, onRecorded }: StudentQrScannerProps) {
  const [phase, setPhase] = useState<ScannerPhase>('idle')
  const [failure, setFailure] = useState<ScannerFailure | null>(null)
  const [result, setResult] = useState<AttendanceQrCheckInResult | null>(null)
  const [manualEntry, setManualEntry] = useState(false)
  const [manualToken, setManualToken] = useState('')
  const [isSubmittingManual, setIsSubmittingManual] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const stoppedRef = useRef(true)
  const cameraGenerationRef = useRef(0)
  const scanRef = useRef<() => void>(() => undefined)

  const stopCamera = useCallback(() => {
    stoppedRef.current = true
    cameraGenerationRef.current += 1

    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    const stream = streamRef.current
    streamRef.current = null
    stream?.getTracks().forEach((track) => track.stop())

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const handleToken = useCallback(async (value: string) => {
    stopCamera()
    setPhase('verifying')
    setFailure(null)
    setManualEntry(false)

    try {
      const attendance = await submitAttendanceQr(value.trim())
      setResult(attendance)
      setPhase('success')
      onRecorded()
    } catch (error) {
      const apiCode = getApiErrorCode(error)
      const code = apiCode ?? (getApiErrorStatus(error) === 422 ? 'token_invalid' : 'unexpected')
      const copy = qrFailures[code] ?? qrFailures.unexpected
      const useServerMessage = apiCode !== undefined

      setFailure({
        code,
        title: copy.title,
        message: useServerMessage ? getApiErrorMessage(error, copy.message) : copy.message,
      })
      setPhase('error')
    }
  }, [onRecorded, stopCamera])

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
        const code = jsQR(image.data, image.width, image.height, {
          inversionAttempts: 'dontInvert',
        })

        if (code?.data) {
          void handleToken(code.data)
          return
        }
      }
    }

    frameRef.current = window.requestAnimationFrame(() => scanRef.current())
  }, [handleToken])

  useEffect(() => {
    scanRef.current = scan
  }, [scan])

  const startCamera = useCallback(async () => {
    stopCamera()
    const generation = cameraGenerationRef.current + 1
    cameraGenerationRef.current = generation
    stoppedRef.current = false
    setFailure(null)
    setResult(null)
    setPhase('requesting')
    setManualEntry(false)

    if (!window.isSecureContext) {
      setFailure({ code: 'secure_context_required', ...qrFailures.secure_context_required })
      setPhase('error')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setFailure({ code: 'camera_unavailable', ...qrFailures.camera_unavailable })
      setPhase('error')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })

      if (generation !== cameraGenerationRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = stream
      const video = videoRef.current

      if (!video) {
        stopCamera()
        return
      }

      video.srcObject = stream
      await video.play()

      if (generation !== cameraGenerationRef.current) {
        stopCamera()
        return
      }

      setPhase('scanning')
      frameRef.current = window.requestAnimationFrame(scan)
    } catch (error) {
      if (generation === cameraGenerationRef.current) {
        setFailure(cameraFailure(error))
        setPhase('error')
      }
    }
  }, [scan, stopCamera])

  const handleStartScanning = useCallback(() => {
    setFailure(null)
    setResult(null)
    setManualEntry(false)
    void startCamera()
  }, [startCamera])

  const handleSwitchToManual = useCallback(() => {
    stopCamera()
    setFailure(null)
    setResult(null)
    setManualEntry(true)
    setPhase('idle')
  }, [stopCamera])

  const handleSwitchToCamera = useCallback(() => {
    setManualEntry(false)
    setFailure(null)
    setResult(null)
  }, [])

  const handleManualChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setManualToken(event.target.value)
    setFailure(null)
  }, [])

  const handleSubmitManual = useCallback(async () => {
    if (!manualToken.trim()) return
    setIsSubmittingManual(true)
    setFailure(null)
    await handleToken(manualToken.trim())
    setIsSubmittingManual(false)
  }, [manualToken, handleToken])

  const handleRetry = useCallback(() => {
    setFailure(null)
    setResult(null)
    if (manualEntry) {
      setPhase('idle')
    } else {
      void startCamera()
    }
  }, [manualEntry, startCamera])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  function handleClose() {
    stopCamera()
    onClose()
  }

  const failureCopy = failure ?? qrFailures.unexpected
  const cameraVisible = phase === 'requesting' || phase === 'scanning'

  let scannerContent: ReactNode = null

  if (phase === 'idle' && !manualEntry) {
    scannerContent = (
      <div className="text-center space-y-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-coral-100 text-coral-600 mx-auto mb-4">
          <QrCode className="size-8" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-ink">Ready to scan</h3>
        <p className="max-w-sm mx-auto text-sm leading-6 text-ink-muted">
          Position the QR code inside the scanning frame. Make sure your camera has permission to access this feature.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            type="button"
            onClick={handleStartScanning}
            className="w-full sm:w-auto"
          >
            <Camera className="size-4" aria-hidden="true" />
            Start scanning
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSwitchToManual}
            className="w-full sm:w-auto"
          >
            <Key className="size-4" aria-hidden="true" />
            Enter code manually
          </Button>
        </div>
      </div>
    )
  } else if (phase === 'idle' && manualEntry) {
    scannerContent = (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-coral-600">
          <Key className="size-4" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-ink">Enter code manually</h3>
        </div>
        <p className="text-sm leading-6 text-ink-muted">
          Type the QR attendance code shown by your Professor and submit it to check in.
        </p>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-ink">
            Attendance code
          </label>
          <input
            autoFocus
            value={manualToken}
            onChange={handleManualChange}
            placeholder="e.g. ABCD-1234-EFGH"
            maxLength={64}
            className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-flow-500 focus:outline-none focus:ring-2 focus:ring-flow-500/20"
          />
          <p className="text-xs text-ink-muted">
            The code is verified by the server. Expired or already-used codes are rejected.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleSwitchToCamera}
          >
            <Camera className="size-4" aria-hidden="true" />
            Use camera instead
          </Button>
          <Button
            type="button"
            isLoading={isSubmittingManual}
            onClick={handleSubmitManual}
            disabled={!manualToken.trim() || isSubmittingManual}
          >
            Submit code
          </Button>
        </div>
      </div>
    )
  } else if (cameraVisible) {
    scannerContent = (
      <>
        <div className="relative mb-4 overflow-hidden rounded-2xl border border-line bg-night-950">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="aspect-[4/3] w-full object-cover"
          />
          {phase === 'requesting' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-night-950/85 px-6 text-center text-white">
              <LoaderCircle className="size-9 animate-spin text-flow-300" aria-hidden="true" />
              <p className="mt-4 text-lg font-semibold">Waiting for camera permission</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-white/70">
                Approve camera access to begin scanning. Camera access requires HTTPS or localhost.
              </p>
            </div>
          ) : (
            <>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="size-56 max-w-[70%] rounded-2xl border-2 border-flow-300 shadow-[0_0_0_9999px_rgba(11,18,40,0.45)] sm:size-64" />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-night-950/80 p-3 text-center text-xs font-medium text-white/90">
                Hold the QR code inside the frame and keep the camera steady.
              </div>
            </>
          )}
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(16rem,0.7fr)]">
          <div className="rounded-xl border border-flow-100 bg-flow-50 p-4">
            <div className="flex items-center gap-2 text-flow-800">
              <Camera className="size-4" aria-hidden="true" />
              <p className="text-sm font-semibold">Scanning</p>
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-flow-900">
              <li>Point your camera at the QR code on the classroom display.</li>
              <li>Make sure the full code is visible in the frame.</li>
              <li>Wait for the attendance confirmation on this page.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-line p-4 text-xs leading-5 text-ink-muted">
            <div className="flex items-center gap-2 text-ink">
              <ShieldCheck className="size-4 text-flow-600" aria-hidden="true" />
              <p className="font-semibold">Secure check-in</p>
            </div>
            <p className="mt-2">
              The QR code contains only a short-lived opaque token. Your identity comes from your
              authenticated ClassFlow session.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSwitchToManual}
                className="flex-1"
              >
                <Key className="size-4" aria-hidden="true" />
                Enter code manually
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
              >
                <X className="size-4" aria-hidden="true" />
                Close
              </Button>
            </div>
          </div>
        </div>
      </>
    )
  } else if (phase === 'verifying') {
    scannerContent = (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-canvas/60 px-6 py-14 text-center">
        <LoaderCircle className="size-9 animate-spin text-flow-600" aria-hidden="true" />
        <h3 className="mt-4 text-lg font-semibold text-ink">Verifying attendance</h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-ink-muted">
          Checking the QR token, session status, and your enrollment.
        </p>
      </div>
    )
  } else if (phase === 'success' && result) {
    scannerContent = (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-emerald-900">Attendance recorded</h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-emerald-800">
          {result.session.offering.subject.code} - {result.session.offering.section.code} on{' '}
          {result.session.class_date}.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Badge tone={result.attendance.status === 'late' ? 'warning' : 'success'}>
            {result.attendance.status}
          </Badge>
          {result.attendance.check_in_at ? (
            <Badge tone="neutral">Checked in {result.attendance.check_in_at}</Badge>
          ) : null}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setResult(null)
              setFailure(null)
              setPhase('idle')
              setManualEntry(false)
            }}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Scan another code
          </Button>
          <Button type="button" onClick={handleClose}>
            View my attendance
          </Button>
        </div>
      </div>
    )
  } else if (phase === 'error') {
    scannerContent = (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-red-100 text-red-700">
          {failure?.code === 'camera_denied' || failure?.code === 'camera_unavailable' || failure?.code === 'secure_context_required' ? (
            <CameraOff className="size-7" aria-hidden="true" />
          ) : failure?.code === 'already_recorded' ? (
            <CheckCircle2 className="size-7" aria-hidden="true" />
          ) : (
            <AlertTriangle className="size-7" aria-hidden="true" />
          )}
        </div>
        <h3 className="mt-4 text-xl font-semibold text-red-900">{failureCopy.title}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-red-800">{failureCopy.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {failure?.code !== 'already_recorded' && !manualEntry ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleRetry}
            >
              <QrCode className="size-4" aria-hidden="true" />
              Try scanning again
            </Button>
          ) : null}
          {failure?.code !== 'already_recorded' && manualEntry ? (
              <Button type="button" variant="outline" onClick={handleRetry}>
                <RefreshCw className="size-4" aria-hidden="true" />
                Try again
              </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFailure(null)
              setResult(null)
              setPhase('idle')
              setManualEntry(false)
            }}
          >
            Return to attendance
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-night-950/60 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="QR scanner"
    >
      <Card
        className="w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl border border-line bg-white shadow-[0_18px_50px_-42px_rgba(11,18,40,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <CardHeader className="flex flex-wrap items-start justify-between gap-3 pb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-coral-600">
              QR check-in
            </p>
            <h2 className="mt-1 text-lg font-semibold text-ink">
              Scan your Professor&apos;s QR code
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              Attendance is recorded against your own signed-in student account.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            aria-label="Close QR scanner"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </CardHeader>

        <div className="p-5 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {scannerContent}

          <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
        </div>
      </Card>
    </div>
  )
}
