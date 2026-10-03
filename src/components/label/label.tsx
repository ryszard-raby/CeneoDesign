import type { ComponentChildren, JSX } from 'preact'
import './label.scss'

export type LabelVariant = 'filled' | 'plain'

export interface LabelProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  variant?: LabelVariant
  iconStart?: ComponentChildren
  children?: ComponentChildren
}

export function Label({
  variant = 'filled',
  iconStart,
  children = 'Label',
  class: className,
  ...props
}: LabelProps) {
  return (
    <span {...props} class={['cd-label', `cd-label--${variant}`, className].filter(Boolean).join(' ')}>
      {iconStart && <span class="cd-label__icon" aria-hidden="true">{iconStart}</span>}
      {children && <span class="cd-label__text">{children}</span>}
    </span>
  )
}
