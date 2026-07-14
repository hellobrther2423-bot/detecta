// Hand-drawn style SVG doodles (GoForward-inspired) used as light decoration in
// the hero. Purely decorative and pointer-events:none so they never block clicks.
const stroke = {
  fill: 'none', stroke: 'currentColor', strokeWidth: 2.4,
  strokeLinecap: 'round', strokeLinejoin: 'round',
}

export function DoodleSquiggle(p) {
  return (
    <svg viewBox="0 0 120 24" {...p}>
      <path {...stroke} d="M2 12c8-10 16 10 24 0s16 10 24 0 16 10 24 0 16 10 24 0" />
    </svg>
  )
}

export function DoodleCircle(p) {
  return (
    <svg viewBox="0 0 80 80" {...p}>
      <path {...stroke} d="M40 6c22-2 36 16 32 34S46 76 26 70 4 44 12 26 24 8 40 6z" />
    </svg>
  )
}

export function DoodleArrow(p) {
  return (
    <svg viewBox="0 0 90 60" {...p}>
      <path {...stroke} d="M6 40c14-26 40-34 74-30" />
      <path {...stroke} d="M64 4l16 6-8 15" />
    </svg>
  )
}

export function DoodleStar(p) {
  return (
    <svg viewBox="0 0 48 48" {...p}>
      <path {...stroke} d="M24 4v14M24 30v14M4 24h14M30 24h14" />
    </svg>
  )
}

export function DoodlePlus(p) {
  return (
    <svg viewBox="0 0 40 40" {...p}>
      <path {...stroke} d="M20 6v28M6 20h28" />
    </svg>
  )
}
