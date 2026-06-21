interface FlagImgProps {
  code: string
  className?: string
}

/**
 * Renders a country flag image via flagcdn.com.
 * More reliable than Unicode Regional Indicator sequences which don't render
 * as flag emojis on many Linux systems.
 */
export function FlagImg({ code, className = '' }: FlagImgProps) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt=""
      aria-hidden
      className={`inline-block rounded-sm object-cover align-middle shrink-0 ${className}`}
    />
  )
}
