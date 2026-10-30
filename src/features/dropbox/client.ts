import {
  disconnectDropbox,
  DropboxAuthError,
  getValidAccessToken,
  saveDropboxAccount,
} from './auth'
import type { DropboxAccount } from './types'

const CONTENT_UPLOAD_URL =
  'https://content.dropboxapi.com/2/files/upload'
const CONTENT_DOWNLOAD_URL =
  'https://content.dropboxapi.com/2/files/download'
const ACCOUNT_URL =
  'https://api.dropboxapi.com/2/users/get_current_account'

export class DropboxApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'DropboxApiError'
    this.status = status
  }
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      error_summary?: string
      error?: unknown
    }
    return (
      payload.error_summary ??
      (typeof payload.error === 'string'
        ? payload.error
        : `Dropbox request failed (${response.status}).`)
    )
  } catch {
    return `Dropbox request failed (${response.status}).`
  }
}

async function authorizedFetch(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const request = (token: string) => {
    const headers = new Headers(init.headers)
    headers.set('Authorization', `Bearer ${token}`)
    return fetch(url, { ...init, headers })
  }

  let token = await getValidAccessToken()
  let response = await request(token)

  if (response.status === 401) {
    token = await getValidAccessToken(true)
    response = await request(token)
  }

  if (response.status === 401) {
    // The refreshed token was rejected too. Clear the stale session so the
    // dialog can offer Connect instead of showing a raw Dropbox JSON error.
    disconnectDropbox()
    throw new DropboxAuthError(
      'refresh_failed',
      'Dropbox access expired. Connect Dropbox again.',
    )
  }

  return response
}

export async function uploadDropboxFile(
  path: string,
  content: Blob,
): Promise<void> {
  // Dropbox's content upload endpoint rejects media MIME types such as
  // audio/mpeg. The original MIME type lives in data.json instead.
  const response = await authorizedFetch(CONTENT_UPLOAD_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({
        path,
        mode: 'overwrite',
        autorename: false,
        mute: true,
      }),
    },
    body: content,
  })

  if (!response.ok) {
    throw new DropboxApiError(
      response.status,
      await errorMessage(response),
    )
  }
}

export async function downloadDropboxFile(
  path: string,
): Promise<Blob | null> {
  const response = await authorizedFetch(CONTENT_DOWNLOAD_URL, {
    method: 'POST',
    headers: {
      'Dropbox-API-Arg': JSON.stringify({ path }),
    },
  })

  if (response.status === 409) {
    const message = await errorMessage(response)
    if (message.includes('path/not_found')) return null
    throw new DropboxApiError(409, message)
  }

  if (!response.ok) {
    throw new DropboxApiError(
      response.status,
      await errorMessage(response),
    )
  }

  return response.blob()
}

export async function getDropboxAccount(): Promise<DropboxAccount> {
  const response = await authorizedFetch(ACCOUNT_URL, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new DropboxApiError(
      response.status,
      await errorMessage(response),
    )
  }

  const payload = (await response.json()) as {
    name?: { display_name?: string }
    email?: string
  }

  const account: DropboxAccount = {
    name: payload.name?.display_name ?? 'Dropbox user',
    email: payload.email ?? '',
  }
  saveDropboxAccount(account)
  return account
}
