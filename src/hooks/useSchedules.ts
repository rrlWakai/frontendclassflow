import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { fetchMySchedules } from '@/services/api/scheduling'
import type { MySchedule } from '@/types/scheduling'

export function useSchedules() {
  const [schedules, setSchedules] = useState<MySchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void fetchMySchedules()
      .then((records) => {
        if (active) setSchedules(records)
      })
      .catch((requestError: unknown) => {
        if (!active) return
        const message = isAxiosError(requestError)
          ? requestError.response?.data?.message ?? 'Your schedule could not be loaded.'
          : 'Your schedule could not be loaded.'
        setError(message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return { schedules, loading, error }
}
