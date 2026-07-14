// Global animated gradient backdrop (Google AI Studio-style flowing mesh).
// Fixed behind all content, pointer-events:none, very low opacity so text stays
// readable. Pauses under prefers-reduced-motion via CSS.
export default function AnimatedBackground() {
  return (
    <div className="bg-mesh" aria-hidden="true">
      <span className="bg-orb o1" />
      <span className="bg-orb o2" />
      <span className="bg-orb o3" />
      <span className="bg-orb o4" />
      <div className="bg-grid" />
    </div>
  )
}
