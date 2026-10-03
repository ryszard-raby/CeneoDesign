import type { JSX } from 'preact'
import './rating.scss'

export type RatingSize = 'default' | 'small' | 'compact'

export interface RatingProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  value?: number
  count?: number
  size?: RatingSize
}

function formatRating(value: number) {
  return value.toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function starState(value: number, index: number) {
  const fill = value - index
  if (fill >= 0.75) return 'full'
  if (fill >= 0.25) return 'half'
  return 'empty'
}

export function Rating({ value = 4.5, count = 999, size = 'default', class: className, ...props }: RatingProps) {
  const normalizedValue = Math.max(0, Math.min(5, value))
  const formattedValue = formatRating(normalizedValue)
  const formattedCount = new Intl.NumberFormat('pl-PL').format(count)
  const starCount = size === 'compact' ? 1 : 5

  return (
    <span
      {...props}
      class={['cd-rating', `cd-rating--${size}`, className].filter(Boolean).join(' ')}
      aria-label={props['aria-label'] ?? `Ocena ${formattedValue} na 5, ${formattedCount} opinii`}
    >
      <span class="cd-rating__stars" aria-hidden="true">
        {Array.from({ length: starCount }, (_, index) => (
          <span class={['cd-rating__star', `cd-rating__star--${size === 'compact' ? 'full' : starState(normalizedValue, index)}`].join(' ')} key={index} />
        ))}
      </span>
      <span class="cd-rating__value" aria-hidden="true">{formattedValue}</span>
      <span class="cd-rating__count" aria-hidden="true">({formattedCount})</span>
    </span>
  )
}
