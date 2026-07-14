import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

// Dependency-free line chart for a single marker's trend, RTL-aware.
// Premium touches: gradient area fill, animated path draw, soft grid, glowing points.
export default function TrendChart({ series, referenceHigh, referenceLow }) {
  const { i18n } = useTranslation()
  const rtl = i18n.dir() === 'rtl'
  const points = series.points || []
  const gid = useMemo(() => `grad-${series.marker_key}-${Math.round((referenceHigh || 1) * 100)}`, [series.marker_key, referenceHigh])
  if (points.length === 0) return null

  const W = 520, H = 190, padX = 38, padY = 24
  const values = points.map((p) => p.value)
  const maxV = Math.max(...values, referenceHigh || 0) * 1.15
  const minV = Math.min(...values, referenceLow || 0, 0)
  const range = maxV - minV || 1
  const n = points.length

  const xAt = (i) => {
    const frac = n === 1 ? 0.5 : i / (n - 1)
    const f = rtl ? 1 - frac : frac
    return padX + f * (W - padX * 2)
  }
  const yAt = (v) => H - padY - ((v - minV) / range) * (H - padY * 2)

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(p.value).toFixed(1)}`).join(' ')
  // Area path closes down to the baseline for the gradient fill.
  const baseY = H - padY
  const areaPath = `${linePath} L ${xAt(n - 1).toFixed(1)} ${baseY} L ${xAt(0).toFixed(1)} ${baseY} Z`

  // Approximate polyline length for the draw animation.
  const lineLen = useMemo(() => {
    let len = 0
    for (let i = 1; i < n; i++) {
      len += Math.hypot(xAt(i) - xAt(i - 1), yAt(points[i].value) - yAt(points[i - 1].value))
    }
    return Math.max(len, 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, rtl, referenceHigh])

  const statusColor = (s) =>
    s === 'high' ? 'var(--alert)' : s === 'elevated' ? 'var(--monitor)' : 'var(--normal)'

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Trend chart" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Reference band */}
      {referenceHigh != null && (
        <rect
          x={padX} y={yAt(referenceHigh)} width={W - padX * 2}
          height={Math.max(0, yAt(referenceLow || 0) - yAt(referenceHigh))}
          fill="var(--normal-soft)" opacity="0.6" rx="6"
        />
      )}
      {referenceHigh != null && (
        <line x1={padX} x2={W - padX} y1={yAt(referenceHigh)} y2={yAt(referenceHigh)}
          stroke="var(--normal)" strokeDasharray="4 5" strokeWidth="1" opacity="0.55" />
      )}

      {/* Gradient area + animated line */}
      <path d={areaPath} fill={`url(#${gid})`} opacity="0.9" />
      <path
        className="chart-line"
        d={linePath} fill="none" stroke="var(--primary)" strokeWidth="2.75"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ '--len': lineLen }}
      />

      {/* Points */}
      {points.map((p, i) => (
        <g key={p.report_id} className="chart-dot" style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
          <circle cx={xAt(i)} cy={yAt(p.value)} r="8" fill={statusColor(p.status)} opacity="0.16" />
          <circle cx={xAt(i)} cy={yAt(p.value)} r="5" fill={statusColor(p.status)} stroke="var(--surface)" strokeWidth="2" />
          <text x={xAt(i)} y={yAt(p.value) - 13} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-muted)">
            {p.value}
          </text>
        </g>
      ))}
    </svg>
  )
}
