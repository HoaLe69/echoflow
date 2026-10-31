import { useCallback, useEffect, useRef, useState } from 'react'
import { useProgress } from '../../hooks/useProgress'
import { useRecognition } from '../../hooks/useRecognition'
import { scorePronunciation } from '../../lib/score'
import type { ScoreResult } from '../../lib/score'
import type { TurnAudio } from '../../types/scenario'
import { useTranscriber } from '../transcription/useTranscriber'
import { usePracticeAudio } from './audio/usePracticeAudio'
import { useAudioRecorder } from './audio/useAudioRecorder'
import { getTakeTranscriptionMode, toAudioFile } from './takeTranscription'

type PracticeAttemptParams = {
  scenarioId: string
  turnKey: string
  cue: string | null
  target: string
  rate: number
  isActive: boolean
  audioSourceId?: string
  cueAudio?: TurnAudio
  targetAudio?: TurnAudio
}

export function usePracticeAttempt({
  scenarioId,
  turnKey,
  cue,
  target,
  rate,
  isActive,
  audioSourceId,
  cueAudio,
  targetAudio,
}: PracticeAttemptParams) {
  const { recordAttempt } = useProgress()

  const {
    start: startRecognition,
    stop: stopRecognition,
    reset: resetRecognition,
    isListening,
    isSupported: recognitionSupported,
    transcript: browserTranscript,
    error: recognitionError,
  } = useRecognition({ lang: 'en-US' })

  const {
    start: startRecorder,
    stop: stopRecorder,
    reset: resetRecorder,
    isRecording: isRecorderRecording,
    isSupported: recorderSupported,
    audioUrl: recordingUrl,
    audioBlob: recordingBlob,
    durationMs: recordingDurationMs,
    error: recorderError,
  } = useAudioRecorder()

  const {
    transcribe: transcribeRecording,
    cancel: cancelTranscription,
    status: transcriptionStatus,
    progress: transcriptionProgress,
  } = useTranscriber({ providerId: 'groq' })

  const requestedMode = getTakeTranscriptionMode()
  // Fall back to browser recognition if the device cannot record audio.
  const usesProvider =
    requestedMode === 'provider' && recorderSupported
  const takeSupported = usesProvider
    ? recorderSupported
    : recognitionSupported

  const audio = usePracticeAudio({
    sourceId: audioSourceId,
    cueAudio,
    targetAudio,
    cueText: cue,
    targetText: target,
    rate,
  })

  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const [providerTranscript, setProviderTranscript] = useState('')
  const [providerError, setProviderError] = useState<string | null>(null)

  const isTranscribing =
    usesProvider &&
    (transcriptionStatus === 'preparing' ||
      transcriptionStatus === 'transcribing')

  const lastScored = useRef<string | null>(null)
  const transcriptionGeneration = useRef(0)
  const playCueRef = useRef(audio.playCue)
  const stopAudioRef = useRef(audio.stop)

  useEffect(() => {
    playCueRef.current = audio.playCue
    stopAudioRef.current = audio.stop
  }, [audio.playCue, audio.stop])

  const resetAttempt = useCallback(() => {
    transcriptionGeneration.current += 1
    void cancelTranscription()

    setProviderTranscript('')
    setProviderError(null)
    lastScored.current = null
    setScoreResult(null)

    audio.stop()
    resetRecorder()
    resetRecognition()
  }, [audio, cancelTranscription, resetRecorder, resetRecognition])

  // New turn/role/round: auto-play the cue from native audio or TTS.
  useEffect(() => {
    if (!isActive || !cue) return
    if (audio.isNative && !audio.clipReady) return

    playCueRef.current()
    return () => stopAudioRef.current()
  }, [turnKey, cue, isActive, audio.isNative, audio.clipReady])

  // Desktop: score the browser's live transcript.
  useEffect(() => {
    if (usesProvider || isListening) return

    const spoken = browserTranscript.trim()
    if (!spoken || spoken === lastScored.current) return

    lastScored.current = spoken
    const result = scorePronunciation(target, spoken)
    setScoreResult(result)
    recordAttempt(scenarioId, { fluencyScore: result.score })
  }, [
    usesProvider,
    isListening,
    browserTranscript,
    target,
    scenarioId,
    recordAttempt,
  ])

  // Mobile: transcribe the finished recording with the selected provider.
  useEffect(() => {
    if (!usesProvider || !recordingBlob) return

    const generation = ++transcriptionGeneration.current
    const file = toAudioFile(recordingBlob)

    void transcribeRecording(file)
      .then((result) => {
        if (generation !== transcriptionGeneration.current) return

        const spoken = result.segments
          .map((segment) => segment.text)
          .join(' ')
          .trim()

        setProviderTranscript(spoken)
        if (!spoken) return

        const score = scorePronunciation(target, spoken)
        setScoreResult(score)
        recordAttempt(scenarioId, { fluencyScore: score.score })
      })
      .catch((transcriptionError) => {
        if (generation !== transcriptionGeneration.current) return
        setProviderError(
          transcriptionError instanceof Error
            ? transcriptionError.message
            : 'The transcription provider could not transcribe this take.',
        )
      })
  }, [
    usesProvider,
    recordingBlob,
    transcribeRecording,
    target,
    scenarioId,
    recordAttempt,
  ])

  const toggleRecording = () => {
    if (!isActive || isTranscribing) return

    if (isListening || isRecorderRecording) {
      if (isListening) stopRecognition()
      if (isRecorderRecording) stopRecorder()
      return
    }

    if (!takeSupported) return

    // Avoid playing the previous take or partner audio into the mic.
    audio.stop()
    document.querySelectorAll<HTMLAudioElement>('audio').forEach((element) => {
      if (!element.paused) element.pause()
    })

    lastScored.current = null
    setScoreResult(null)
    setProviderTranscript('')
    setProviderError(null)

    if (usesProvider) {
      void startRecorder()
      return
    }

    startRecognition()
    if (recorderSupported) void startRecorder()
  }

  const spokenTranscript = usesProvider
    ? providerTranscript
    : browserTranscript

  return {
    scoreResult,
    isListening,
    isSupported: takeSupported,
    error: usesProvider ? null : recognitionError,
    audioError: audio.clipError,
    toggleRecording,
    resetAttempt,
    playPartner: audio.playCue,
    playReference: audio.playReference,
    playBreakdown: audio.playBreakdown,

    isRecording: isListening || isRecorderRecording,
    isTranscribing,
    spokenTranscript,
    transcriptLabel: usesProvider ? 'Transcribed' : 'Browser heard',
    transcriptionStatus: usesProvider ? transcriptionStatus : 'idle',
    transcriptionProgress: usesProvider ? transcriptionProgress : 0,
    transcriptionError: usesProvider ? providerError : null,
    recordingUrl,
    recordingDurationMs,
    recorderError,
    recorderSupported,
  }
}
