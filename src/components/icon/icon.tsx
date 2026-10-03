import './icon.scss'

export const iconNames = [
  'alarm', 'angle-down', 'angle-right', 'arrow', 'box', 'campain', 'cards',
  'cart-empty', 'cart-fill', 'cart-plus', 'chart', 'check', 'comment', 'compare',
  'contact-phone', 'contact', 'delivery', 'filtr', 'handshake', 'heart',
  'incognito', 'loader', 'minus', 'more', 'note', 'plus', 'price-down',
  'ranking', 'recycle', 'search-alt', 'search-check', 'search-plus', 'search',
  'send', 'set', 'setting', 'sort', 'star', 'thumb', 'trash', 'user', 'vs', 'zo',
] as const

export type IconName = (typeof iconNames)[number]

const iconFiles = import.meta.glob('../../icons/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const iconUrls = Object.fromEntries(
  Object.entries(iconFiles).map(([path, url]) => {
    const filename = path.split('/').pop()!.replace(/\.svg$/i, '')
    return [filename.toLowerCase().replace(/\s+/g, '-'), url]
  }),
) as Record<IconName, string>

export interface IconProps {
  name: IconName
  size?: number
  label?: string
  class?: string
}

export function Icon({ name, size = 24, label, class: className }: IconProps) {
  return (
    <img
      class={['cd-icon', className].filter(Boolean).join(' ')}
      src={iconUrls[name]}
      width={size}
      height={size}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      draggable={false}
    />
  )
}
