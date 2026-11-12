import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import type { ClassFlowRole } from '@/types/auth'
import { cn } from '@/utils/cn'

const themes = {
  professor: {
    label: 'Faculty workspace',
    headline: 'Plan, teach, and account for every class.',
    description:
      'ClassFlow gives professors a focused workspace for rosters, sessions, attendance, and teaching communication.',
    points: [
      'Organize class sections and schedules',
      'Capture attendance without paperwork',
      'Keep students aligned with announcements',
    ],
    accentText: 'text-flow-300',
    accentDot: 'bg-flow-400',
    glow: 'bg-flow-500/20',
    tagline: 'The calm center of your teaching day.',
  },
  student: {
    label: 'Student workspace',
    headline: 'Your classes, schedule, and attendance in one place.',
    description:
      'ClassFlow keeps students oriented with the classes they belong to, when they meet, and how attendance is tracking.',
    points: [
      'See enrolled classes and schedules',
      'Follow attendance at a glance',
      'Never miss a class announcement',
    ],
    accentText: 'text-coral-300',
    accentDot: 'bg-coral-400',
    glow: 'bg-coral-500/20',
    tagline: 'Know what is next, without the noise.',
  },
} as const

interface AuthLayoutProps {
  role: ClassFlowRole
  children: ReactNode
}

export function AuthLayout({ role, children }: AuthLayoutProps) {
  const theme = themes[role]

  return (
    <div className="grid min-h-svh bg-canvas lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-night-950 px-12 py-14 lg:flex lg:flex-col">
        <div
          className={cn(
            'absolute -left-28 top-16 size-[22rem] rounded-full blur-3xl',
            theme.glow,
          )}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 right-0 size-80 rounded-full bg-white/5 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10">
          <Logo />
        </div>

        <div className="relative z-10 my-auto max-w-xl py-16">
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
              theme.accentText,
            )}
          >
            <span className={cn('size-1.5 rounded-full', theme.accentDot)} aria-hidden="true" />
            {theme.label}
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-[1.12] tracking-[-0.03em] text-white xl:text-[2.9rem]">
            {theme.headline}
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-7 text-white/55">
            {theme.description}
          </p>

          <ul className="mt-9 space-y-3.5">
            {theme.points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-white/70">
                <span
                  className={cn(
                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full',
                    theme.glow,
                  )}
                >
                  <Check className={cn('size-3', theme.accentText)} aria-hidden="true" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-5 text-xs text-white/35">
          <span>CCSync · College of Computer Studies</span>
          <span>ClassFlow v0.1.0</span>
        </div>
      </aside>

      <section className="flex min-h-svh flex-col justify-center px-5 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Logo variant="onLight" />
          </div>
          {children}
        </div>
      </section>
    </div>
  )
}
