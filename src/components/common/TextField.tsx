import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { controlClassName, labelClassName } from '@/components/common/formStyles'
import { cn } from '@/utils/cn'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
}

export function TextField({
  label,
  error,
  hint,
  leftIcon,
  className,
  id,
  ...props
}: TextFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const messageId = `${fieldId}-message`

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={fieldId} className={labelClassName}>
        {label}
      </label>
      <div className="relative">
        {leftIcon ? (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-subtle">
            {leftIcon}
          </span>
        ) : null}
        <input
          id={fieldId}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? messageId : undefined}
          className={cn(
            controlClassName,
            'h-11',
            leftIcon ? 'pl-10' : undefined,
            error && 'border-danger focus:border-danger focus:ring-danger/20',
          )}
          {...props}
        />
      </div>
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
