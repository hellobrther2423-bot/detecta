// Skeleton loading placeholders with shimmer. Compose a few to mimic page layout.
export function SkeletonLine({ width = '100%', style }) {
  return <div className="skeleton skeleton-line" style={{ width, ...style }} />
}

export function SkeletonCard({ lines = 3, title = true }) {
  return (
    <div className="card">
      {title && <div className="skeleton skeleton-title" />}
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 ? '70%' : '100%'} />
      ))}
    </div>
  )
}

export function SkeletonPage({ cards = 2 }) {
  return (
    <div className="container">
      <div className="skeleton skeleton-title" style={{ height: 32, width: '40%', marginBottom: 24 }} />
      {Array.from({ length: cards }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
