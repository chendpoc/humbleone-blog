'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { isApiCanceledError, normalizeApiError, type ApiError } from '../../services/api/request'

export type ApiQueryStatus = 'idle' | 'loading' | 'success' | 'error'

export type ApiQueryState<TData> = {
  data: TData | null
  error: ApiError | null
  status: ApiQueryStatus
}

type ApiQueryContext = {
  signal: AbortSignal
}

type UseApiQueryOptions<TData> = {
  immediate?: boolean
  initialData?: TData | null
}

export function useApiQuery<TData>(
  queryFn: (context: ApiQueryContext) => Promise<TData>,
  options: UseApiQueryOptions<TData> = {},
) {
  const { immediate = true, initialData = null } = options
  const queryFnRef = useRef(queryFn)
  const abortRef = useRef<AbortController | null>(null)
  const [state, setState] = useState<ApiQueryState<TData>>({
    data: initialData,
    error: null,
    status: 'idle',
  })

  useEffect(() => {
    queryFnRef.current = queryFn
  }, [queryFn])

  const execute = useCallback(async () => {
    abortRef.current?.abort()

    const controller = new AbortController()
    abortRef.current = controller

    setState((current) => ({
      ...current,
      error: null,
      status: 'loading',
    }))

    try {
      const data = await queryFnRef.current({ signal: controller.signal })

      if (controller.signal.aborted) {
        return null
      }

      setState({
        data,
        error: null,
        status: 'success',
      })

      return data
    } catch (error) {
      if (controller.signal.aborted || isApiCanceledError(error)) {
        return null
      }

      const apiError = normalizeApiError(error)

      setState((current) => ({
        ...current,
        error: apiError,
        status: 'error',
      }))

      return null
    }
  }, [])

  useEffect(() => {
    if (!immediate) {
      return undefined
    }

    void execute()

    return () => {
      abortRef.current?.abort()
    }
  }, [execute, immediate])

  return {
    ...state,
    isIdle: state.status === 'idle',
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    refetch: execute,
  }
}
