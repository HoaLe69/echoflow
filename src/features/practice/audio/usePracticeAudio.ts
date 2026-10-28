import { useCallback } from 'react'
import { useSpeech } from '../../../hooks/useSpeech'
import type { TurnAudio } from '../../../types/scenario'
import { PARTNER_VOICE, REFERENCE_VOICE } from '../constants'
import { useAudioClipPlayer } from './useAudioClipPlayer'

type Params = {
  sourceId?: string
  cueAudio?: TurnAudio
  targetAudio?: TurnAudio
  cueText: string | null
  targetText: string
  rate: number
}

export function usePracticeAudio({
  sourceId,
  cueAudio,
  targetAudio,
  cueText,
  targetText,
  rate,
}: Params) {
  const { speak, cancel } = useSpeech()
  const clip = useAudioClipPlayer(sourceId)
  const isNative = Boolean(sourceId && (cueAudio || targetAudio))

  const playCue = useCallback(() => {
    if (isNative) {
      const audio = cueAudio ?? targetAudio
      if (audio) clip.playSegment(audio.startMs, audio.endMs, rate)
      return
    }

    speak(cueText ?? targetText, { rate, voice: PARTNER_VOICE })
  }, [clip, cueAudio, cueText, isNative, rate, speak, targetAudio, targetText])

  const playReference = useCallback(() => {
    if (isNative && targetAudio) {
      clip.playSegment(targetAudio.startMs, targetAudio.endMs, rate)
      return
    }

    speak(targetText, { rate, voice: REFERENCE_VOICE })
  }, [clip, isNative, rate, speak, targetAudio, targetText])

  const playBreakdown = useCallback(() => {
    if (isNative && targetAudio) {
      clip.playSegment(targetAudio.startMs, targetAudio.endMs, 0.8)
      return
    }

    speak(targetText, { rate: 0.8 })
  }, [clip, isNative, speak, targetAudio, targetText])

  const stop = useCallback(() => {
    cancel()
    clip.stop()
  }, [cancel, clip])

  return {
    isNative,
    clipReady: clip.isReady,
    clipError: clip.error,
    autoplayBlocked: clip.autoplayBlocked,
    playCue,
    playReference,
    playBreakdown,
    stop,
  }
}
