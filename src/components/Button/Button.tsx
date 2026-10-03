import type { ButtonHTMLAttributes, ComponentChildren } from 'preact'
import './Button.scss'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ComponentChildren
  loading?: boolean
  size?: 'small' | 'medium'
  variant?: 'primary' | 'secondary'
}

export function Button({
  children,
  class: className,
  disabled,
  loading = false,
  size = 'medium',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  const classes = [
    'ceneo-button',
    `ceneo-button--${variant}`,
    `ceneo-button--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      class={classes}
      disabled={disabled || loading}
      type={type}
    >
      {loading && <span aria-hidden="true" class="ceneo-button__spinner" />}
      <span>{children}</span>
    </button>
  )
}