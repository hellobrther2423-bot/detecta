import { useEffect, useRef, useState } from 'react'

// Reveals its children with a fade-up as they scroll into view (Kry-style
// "text shows up on scroll"). Uses IntersectionObserver; degrades to always-
// visible when unsupported or when the user prefers reduced motion.
export default function Reveal({ children, className = '', delay = 0, as: Tag = 'div', ...rest }) {
  const ref = useRef(null)
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [shown, setShown] = useState(prefersReduced)

  useEffect(() => {
    if (shown || !ref.current) return
    if (!('IntersectionObserver' in window)) { setShown(true); return }
    const el = ref.current
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { setShown(true); obs.unobserve(e.target) }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [shown])

  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? 'in' : ''} ${className}`}
      style={{ transitionDelay: shown ? `${delay}ms` : '0ms' }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
