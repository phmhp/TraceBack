import type { ReactNode } from 'react'

export function PlaceholderPanel({ title, children, className = '' }: {
  title: string; children?: ReactNode; className?: string
}) {
  return <section aria-label={title} className={`panel ${className}`}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-medium">{title}</h2>
      <span className="placeholder-tag">PLACEHOLDER</span>
    </div>
    {children && <div className="mt-6 text-muted">{children}</div>}
  </section>
}
