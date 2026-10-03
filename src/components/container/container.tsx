import type { ComponentChildren, JSX } from 'preact'
import './container.scss'

export type ContainerDirection = 'horizontal' | 'vertical'

export interface ContainerProps extends JSX.HTMLAttributes<HTMLDivElement> {
  direction?: ContainerDirection
  children?: ComponentChildren
}

export function Container({ direction = 'horizontal', children, class: className, ...props }: ContainerProps) {
  return (
    <div {...props} class={['cd-container', `cd-container--${direction}`, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}
