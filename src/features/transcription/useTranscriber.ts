import { useCallback, useEffect, useRef, useState } from 'react'
import { createTranscriptionProvider } from './registry'
import { useTranscriptionSettings } from './settingsStore'
import type {
  TranscriptionOptions,
  TranscriptionProvider,
  TranscriptionProviderId,
  TranscriptResult,
} from './types'

export type TranscriptionStatus =
  | 'idle'
  | 'preparing'
  | 'transcribing'
  | 'done'
  | 'error'

type UseTranscriberOptions = {
  providerId?: TranscriptionProviderId
}

export function useTranscriber(options: UseTranscriberOptions = {}) {
  const settings = useTranscriptionSettings()
  const providerId = options.providerId ?? settings.providerId

  const [status, setStatus] = useState<TranscriptionStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const providerRef = useRef<TranscriptionProvider | null>(null)
  const activeProviderIdRef = useRef<TranscriptionProviderId | null>(null)
  const generationRef = useRef(0)

  const getProvider = useCallback(async (): Promise<TranscriptionProvider> => {
    if (
      providerRef.current &&
      activeProviderIdRef.current !== providerId
    ) {
      providerRef.current.dispose()
      providerRef.current = null
      activeProviderIdRef.current = null
    }

    if (!providerRef.current) {
      providerRef.current = await createTranscriptionProvider(providerId)
      activeProviderIdRef.current = providerId
    }

    return providerRef.current
  }, [providerId])

  const transcribe = useCallback(
    async (
      file: File,
      options: TranscriptionOptions = {},
    ): Promise<TranscriptResult> => {
      const generation = ++generationRef.current

      setError(null)
      setProgress(0)
      setStatus('preparing')

      try {
        const provider = await getProvider()
        await provider.prepare()

        if (generation !== generationRef.current) {
          throw new DOMException('Transcription was cancelled.', 'AbortError')
        }

        setStatus('transcribing')

        const result = await provider.transcribe(file, {
          ...options,
          onProgress: (pct) => {
            if (generation !== generationRef.current) return
            setProgress(pct)
            options.onProgress?.(pct)
          },
        })

        if (generation !== generationRef.current) {
          throw new DOMException('Transcription was cancelled.', 'AbortError')
        }

        setProgress(100)
        setStatus('done')
        return result
      } catch (transcriptionError) {
        if (
          transcriptionError instanceof DOMException &&
          transcriptionError.name === 'AbortError'
        ) {
          setStatus('idle')
          throw transcriptionError
        }

        const message =
          transcriptionError instanceof Error
            ? transcriptionError.message
            : 'Transcription failed.'

        setStatus('error')
        setError(message)
        throw transcriptionError
      }
    },
    [getProvider],
  )

  const cancel = useCallback(async () => {
    generationRef.current += 1
    try {
      await providerRef.current?.cancel()
    } finally {
      setStatus('idle')
      setProgress(0)
    }
  }, [])

  useEffect(() => {
    return () => {
      generationRef.current += 1
      providerRef.current?.dispose()
      providerRef.current = null
      activeProviderIdRef.current = null
    }
  }, [])

  return {
    providerId,
    status,
    progress,
    error,
    transcribe,
    cancel,
    isBusy: status === 'preparing' || status === 'transcribing',
  }
}
