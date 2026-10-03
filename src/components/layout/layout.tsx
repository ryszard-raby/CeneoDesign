import type { ComponentChildren, JSX } from 'preact'
import './layout.scss'

export interface LayoutProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children?: ComponentChildren
}

export function Layout({ children, class: className, ...props }: LayoutProps) {
  return (
    <div {...props} class={['cd-layout', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}
