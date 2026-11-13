import type { ReactNode } from 'react'

interface PageHeadingProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  highlightName?: string
  variant?: 'dashboard' | 'standard'
}

export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
  highlightName,
  variant = 'standard',
}: PageHeadingProps) {
  const isDashboard = variant === 'dashboard'
  const titleSize = isDashboard ? 'text-5xl' : 'text-4xl'
  const titleWeight = isDashboard ? 'font-semibold' : 'font-bold'

  return (
    <header className="flex flex-col gap-5 border-b border-line pb-6 sm:pb-7 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <div className="relative">
          <h1 className={`${titleSize} ${titleWeight} leading-[1.12] tracking-[-0.025em] text-ink sm:text-5xl`}>
            {highlightName ? (
              <>
                {title.replace(highlightName, '')}
                <span className="text-gold-700">{highlightName}</span>
              </>
            ) : (
              title
            )}
          </h1>
          <div className="absolute bottom-0 left-0 w-20 h-0.5 bg-gold-500 sm:w-24" aria-hidden="true" />
        </div>
        {description ? (
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  )
}
