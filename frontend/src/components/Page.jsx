// Wraps page content to animate it in on mount / route change.
export default function Page({ children, className = '', ...rest }) {
  return <div className={`page-enter ${className}`} {...rest}>{children}</div>
}
