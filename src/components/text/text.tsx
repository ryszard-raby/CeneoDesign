import { createElement } from 'preact'
import type { ComponentChildren, JSX } from 'preact'
import './text.scss'

export type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
export type TextWeight = 'normal' | 'bold'
export type TextElement = 'span' | 'p' | 'div' | 'label' | 'strong' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

export interface TextProps extends Omit<JSX.HTMLAttributes<HTMLElement>, 'size'> {
  as?: TextElement
  size?: TextSize
  weight?: TextWeight
  content?: string
  children?: ComponentChildren
}

export function Text({
  as: Element = 'span',
  size = 'xs',
  weight = 'normal',
  content,
  children,
  class: className,
  ...props
}: TextProps) {
  return createElement(
    Element,
    {
      ...props,
      class: ['cd-text', `cd-text--${size}`, `cd-text--${weight}`, className].filter(Boolean).join(' '),
    },
    children ?? content ?? 'Text',
  )
}
