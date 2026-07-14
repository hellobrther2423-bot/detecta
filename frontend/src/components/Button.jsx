import { useCallback } from 'react'

// Button with a material-style ripple on click. Drop-in replacement for <button className="btn ...">.
export default function Button({ children, className = '', onClick, ...rest }) {
  const handleClick = useCallback((e) => {
    const btn = e.currentTarget
    const circle = document.createElement('span')
    const diameter = Math.max(btn.clientWidth, btn.clientHeight)
    const rect = btn.getBoundingClientRect()
    circle.className = 'ripple'
    circle.style.width = circle.style.height = `${diameter}px`
    circle.style.left = `${e.clientX - rect.left - diameter / 2}px`
    circle.style.top = `${e.clientY - rect.top - diameter / 2}px`
    btn.appendChild(circle)
    setTimeout(() => circle.remove(), 600)
    onClick?.(e)
  }, [onClick])

  return (
    <button className={`btn ${className}`} onClick={handleClick} {...rest}>
      {children}
    </button>
  )
}
