import { useEffect, useState } from 'react'

// GoForward-style intro loader: a full-screen panel with the animated DETECTA logo
// that draws in, then slides away to reveal the site. Shows once per browser session
// so navigation stays snappy. Respects prefers-reduced-motion (skips instantly).
export default function Preloader() {
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const alreadyShown = typeof sessionStorage !== 'undefined'
    && sessionStorage.getItem('detecta_intro_done') === '1'

  const [leaving, setLeaving] = useState(false)
  const [gone, setGone] = useState(alreadyShown || prefersReduced)

  useEffect(() => {
    if (gone) return
    // Lock scroll while the intro plays.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const leaveT = setTimeout(() => setLeaving(true), 1500)
    const goneT = setTimeout(() => {
      setGone(true)
      sessionStorage.setItem('detecta_intro_done', '1')
      document.body.style.overflow = prevOverflow
    }, 2200)
    return () => {
      clearTimeout(leaveT); clearTimeout(goneT)
      document.body.style.overflow = prevOverflow
    }
  }, [gone])

  if (gone) return null

  return (
    <div className={`preloader ${leaving ? 'leaving' : ''}`} aria-hidden="true">
      <div className="preloader-inner">
        <span className="preloader-logo">◎</span>
        <span className="preloader-name">DETECTA</span>
        <span className="preloader-bar"><span className="preloader-bar-fill" /></span>
      </div>
    </div>
  )
}
