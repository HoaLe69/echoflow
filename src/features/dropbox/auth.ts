import type { DropboxAccount, DropboxAuth } from './types'

const APP_KEY = (
  import.meta.env.VITE_DROPBOX_APP_KEY as string | undefined
)?.trim()

const AUTH_URL = 'https://www.dropbox.com/oauth2/authorize'
const TOKEN_URL = 'https://api.dropboxapi.com/oauth2/token'
const AUTH_STORAGE_KEY = 'echoflow:dropbox:auth:v1'
const PKCE_STORAGE_KEY = 'echoflow:dropbox:pkce:v1'
const SCOPES = [
  'files.content.read',
  'files.content.write',
  'account_info.read',
]

export type DropboxAuthErrorCode =
  | 'not_configured'
  | 'not_connected'
  | 'oauth_failed'
  | 'state_mismatch'
  | 'refresh_failed'

export class DropboxAuthError extends Error {
  readonly code: DropboxAuthErrorCode

  constructor(code: DropboxAuthErrorCode, message: string) {
    super(message)
    this.name = 'DropboxAuthError'
    this.code = code
  }
}

type TokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
}

type PkceRecord = {
  verifier: string
  state: string
}

export function isDropboxConfigured(): boolean {
  return Boolean(APP_KEY)
}

export function getDropboxRedirectUri(): string {
  return `${window.location.origin}/`
}

export function hasDropboxCallback(): boolean {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return params.has('code') || params.has('error')
}

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function randomString(byteLength = 64): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength))
  return base64Url(bytes)
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  )
  return base64Url(new Uint8Array(digest))
}

function readStoredAuth(): DropboxAuth | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<DropboxAuth>
    if (
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.expiresAt !== 'number'
    ) {
      return null
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken:
        typeof parsed.refreshToken === 'string'
          ? parsed.refreshToken
          : undefined,
      expiresAt: parsed.expiresAt,
      account: parsed.account,
    }
  } catch {
    return null
  }
}

export function getStoredAuth(): DropboxAuth | null {
  return readStoredAuth()
}

function writeAuth(auth: DropboxAuth): void {
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
  } catch {
    // Private browsing / quota: the in-memory session still works this time.
  }
}

function clearAuth(): void {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    window.sessionStorage.removeItem(PKCE_STORAGE_KEY)
  } catch {
    // Ignore storage failures.
  }
}

export function saveDropboxAccount(account: DropboxAccount): void {
  const auth = readStoredAuth()
  if (!auth) return
  writeAuth({ ...auth, account })
}

export function disconnectDropbox(): void {
  clearAuth()
}

function cleanCallbackUrl(): void {
  const url = new URL(window.location.href)
  for (const key of ['code', 'state', 'error', 'error_description']) {
    url.searchParams.delete(key)
  }
  window.history.replaceState(
    {},
    document.title,
    `${url.pathname}${url.search}${url.hash}`,
  )
}

async function requestToken(
  body: URLSearchParams,
): Promise<TokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    let detail = ''
    try {
      const payload = (await response.json()) as {
        error_description?: string
        error?: string
      }
      detail = payload.error_description ?? payload.error ?? ''
    } catch {
      // Non-JSON error body.
    }
    throw new DropboxAuthError(
      'oauth_failed',
      detail || `Dropbox authorization failed (${response.status}).`,
    )
  }

  return (await response.json()) as TokenResponse
}

export async function startDropboxAuth(): Promise<void> {
  if (!APP_KEY) {
    throw new DropboxAuthError(
      'not_configured',
      'Dropbox sync is not configured. Add VITE_DROPBOX_APP_KEY.',
    )
  }

  const verifier = randomString(64)
  const state = randomString(32)
  const pkce: PkceRecord = { verifier, state }
  window.sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(pkce))

  const url = new URL(AUTH_URL)
  url.searchParams.set('client_id', APP_KEY)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', getDropboxRedirectUri())
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('code_challenge', await sha256(verifier))
  url.searchParams.set('state', state)
  url.searchParams.set('token_access_type', 'offline')
  url.searchParams.set('scope', SCOPES.join(' '))

  window.location.assign(url.toString())
}

