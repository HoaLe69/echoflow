import { useCallback, useEffect, useRef, useState } from 'react'
import { useProgress } from '../../hooks/useProgress'
import { useRecognition } from '../../hooks/useRecognition'
import { useSpeech } from '../../hooks/useSpeech'
import { scorePronunciation } from '../../lib/score'
import type { ScoreResult } from '../../lib/score'
import { PARTNER_VOICE, REFERENCE_VOICE } from './constants'

type PracticeAttemptParams = {
  scenarioId: string
  /** Changes whenever the round, role, turn, or completion state changes. */
  turnKey: string
  cue: string | null
  target: string
  rate: number
  isActive: boolean
}

export function usePracticeAttempt({
  scenarioId,
  turnKey,
  cue,
  target,
  rate,
  isActive,
}: PracticeAttemptParams) {
  const { speak, cancel } = useSpeech()
  const { recordAttempt } = useProgress()
  const {
    start: startRecognition,
    stop: stopRecognition,
    reset: resetRecognition,
    isListening,
    isSupported,
    transcript,
    error,
  } = useRecognition({ lang: 'en-US' })

  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const lastScored = useRef<string | null>(null)
  const rateRef = useRef(rate)

  useEffect(() => {
    rateRef.current = rate
  }, [rate])

  const resetAttempt = useCallback(() => {
    cancel()
    resetRecognition()
    lastScored.current = null
    setScoreResult(null)
  }, [cancel, resetRecognition])

  // New turn/role/round: auto-play the cue. The page resets the previous
  // attempt from its event handlers, so this effect only touches audio.
  // Speed changes do not re-trigger this; they apply to the next playback.
  useEffect(() => {
    if (!isActive || !cue) return

    speak(cue, { rate: rateRef.current, voice: PARTNER_VOICE })

    return () => cancel()
  }, [turnKey, cue, isActive, speak, cancel])

  // Score once per completed transcript.
  useEffect(() => {
    if (isListening) return

    const spoken = transcript.trim()
    if (!spoken || spoken === lastScored.current) return

    lastScored.current = spoken
    const result = scorePronunciation(target, spoken)
    setScoreResult(result)
    recordAttempt(scenarioId, { fluencyScore: result.score })
  }, [isListening, transcript, target, scenarioId, recordAttempt])

  const toggleRecording = () => {
    if (!isSupported || !isActive) return

    if (isListening) {
      stopRecognition()
      return
    }

    cancel()
    lastScored.current = null
    setScoreResult(null)
    startRecognition()
  }

  const playPartner = () =>
    speak(cue ?? target, { rate, voice: PARTNER_VOICE })

  const playReference = () =>
    speak(target, { rate, voice: REFERENCE_VOICE })

  const playBreakdown = () => speak(target, { rate: 0.8 })

  return {
    scoreResult,
    isListening,
    isSupported,
    error,
    toggleRecording,
    resetAttempt,
    playPartner,
    playReference,
    playBreakdown,
  }
}
