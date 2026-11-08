import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Card, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { fetchMyScheduleConflicts } from '@/services/api/scheduling'
import type { MyScheduleConflictPage } from '@/types/scheduling'
import { getApiErrorMessage } from '@/utils/apiError'

export function StudentScheduleConflicts() {
  const [result, setResult] = useState<MyScheduleConflictPage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void fetchMyScheduleConflicts()
      .then((response) => {
        if (active) setResult(response)
      })
      .catch((failure: unknown) => {
        if (active) setError(getApiErrorMessage(failure, 'Unable to check your enrolled schedules.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <Card className="mt-5 overflow-hidden">
      <CardHeader className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-ink">Schedule conflicts</h2>
          <p className="mt-1 text-xs text-ink-muted">
            {result?.academic_term
              ? `${result.academic_term.name} · ${result.academic_term.academic_year}`
              : 'Your current academic term'}
          </p>
        </div>
        {result?.summary.conflict_pairs ? (
          <Badge tone="warning">
            {result.summary.conflict_pairs} conflict{result.summary.conflict_pairs === 1 ? '' : 's'}
          </Badge>
        ) : null}
      </CardHeader>

      {loading ? (
        <p className="px-5 py-8 text-center text-sm text-ink-muted" role="status">
          Checking your enrolled class schedules…
        </p>
      ) : error ? (
        <p role="alert" className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : !result?.conflicts.length ? (
        <EmptyState
          icon={CheckCircle2}
          title="No overlapping schedules detected"
          description="Your active subject enrollments have no published class schedules that overlap in the current academic term."
        />
      ) : (
        <div className="divide-y divide-line">
          {result.conflicts.map((conflict) => (
            <article key={conflict.id} className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="warning">{conflict.day_label}</Badge>
                <span className="text-sm font-semibold text-ink">
                  Overlap: {conflict.overlap.start_time}–{conflict.overlap.end_time}
                </span>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {conflict.classes.map((classItem) => (
                  <div key={classItem.schedule_id} className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                    <p className="font-semibold text-ink">{classItem.subject.code} · {classItem.subject.title}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Section {classItem.section.code}
                      {classItem.section.year_level ? ` · ${classItem.section.year_level.name}` : ''}
                    </p>
                    <p className="mt-2 text-sm text-ink">
                      {classItem.start_time}–{classItem.end_time}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Room: {classItem.room ? `${classItem.room.code} · ${classItem.room.name}` : 'Not assigned'}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Professor: {classItem.professors.length
                        ? classItem.professors.map((professor) => professor.name).join(', ')
                        : 'Not assigned'}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
                <AlertTriangle className="size-3.5 text-amber-600" aria-hidden="true" />
                Contact your department about these overlapping enrolled classes.
              </p>
            </article>
          ))}
        </div>
      )}
    </Card>
  )
}
