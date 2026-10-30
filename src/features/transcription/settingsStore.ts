import { useSyncExternalStore } from 'react'
import {
  DEFAULT_TRANSCRIPTION_PROVIDER_ID,
  TRANSCRIPTION_PROVIDER_IDS,
  type TranscriptionProviderId,
} from './types'

export type TranscriptionSettings = {
  providerId: TranscriptionProviderId
  fallbackIds: TranscriptionProviderId[]
  passcode: string
}

const SETTINGS_KEY = 'echoflow:transcription:v1'
const PASSCODE_KEY = 'echoflow:transcription-passcode'

type PersistedSettings = Pick<
  TranscriptionSettings,
  'providerId' | 'fallbackIds'
>

function isProviderId(value: unknown): value is TranscriptionProviderId {
  return (
    typeof value === 'string' &&
    TRANSCRIPTION_PROVIDER_IDS.includes(value as TranscriptionProviderId)
  )
}

function readProviderFromEnv(): TranscriptionProviderId {
  const configured = import.meta.env.VITE_TRANSCRIPTION_PROVIDER
  return isProviderId(configured)
    ? configured
    : DEFAULT_TRANSCRIPTION_PROVIDER_ID
}

function readStoredSettings(): PersistedSettings {
  const fallback: PersistedSettings = {
    providerId: readProviderFromEnv(),
    fallbackIds: [],
  }

  if (typeof window === 'undefined') return fallback

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (!raw) return fallback

    const parsed = JSON.parse(raw) as Partial<PersistedSettings>
    const providerId = isProviderId(parsed.providerId)
      ? parsed.providerId
      : fallback.providerId
    const fallbackIds = Array.isArray(parsed.fallbackIds)
      ? [...new Set(parsed.fallbackIds.filter(isProviderId))]
      : []

    return { providerId, fallbackIds }
  } catch {
    return fallback
  }
}

function readPasscode(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.sessionStorage.getItem(PASSCODE_KEY) ?? ''
  } catch {
    return ''
  }
}

function writeSettings(settings: TranscriptionSettings) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        providerId: settings.providerId,
        fallbackIds: settings.fallbackIds,
      } satisfies PersistedSettings),
    )
    window.sessionStorage.setItem(PASSCODE_KEY, settings.passcode)
  } catch {
    // Storage can be unavailable in private browsing; keep in-memory state.
  }
}

const initialSettings: TranscriptionSettings = {
  ...readStoredSettings(),
  passcode: readPasscode(),
}

let settings = initialSettings
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function getTranscriptionSettings(): TranscriptionSettings {
  return settings
}

export function updateTranscriptionSettings(
  patch: Partial<TranscriptionSettings>,
): TranscriptionSettings {
  const nextProviderId =
    patch.providerId && isProviderId(patch.providerId)
      ? patch.providerId
      : settings.providerId

  const nextFallbackIds = patch.fallbackIds
    ? [
        ...new Set(
          patch.fallbackIds.filter(
            (id): id is TranscriptionProviderId =>
              isProviderId(id) && id !== nextProviderId,
          ),
        ),
      ]
    : settings.fallbackIds

  settings = {
    providerId: nextProviderId,
    fallbackIds: nextFallbackIds,
    passcode:
      patch.passcode !== undefined ? patch.passcode.trim() : settings.passcode,
  }

  writeSettings(settings)
  emit()
  return settings
}

export function subscribeToTranscriptionSettings(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useTranscriptionSettings(): TranscriptionSettings {
  return useSyncExternalStore(
    subscribeToTranscriptionSettings,
    getTranscriptionSettings,
    getTranscriptionSettings,
  )
}
