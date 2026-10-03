import type { ComponentChildren, JSX } from 'preact'
import './button.scss'

export type ButtonVariant = 'primary' | 'accent' | 'outline' | 'selected' | 'dashed' | 'blank' | 'gray'
export type ButtonSize = 'default' | 'small'

export interface ButtonProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: ButtonVariant
  size?: ButtonSize
  iconStart?: ComponentChildren
  iconEnd?: ComponentChildren
  children?: ComponentChildren
}

export function Button({ variant = 'primary', size = 'default', iconStart, iconEnd, children = 'Button', class: className, type = 'button', ...props }: ButtonProps) {
  return <button {...props} type={type} class={['cd-button', `cd-button--${variant}`, `cd-button--${size}`, className].filter(Boolean).join(' ')}>
    {iconStart && <span class="cd-button__icon" aria-hidden="true">{iconStart}</span>}
    {children && <span class="cd-button__label">{children}</span>}
    {iconEnd && <span class="cd-button__icon" aria-hidden="true">{iconEnd}</span>}
  </button>
}
