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
  const [isReviewing, setIsReviewing] = useState(false)
  const [transcriptionAttempt, setTranscriptionAttempt] = useState(0)

  const processingBlobRef = useRef<Blob | null>(null)
  const generationRef = useRef(0)
  const sessionRef = useRef<SpeakingSession | null>(null)
  const stopRecorder = recorder.stop

  const reset = useCallback(() => {
    generationRef.current += 1
    processingBlobRef.current = null
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
    setIsReviewing(false)
  }, [recorder, transcriber])

  const start = useCallback(
    async (nextConfig: FreeTalkStartConfig) => {
      generationRef.current += 1
      processingBlobRef.current = null
      sessionRef.current = null
      setConfig(nextConfig)
      setTranscript('')
      setReview(null)
      setSessionId(null)
      setError(null)
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

  // Transcribe the finished blob, save the session, then ask Gemini.
  useEffect(() => {
    if (stage !== 'processing' || !recorder.audioBlob || !config) return
    if (processingBlobRef.current === recorder.audioBlob) return

    processingBlobRef.current = recorder.audioBlob
    const generation = generationRef.current + 1
    generationRef.current = generation
    setError(null)

    const run = async () => {
      let text = ''
      try {
        const file = toAudioFile(recorder.audioBlob as Blob)
        const result = await transcriber.transcribe(file, {
          language: 'en',
        })
        text = result.segments
          .map((segment) => segment.text)
          .join(' ')
          .trim()
      } catch (transcriptionError) {
        if (generation !== generationRef.current) return
        setError(
          transcriptionError instanceof Error
            ? transcriptionError.message
            : 'Could not transcribe this recording.',
        )
        return
      }

      if (generation !== generationRef.current) return

      if (!text) {
        setError('No speech was detected in this recording.')
        return
      }

      setTranscript(text)

      const now = Date.now()
      const id = sessionRef.current?.id ?? crypto.randomUUID()
      const audioId = sessionRef.current?.audioId ?? `${id}-audio`
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
        createdAt: sessionRef.current?.createdAt ?? now,
      }
      const audio: SpeakingAudio = {
        id: audioId,
        blob: recorder.audioBlob as Blob,
        mimeType: recorder.audioBlob?.type || 'audio/webm',
        sizeBytes: recorder.audioBlob?.size ?? 0,
        durationMs: recorder.durationMs,
        createdAt: now,
      }

      try {
        await saveSpeakingSession(session, audio)
        sessionRef.current = session
        setSessionId(id)
      } catch (saveError) {
        if (generation !== generationRef.current) return
        setError(
          saveError instanceof Error
            ? saveError.message
            : 'Could not save this recording.',
        )
        return
      }

      if (generation !== generationRef.current) return

      setIsReviewing(true)
      try {
        const result = await reviewSpeaking({
          transcript: text,
          topic: config.topic,
          level: config.level,
          focus: config.focus,
          durationMs: recorder.durationMs,
        })
        if (generation !== generationRef.current) return

        const reviewed = { ...session, review: result }
        await updateSpeakingSession(reviewed)
        sessionRef.current = reviewed
        setReview(result)
        setStage('review')
      } catch (reviewError) {
        if (generation !== generationRef.current) return
        setError(
          reviewError instanceof Error
            ? reviewError.message
            : 'Could not generate a review.',
        )
        setStage('review')
      } finally {
        if (generation === generationRef.current) {
          setIsReviewing(false)
        }
      }
    }

    void run()
  }, [
    config,
    providerId,
    recorder,
    stage,
    transcriber,
    transcriptionAttempt,
  ])

  const retryTranscription = useCallback(() => {
    processingBlobRef.current = null
    sessionRef.current = null
    setSessionId(null)
    setTranscript('')
    setReview(null)
    setError(null)
    setStage('processing')
    setTranscriptionAttempt((attempt) => attempt + 1)
  }, [])

  const retryReview = useCallback(async () => {
    const current = sessionRef.current
    if (!current || !config) return

    setError(null)
    setIsReviewing(true)

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
    } finally {
      setIsReviewing(false)
    }
  }, [config])

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

  const isTranscribing =
    stage === 'processing' &&
    !isReviewing &&
    (transcriber.status === 'preparing' ||
      transcriber.status === 'transcribing')

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
      (stage === 'processing' ? transcriber.error : null),
    isTranscribing,
    isReviewing,
    transcriptionProgress: transcriber.progress,
    providerId,
    setProviderId,
    start,
    stop,
    reset,
    retryTranscription,
    retryReview,
    loadSession,
  }
}
