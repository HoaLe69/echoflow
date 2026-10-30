import { getTranscriptionSettings } from '../settingsStore'

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type ApiErrorBody = {
  error?: {
    code?: string
    message?: string
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { passcode } = getTranscriptionSettings()
  const headers = new Headers(init.headers)

  if (passcode) {
    headers.set('x-echoflow-passcode', passcode)
  }

  const response = await fetch(path, { ...init, headers })

  if (!response.ok) {
    let code = 'unknown'
    let message = `Request failed (${response.status}).`

    try {
      const body = (await response.json()) as ApiErrorBody
      code = body.error?.code ?? code
      message = body.error?.message ?? message
    } catch {
      // Non-JSON error body.
    }

    throw new ApiError(response.status, code, message)
  }

  return (await response.json()) as T
}
