import type { JSX } from 'preact'
import './price.scss'

export interface PriceProps extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'prefix'> {
  amount?: number | string
  decimal?: string
  currency?: string
  prefix?: string
  showPrefix?: boolean
}

function formatAmount(amount: number | string) {
  return typeof amount === 'number'
    ? new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(amount)
    : amount
}

export function Price({
  amount = 2400,
  decimal = '00',
  currency = 'zł',
  prefix = 'od',
  showPrefix = true,
  class: className,
  ...props
}: PriceProps) {
  const formattedAmount = formatAmount(amount)
  const accessiblePrice = [showPrefix && prefix, `${formattedAmount},${decimal}`, currency].filter(Boolean).join(' ')

  return (
    <span
      {...props}
      class={['cd-price', className].filter(Boolean).join(' ')}
      aria-label={props['aria-label'] ?? accessiblePrice}
    >
      {showPrefix && <span class="cd-price__prefix" aria-hidden="true">{prefix}</span>}
      <span class="cd-price__amount" aria-hidden="true">{formattedAmount}</span>
      <span class="cd-price__suffix" aria-hidden="true">,{decimal} {currency}</span>
    </span>
  )
}
