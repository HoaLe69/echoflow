import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  TranscriptionProvider,
  TranscriptResult
} from './types'

export type TranscriptionStatus =
  | 'idle'
  | 'loading-model'
  | 'transcribing'
  | 'done'
  | 'error'

export function useTranscriber() {
  const [status, setStatus] = useState<TranscriptionStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const providerRef = useRef<TranscriptionProvider | null>(null)

  const getProvider = useCallback(async (): Promise<TranscriptionProvider> => {
    if (!providerRef.current) {
      // Keep the ~1.5 MB whisper.cpp worker bundle out of the initial load.
      const { createTranscribeJsProvider } = await import(
        './transcribeJsProvider'
      )
      providerRef.current = createTranscribeJsProvider(setProgress)
    }

    return providerRef.current
  }, [])


  const transcribe = useCallback(
    async (file: File): Promise<TranscriptResult> => {
      setError(null)
      setProgress(0)
      setStatus('loading-model')
      try {
        const provider = await getProvider()
        await provider.prepare()
        setStatus('transcribing')
        const result = await provider.transcribe(file)
        setProgress(100)
        setStatus('done')
        return result
      } catch (transcriptionError) {
        const message =
          transcriptionError instanceof Error
            ? transcriptionError.message
            : 'Transcription failed.'
        setStatus('error')
        setError(message)
        throw transcriptionError
      }
    }, [getProvider]
  )

  const cancel = useCallback(async () => {
    try {
      await providerRef.current?.cancel()
    } finally {
      setStatus('idle')
      setProgress(0)
    }
  }, [])

  useEffect(() => {
    return () => {
      providerRef.current?.dispose()
      providerRef.current = null
    }
  }, [])
  return {
    status,
    progress,
    error,
    transcribe,
    cancel,
    isBusy: status === 'loading-model' || status === 'transcribing'
  }
}

