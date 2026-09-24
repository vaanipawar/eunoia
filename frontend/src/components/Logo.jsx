export default function Logo({ size = 22 }) {
  return (
    <span className="logo">
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="15" cy="9.5" r="4" fill="currentColor" />
      </svg>
      Eunoia
    </span>
  )
}