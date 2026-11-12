import { useId } from 'react'
import type { ReactNode, SelectHTMLAttributes } from 'react'
import { controlClassName, labelClassName } from '@/components/common/formStyles'
import { cn } from '@/utils/cn'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hint?: string
  children: ReactNode
}

export function SelectField({
  label,
  error,
  hint,
  className,
  id,
  children,
  ...props
}: SelectFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const messageId = `${fieldId}-message`

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={fieldId} className={labelClassName}>
        {label}
      </label>
      <select
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn(
          controlClassName,
          'h-11',
          error && 'border-danger focus:border-danger focus:ring-danger/20',
        )}
        {...props}
      >
        {children}
      </select>
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
