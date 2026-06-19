'use client'

import { useEffect, useRef, useState } from 'react'

type UseMinimumVisibleLoadingOptions = {
  minDurationMs?: number
  resetKey?: unknown
}

export function useMinimumVisibleLoading(
  active: boolean,
  {
    minDurationMs = 900,
    resetKey,
  }: UseMinimumVisibleLoadingOptions = {},
) {
  const [visible, setVisible] = useState(active)
  const startedAtRef = useRef(active ? Date.now() : 0)

  useEffect(() => {
    if (active) {
      startedAtRef.current = Date.now()
      setVisible(true)

      return undefined
    }

    if (!visible) {
      return undefined
    }

    const remainingMs = Math.max(0, minDurationMs - (Date.now() - startedAtRef.current))

    if (remainingMs <= 0) {
      setVisible(false)

      return undefined
    }

    const timeout = window.setTimeout(() => {
      setVisible(false)
    }, remainingMs)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [active, minDurationMs, resetKey, visible])

  return visible
}
