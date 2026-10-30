import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getSpeakingSession,
  saveSpeakingSession,
  updateSpeakingSession,
} from '../../data/speakingRepository'
import type { Level } from '../../types/scenario'
import { useAudioRecorder } from '../practice/audio/useAudioRecorder'
import { toAudioFile } from '../practice/takeTranscription'
import { getTranscriptionSettings } from '../transcription/settingsStore'
import { useTranscriber } from '../transcription/useTranscriber'
import { reviewSpeaking } from './reviewSpeaking'
import type {
  FreeTalkFocus,
  SpeakingAudio,
  SpeakingReview,
  SpeakingSession,
} from './types'

export type FreeTalkStage =
  | 'setup'
  | 'recording'
  | 'processing'
  | 'review'

export type FreeTalkStartConfig = {
  topic: string
  category: string
  level: Level
  focus: FreeTalkFocus
  targetDurationMs: number
}

export function useFreeTalkSession() {
  const recorder = useAudioRecorder()
  const [providerId, setProviderId] = useState(
    () => getTranscriptionSettings().providerId,
  )
  const transcriber = useTranscriber({ providerId })

  const [stage, setStage] = useState<FreeTalkStage>('setup')
  const [config, setConfig] = useState<FreeTalkStartConfig | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [review, setReview] = useState<SpeakingReview | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)

  const generationRef = useRef(0)
  const sessionRef = useRef<SpeakingSession | null>(null)
  const stopRecorder = recorder.stop

  const reset = useCallback(() => {
    generationRef.current += 1
    sessionRef.current = null
    void transcriber.cancel()
    recorder.reset()
    setStage('setup')
    setConfig(null)
    setElapsedMs(0)
    setTranscript('')
    setReview(null)
    setSessionId(null)
    setError(null)
    setIsTranscribing(false)
    setIsReviewing(false)
  }, [recorder, transcriber])

  const start = useCallback(
    async (nextConfig: FreeTalkStartConfig) => {
      generationRef.current += 1
      sessionRef.current = null
      setConfig(nextConfig)
      setTranscript('')
      setReview(null)
      setSessionId(null)
      setError(null)
      setIsTranscribing(false)
      setIsReviewing(false)
      setElapsedMs(0)
      setStage('recording')
      recorder.reset()

      try {
        await recorder.start()
      } catch {
        setStage('setup')
      }
    },
    [recorder],
  )

  const stop = useCallback(() => {
    if (!recorder.isRecording) return
    stopRecorder()
    setStage('processing')
  }, [recorder.isRecording, stopRecorder])

  // getUserMedia can fail without throwing from recorder.start().
  useEffect(() => {
    if (
      stage === 'recording' &&
      !recorder.isRecording &&
      recorder.error
    ) {
      // oxlint-disable-next-line react/set-state-in-effect
      setError(recorder.error)
      // oxlint-disable-next-line react/set-state-in-effect
      setStage('setup')
    }
  }, [recorder.error, recorder.isRecording, stage])

  // Timer + auto-stop at the target duration.
  useEffect(() => {
    if (stage !== 'recording' || !recorder.isRecording || !config) return

    const startedAt = performance.now()
    const timer = window.setInterval(() => {
      const nextElapsed = performance.now() - startedAt
      setElapsedMs(Math.min(nextElapsed, config.targetDurationMs))

      if (nextElapsed >= config.targetDurationMs) {
        stopRecorder()
        setStage('processing')
      }
    }, 100)

    return () => window.clearInterval(timer)
  }, [config, recorder.isRecording, stage, stopRecorder])

  /**
   * Explicit user action: transcribe the stopped recording, then persist the
   * session. The review is a separate explicit action.
   */
  const transcribe = useCallback(async () => {
    if (!config || !recorder.audioBlob || isTranscribing) return

    const generation = ++generationRef.current
    setIsTranscribing(true)
    setError(null)

    try {
      const file = toAudioFile(recorder.audioBlob)
      const result = await transcriber.transcribe(file, {
        language: 'en',
      })
      const text = result.segments
        .map((segment) => segment.text)
        .join(' ')
        .trim()

      if (!text) {
        throw new Error('No speech was detected in this recording.')
      }

      if (generation !== generationRef.current) return

      const now = Date.now()
      const id = crypto.randomUUID()
      const audioId = `${id}-audio`
      const session: SpeakingSession = {
        id,
        topic: config.topic,
        category: config.category,
        level: config.level,
        focus: config.focus,
        targetDurationMs: config.targetDurationMs,
        audioDurationMs: recorder.durationMs,
        audioId,
        transcript: text,
        transcriptProvider: providerId,
        review: null,
        createdAt: now,
      }
      const audio: SpeakingAudio = {
        id: audioId,
        blob: recorder.audioBlob,
        mimeType: recorder.audioBlob.type || 'audio/webm',
        sizeBytes: recorder.audioBlob.size,
        durationMs: recorder.durationMs,
        createdAt: now,
      }

      await saveSpeakingSession(session, audio)
      if (generation !== generationRef.current) return

      sessionRef.current = session
      setSessionId(id)
      setTranscript(text)
    } catch (transcriptionError) {
      if (generation !== generationRef.current) return
      setError(
        transcriptionError instanceof Error
          ? transcriptionError.message
          : 'Could not transcribe this recording.',
      )
    } finally {
      if (generation === generationRef.current) {
        setIsTranscribing(false)
      }
    }
  }, [
    config,
    isTranscribing,
    providerId,
    recorder.audioBlob,
    recorder.durationMs,
    transcriber,
  ])

  /**
   * Explicit user action: send the saved transcript to Gemini.
   */
  const generateReview = useCallback(async () => {
    const current = sessionRef.current
    if (!current || isReviewing) return

    setIsReviewing(true)
    setError(null)

    try {
      const result = await reviewSpeaking({
        transcript: current.transcript,
        topic: current.topic,
        level: current.level,
        focus: current.focus,
        durationMs: current.audioDurationMs,
      })
      const reviewed = { ...current, review: result }
      await updateSpeakingSession(reviewed)
      sessionRef.current = reviewed
      setReview(result)
      setStage('review')
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : 'Could not generate a review.',
      )
      setStage('review')
    } finally {
      setIsReviewing(false)
    }
  }, [isReviewing])

  // Load a saved review into the working state when deep-linked.
  const loadSession = useCallback(async (id: string) => {
    const saved = await getSpeakingSession(id)
    if (!saved) return false

    sessionRef.current = saved
    setSessionId(saved.id)
    setTranscript(saved.transcript)
    setReview(saved.review)
    setConfig({
      topic: saved.topic,
      category: saved.category,
      level: saved.level,
      focus: saved.focus,
      targetDurationMs: saved.targetDurationMs,
    })
    setStage('review')
    return true
  }, [])

  return {
    stage,
    config,
    elapsedMs,
    isRecording: recorder.isRecording,
    isSupported: recorder.isSupported,
    audioUrl: recorder.audioUrl,
    audioBlob: recorder.audioBlob,
    durationMs: recorder.durationMs,
    transcript,
    review,
    sessionId,
    error:
      error ??
      recorder.error ??
      (stage === 'processing' && !transcript
        ? transcriber.error
        : null),
    isTranscribing,
    isReviewing,
    transcriptionProgress: transcriber.progress,
    providerId,
    setProviderId,
    start,
    stop,
    reset,
    transcribe,
    generateReview,
    loadSession,
  }
}
