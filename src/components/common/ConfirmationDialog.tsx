import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { TextField } from '@/components/common/TextField'
import { useDialogFocus } from '@/hooks/useDialogFocus'

type DialogVariant = 'confirm' | 'prompt'

interface ConfirmationDialogProps {
  onClose: () => void
  variant?: DialogVariant
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  isLoading?: boolean
  inputLabel?: string
  inputPlaceholder?: string
  inputValue?: string
  onConfirm: (value: string) => void | Promise<void>
}

export function ConfirmationDialog({
  onClose,
  variant = 'confirm',
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  isLoading = false,
  inputLabel,
  inputPlaceholder,
  inputValue = '',
  onConfirm,
}: ConfirmationDialogProps) {
  const [input, setInput] = useState(inputValue ?? '')

  const requestClose = () => {
    if (!isLoading) onClose()
  }

  const dialogRef = useDialogFocus<HTMLDivElement>({
    onClose: requestClose,
    initialFocusSelector: '[data-autofocus]',
  })

  const handleConfirm = () => {
    if (isLoading) return
    if (variant === 'prompt' && !input.trim()) return
    void onConfirm(input.trim())
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-brand-900/55 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby={description ? 'confirmation-dialog-description' : undefined}
        tabIndex={-1}
        className="w-full max-w-md rounded-lg border border-line bg-surface shadow-[var(--shadow-dialog)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 id="confirmation-dialog-title" className="text-lg font-semibold text-ink">
              {title}
            </h2>
            {description ? (
              <p
                id="confirmation-dialog-description"
                className="mt-1 text-sm leading-6 text-ink-muted"
              >
                {description}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={requestClose}
            aria-label="Close dialog"
            disabled={isLoading}
            className="-mr-2 -mt-1"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        {variant === 'prompt' && inputLabel ? (
          <div className="px-5 py-4">
            <TextField
              label={inputLabel}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={inputPlaceholder}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleConfirm()
                }
              }}
              disabled={isLoading}
              autoFocus
              data-autofocus
            />
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4">
          <Button type="button" variant="outline" onClick={requestClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'danger' : 'primary'}
            isLoading={isLoading}
            onClick={handleConfirm}
            disabled={isLoading || (variant === 'prompt' && !input.trim())}
            data-autofocus={variant === 'confirm' ? true : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
