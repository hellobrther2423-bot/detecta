// Dependency-free SVG donut chart for categorical distribution (e.g. risk levels).
// segments: [{ label, value, color }]. RTL-safe (purely radial).
export function DonutChart({ segments, size = 150, thickness = 22, centerLabel, centerSub }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = (size - thickness) / 2
  const cx = size / 2
  const circ = 2 * Math.PI * r
  let offset = 0

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
        {segments.map((seg) => {
          const frac = seg.value / total
          const dash = frac * circ
          const el = (
            <circle
              key={seg.label}
              cx={cx} cy={cx} r={r} fill="none"
              stroke={seg.color} strokeWidth={thickness}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              style={{ transition: 'stroke-dasharray 0.8s var(--ease)' }}
            />
          )
          offset += dash
          return el
        })}
      </svg>
      {(centerLabel != null) && (
        <div className="donut-center">
          <strong>{centerLabel}</strong>
          {centerSub && <span className="muted small">{centerSub}</span>}
        </div>
      )}
    </div>
  )
}

// Horizontal bar list for ranked counts (e.g. most-flagged markers).
export function BarList({ items }) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="barlist">
      {items.map((it) => (
        <div className="barlist-row" key={it.label}>
          <span className="barlist-label">{it.label}</span>
          <div className="barlist-track">
            <div className="barlist-fill" style={{ width: `${(it.value / max) * 100}%`, background: it.color || 'var(--grad-primary)' }} />
          </div>
          <span className="barlist-val">{it.value}</span>
        </div>
      ))}
    </div>
  )
}
