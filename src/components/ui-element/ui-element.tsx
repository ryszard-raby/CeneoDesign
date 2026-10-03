import './ui-element.scss'

export const uiElementNames = ['logo'] as const

export type UiElementName = (typeof uiElementNames)[number]

const uiElementFiles = import.meta.glob('../../ui elements/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const uiElementUrls = Object.fromEntries(
  Object.entries(uiElementFiles).map(([path, url]) => {
    const filename = path.split('/').pop()!.replace(/\.svg$/i, '')
    return [filename.toLowerCase().replace(/\s+/g, '-'), url]
  }),
) as Record<UiElementName, string>

export interface UiElementProps {
  name: UiElementName
  label?: string
  class?: string
}

export function UiElement({ name, label, class: className }: UiElementProps) {
  return (
    <img
      class={['cd-ui-element', `cd-ui-element--${name}`, className].filter(Boolean).join(' ')}
      src={uiElementUrls[name]}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      draggable={false}
    />
  )
}
