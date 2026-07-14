import { useEffect, useRef, useState } from 'react'

// Animated count-up for numeric values. Falls back to the final value instantly
// when the user prefers reduced motion.
export default function AnimatedNumber({ value, duration = 700, decimals }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef()
  const prefersReduced = typeof window !== 'undefined' &&
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const target = Number(value)
    if (Number.isNaN(target)) { setDisplay(value); return }
    if (prefersReduced) { setDisplay(target); return }

    const dec = decimals != null ? decimals : (String(value).split('.')[1]?.length || 0)
    const start = performance.now()
    const from = 0
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
      const current = from + (target - from) * eased
      setDisplay(dec > 0 ? Number(current.toFixed(dec)) : Math.round(current))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value, duration, decimals, prefersReduced])

  return <span className="num-pop">{display}</span>
}
