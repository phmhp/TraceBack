export function ScreenHeading({ step, title, description }: {
  step: string; title: string; description: string
}) {
  return <header className="mb-8">
    <p className="eyebrow mb-3">{step} / TRACKBACK</p>
    <h1 tabIndex={-1} className="screen-title">{title}</h1>
    <p className="mt-3 text-muted">{description}</p>
  </header>
}
