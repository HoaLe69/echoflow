import { useCallback, useEffect, useRef, useState } from 'react'

export type SpeechOptions = {
  /** Playback rate, e.g. 0.8 for slow pronunciation. */
  rate?: number
  pitch?: number
  /** A voice name or voiceURI from speechSynthesis.getVoices(). */
  voice?: string
}

export type UseSpeechResult = {
  speak: (text: string, options?: SpeechOptions) => void
  cancel: () => void
  isSpeaking: boolean
  isSupported: boolean
}

function getSynthesizer(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null
  return window.speechSynthesis ?? null
}

const synthesizer = getSynthesizer()

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function resolveVoice(
  voiceName: string | undefined,
): SpeechSynthesisVoice | undefined {
  if (!voiceName || !synthesizer) return undefined

  const normalized = voiceName.toLowerCase()

  return synthesizer
    .getVoices()
    .find(
      (voice) =>
        voice.name.toLowerCase() === normalized ||
        voice.voiceURI.toLowerCase() === normalized,
    )
}

export function useSpeech(): UseSpeechResult {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null)

  const cancel = useCallback(() => {
    if (!synthesizer) return

    synthesizer.cancel()
    currentUtterance.current = null
    setIsSpeaking(false)
  }, [])

  const speak = useCallback((text: string, options: SpeechOptions = {}) => {
    if (!synthesizer || text.trim().length === 0) return

    // Only one line at a time: stop whatever is playing.
    synthesizer.cancel()
    if (synthesizer.paused) synthesizer.resume()

    const utterance = new SpeechSynthesisUtterance(text)
    const voice = resolveVoice(options.voice)

    if (voice) utterance.voice = voice
    utterance.lang = voice?.lang ?? 'en-US'
    utterance.rate = clamp(options.rate ?? 1, 0.1, 10)
    utterance.pitch = clamp(options.pitch ?? 1, 0, 2)

    const isCurrent = () => currentUtterance.current === utterance
    const finish = () => {
      if (!isCurrent()) return
      currentUtterance.current = null
      setIsSpeaking(false)
    }

    utterance.onstart = () => {
      if (isCurrent()) setIsSpeaking(true)
    }
    utterance.onend = finish
    utterance.onerror = finish

    currentUtterance.current = utterance
    // Optimistic: some engines do not fire onstart reliably.
    setIsSpeaking(true)
    synthesizer.speak(utterance)
  }, [])

  useEffect(() => {
    return () => {
      synthesizer?.cancel()
      currentUtterance.current = null
    }
  }, [])

  return {
    speak,
    cancel,
    isSpeaking,
    isSupported: synthesizer !== null,
  }
}
