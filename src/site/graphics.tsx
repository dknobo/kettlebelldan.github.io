type MarkProps = {
  className?: string
}

export function BellMark({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 200 248" fill="none" aria-hidden>
      <path
        d="M62 78c0-28 20-46 38-46s38 18 38 46"
        stroke="currentColor"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <rect x="48" y="70" width="28" height="20" rx="4" fill="currentColor" />
      <rect x="124" y="70" width="28" height="20" rx="4" fill="currentColor" />
      <ellipse cx="100" cy="168" rx="72" ry="70" fill="currentColor" />
      <ellipse cx="100" cy="162" rx="26" ry="24" fill="#110e0c" opacity="0.35" />
    </svg>
  )
}

export function BoltMark({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 24 40" aria-hidden>
      <path fill="currentColor" d="M13 0 0 22h9L7 40l17-24h-9L17 0H13z" />
    </svg>
  )
}

export function KrueStamp({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 280 120" fill="currentColor" aria-hidden>
      <text
        x="140"
        y="58"
        textAnchor="middle"
        fontFamily="Anton, Impact, sans-serif"
        fontSize="52"
        letterSpacing="6"
      >
        KRÜE
      </text>
      <g transform="translate(118 72)">
        <path d="M12 10c0-6 4-10 10-10s10 4 10 10" fill="none" stroke="currentColor" strokeWidth="4" />
        <rect x="8" y="8" width="7" height="5" rx="1" />
        <rect x="29" y="8" width="7" height="5" rx="1" />
        <ellipse cx="22" cy="28" rx="16" ry="14" />
      </g>
    </svg>
  )
}

