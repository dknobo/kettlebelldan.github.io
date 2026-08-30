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
