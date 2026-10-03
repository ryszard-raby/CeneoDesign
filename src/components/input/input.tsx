import type { JSX } from 'preact'
import './input.scss'

export interface InputProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  class?: string
}

export function Input({ class: className, type = 'text', placeholder = 'Placeholder', ...props }: InputProps) {
  return (
    <input
      {...props}
      type={type}
      placeholder={placeholder}
      class={['cd-input', className].filter(Boolean).join(' ')}
    />
  )
}
