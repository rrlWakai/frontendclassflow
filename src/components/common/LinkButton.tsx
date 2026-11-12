import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LinkProps } from 'react-router-dom'
import {
  buttonBaseStyles,
  buttonSizeStyles,
  buttonVariantStyles,
} from '@/components/common/buttonStyles'
import type { ButtonSize, ButtonVariant } from '@/components/common/buttonStyles'
import { cn } from '@/utils/cn'

interface LinkButtonProps extends LinkProps {
  variant?: ButtonVariant
  size?: ButtonSize
  leftIcon?: ReactNode
  className?: string
  children: ReactNode
}

export function LinkButton({
  variant = 'primary',
  size = 'md',
  leftIcon,
  className,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={cn(
        buttonBaseStyles,
        buttonVariantStyles[variant],
        buttonSizeStyles[size],
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
    </Link>
  )
}
