import axios, { AxiosError, type AxiosRequestConfig } from 'axios'

export type ApiErrorCode = 'canceled' | 'http_error' | 'network_error' | 'unknown_error'

export type ApiError = {
  code: ApiErrorCode
  message: string
  status?: number
  details?: unknown
}

export type ApiRequestOptions = {
  signal?: AbortSignal
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
  timeout: 20000,
  headers: {
    Accept: 'application/json',
  },
})

export async function request<TData>(config: AxiosRequestConfig): Promise<TData> {
  try {
    const response = await apiClient.request<TData>(config)

    return response.data
  } catch (error) {
    throw normalizeApiError(error)
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error
  }

  if (axios.isAxiosError(error)) {
    return normalizeAxiosError(error)
  }

  if (error instanceof Error) {
    return {
      code: 'unknown_error',
      message: error.message,
    }
  }

  return {
    code: 'unknown_error',
    message: 'Unexpected API error.',
    details: error,
  }
}

export function isApiCanceledError(error: unknown) {
  return axios.isCancel(error) || (isApiError(error) && error.code === 'canceled')
}

function normalizeAxiosError(error: AxiosError): ApiError {
  if (error.code === AxiosError.ERR_CANCELED) {
    return {
      code: 'canceled',
      message: 'Request was canceled.',
    }
  }

  const status = error.response?.status
  const details = error.response?.data

  return {
    code: status ? 'http_error' : 'network_error',
    message: extractErrorMessage(details) ?? error.message,
    status,
    details,
  }
}

function extractErrorMessage(details: unknown) {
  if (!details || typeof details !== 'object') {
    return null
  }

  if ('message' in details && typeof details.message === 'string') {
    return details.message
  }

  if ('error' in details && typeof details.error === 'string') {
    return details.error
  }

  return null
}

function isApiError(error: unknown): error is ApiError {
  return Boolean(error && typeof error === 'object' && 'code' in error && 'message' in error)
}
