export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export const buttonBaseStyles =
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:pointer-events-none disabled:opacity-50'

export const buttonVariantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand-800 text-white hover:bg-brand-700 active:bg-brand-900',
  secondary: 'bg-gold-400 text-brand-900 hover:bg-gold-500 active:bg-gold-500',
  outline:
    'border border-control-border bg-surface text-brand-800 hover:border-brand-700 hover:bg-brand-50 active:bg-brand-100',
  ghost: 'text-ink-muted hover:bg-surface-subtle hover:text-ink',
  danger: 'bg-danger text-white hover:bg-[#981b12] active:bg-[#84170f]',
}

export const buttonSizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-xs',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
}
