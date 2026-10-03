import type { ComponentChildren, JSX } from 'preact'
import './card.scss'

export type CardStyle = 'white' | 'outlined' | 'border-bottom' | 'gray'

export interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  cardStyle?: CardStyle
  children?: ComponentChildren
}

export function Card({ cardStyle = 'white', children, class: className, ...props }: CardProps) {
  return (
    <div {...props} class={['cd-card', `cd-card--${cardStyle}`, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}