export async function completeDropboxAuth(): Promise<DropboxAuth | null> {
  if (typeof window === 'undefined') return null

  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const state = url.searchParams.get('state')

  if (!code && !error) return null

  const rawPkce = window.sessionStorage.getItem(PKCE_STORAGE_KEY)
  window.sessionStorage.removeItem(PKCE_STORAGE_KEY)
  cleanCallbackUrl()

  if (error) {
    throw new DropboxAuthError(
      'oauth_failed',
      url.searchParams.get('error_description') ??
        'Dropbox authorization was cancelled.',
    )
  }

  if (!code || !state) {
    throw new DropboxAuthError(
      'oauth_failed',
      'Dropbox returned an incomplete authorization response.',
    )
  } else if (!rawPkce) {
    throw new DropboxAuthError(
      'oauth_failed',
      'Dropbox authorization session was lost. Please try again.',
    )
  } else if (!APP_KEY) {
    throw new DropboxAuthError(
      'not_configured',
      'Dropbox sync is not configured. Add VITE_DROPBOX_APP_KEY.',
    )
  }

  let pkce: PkceRecord
  try {
    pkce = JSON.parse(rawPkce) as PkceRecord
  } catch {
    throw new DropboxAuthError(
      'oauth_failed',
      'Dropbox authorization data was invalid. Please try again.',
    )
  }

  if (pkce.state !== state) {
    throw new DropboxAuthError(
      'state_mismatch',
      'Dropbox authorization state did not match. Please try again.',
    )
  }

  const tokens = await requestToken(
    new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: APP_KEY,
      redirect_uri: getDropboxRedirectUri(),
      code_verifier: pkce.verifier,
    }),
  )

  if (!tokens.access_token) {
    throw new DropboxAuthError(
      'oauth_failed',
      'Dropbox did not return an access token.',
    )
  }

  const auth: DropboxAuth = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + (tokens.expires_in ?? 14_400) * 1000,
  }
  writeAuth(auth)
  return auth
}

let callbackPromise: Promise<DropboxAuth | null> | null = null

/**
 * Consume the OAuth callback exactly once. React StrictMode mounts effects
 * twice in development; keeping the promise module-level avoids consuming the
 * code/state query on the first mount and having nothing left for the second.
 */
export function consumeDropboxAuthCallback(): Promise<DropboxAuth | null> {
  if (!callbackPromise) {
    callbackPromise = completeDropboxAuth()
  }
  return callbackPromise
}

export async function getValidAccessToken(
  forceRefresh = false,
): Promise<string> {
  const auth = readStoredAuth()
  if (!auth) {
    throw new DropboxAuthError(
      'not_connected',
      'Connect Dropbox before syncing.',
    )
  }

  if (
    !forceRefresh &&
    auth.expiresAt > Date.now() + 60_000
  ) {
    return auth.accessToken
  }

  if (!auth.refreshToken || !APP_KEY) {
    throw new DropboxAuthError(
      'refresh_failed',
      'Dropbox session expired. Connect Dropbox again.',
    )
  }

  let tokens: TokenResponse
  try {
    tokens = await requestToken(
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: auth.refreshToken,
        client_id: APP_KEY,
      }),
    )
  } catch (error) {
    throw new DropboxAuthError(
      'refresh_failed',
      error instanceof Error
        ? error.message
        : 'Could not refresh the Dropbox session.',
    )
  }

  if (!tokens.access_token) {
    throw new DropboxAuthError(
      'refresh_failed',
      'Dropbox did not return a refreshed access token.',
    )
  }

  const nextAuth: DropboxAuth = {
    ...auth,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? auth.refreshToken,
    expiresAt: Date.now() + (tokens.expires_in ?? 14_400) * 1000,
  }
  writeAuth(nextAuth)
  return nextAuth.accessToken
}
