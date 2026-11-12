import { useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { controlClassName, labelClassName } from '@/components/common/formStyles'
import { cn } from '@/utils/cn'

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

export function TextareaField({
  label,
  error,
  hint,
  className,
  id,
  ...props
}: TextareaFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const messageId = `${fieldId}-message`

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={fieldId} className={labelClassName}>
        {label}
      </label>
      <textarea
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn(
          controlClassName,
          'min-h-24 resize-y py-2.5',
          error && 'border-danger focus:border-danger focus:ring-danger/20',
        )}
        {...props}
      />
      {error ? (
        <p id={messageId} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
