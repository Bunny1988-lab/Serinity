export function JournalIcon({
  size = 24,
  className,
  strokeWidth = 1.5,
}: {
  size?: number
  className?: string
  strokeWidth?: number
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Paper with dog-ear top-right corner */}
      <path d="M13 2H5a1 1 0 0 0-1 1v18a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V8z" />
      <polyline points="13 2 13 8 19 8" />

      {/* Ruled lines representing text */}
      <line x1="7" y1="11.5" x2="12" y2="11.5" />
      <line x1="7" y1="14.5" x2="15" y2="14.5" />
      <line x1="7" y1="17.5" x2="10.5" y2="17.5" />

      {/* Pen writing on last line — body (parallelogram at 45°) */}
      <path d="M11.5 17 L16.5 12 L18.5 14 L13.5 19 Z" />
      {/* Pen nib at writing tip */}
      <path d="M11.5 17 L10 20.5 L13.5 19" />
    </svg>
  )
}
