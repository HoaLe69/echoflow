import { useCallback, useEffect, useRef, useState } from 'react'

export type RecognitionResult = {
  transcript: string
  confidence: number
}

export type RecognitionOptions = {
  /** BCP 47 language tag, e.g. "en-US". */
  lang?: string
  onResult?: (result: RecognitionResult) => void
  onError?: (message: string) => void
}

export type UseRecognitionResult = {
  start: () => void
  stop: () => void
  reset: () => void
  isListening: boolean
  isSupported: boolean
  /** Final + interim text, so the UI can update while the user speaks. */
  transcript: string
  error: string | null
}

/*
 * The Web Speech API's SpeechRecognition types are still missing from some
 * TypeScript DOM libs, so we describe the small surface we use here instead of
 * falling back to `any`.
 */
type RecognitionAlternative = {
  transcript: string
  confidence: number
}

type RecognitionResultItem = {
  isFinal: boolean
  length: number
  [index: number]: RecognitionAlternative
}

type RecognitionResultList = {
  length: number
  [index: number]: RecognitionResultItem
}

type RecognitionEvent = Event & {
  resultIndex: number
  results: RecognitionResultList
}

type RecognitionErrorEvent = Event & {
  error: string
  message?: string
}

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onresult: ((event: RecognitionEvent) => void) | null
  onerror: ((event: RecognitionErrorEvent) => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

function getRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null

  const speechWindow = window as SpeechWindow
  return (
    speechWindow.SpeechRecognition ??
    speechWindow.webkitSpeechRecognition ??
    null
  )
}

const RecognitionConstructor = getRecognitionConstructor()

const errorMessages: Record<string, string> = {
  'not-allowed': 'Microphone access was denied.',
  'service-not-allowed': 'Speech recognition is blocked by the browser.',
  'no-speech': 'No speech was detected. Try again.',
  'audio-capture': 'No microphone is available.',
  network: 'Speech recognition needs a network connection.',
  'language-not-supported': 'The selected language is not supported.',
  'phrases-not-supported': 'One or more phrases are not supported.',
}

export function useRecognition(
  options: RecognitionOptions = {},
): UseRecognitionResult {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const generationRef = useRef(0)
  const finalTranscriptRef = useRef('')
  const lastReportedRef = useRef('')
  const lastConfidenceRef = useRef(0)
  const listeningRef = useRef(false)

  const disposeRecognition = useCallback(
    (recognition: SpeechRecognitionLike | null) => {
      if (!recognition) return

      recognition.onstart = null
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null

      try {
        recognition.abort()
      } catch {
        // Already stopped.
      }
    },
    [],
  )

  const createRecognition = useCallback(
    (generation: number): SpeechRecognitionLike | null => {
      if (!RecognitionConstructor) return null

      const recognition = new RecognitionConstructor()

      recognition.onstart = () => {
        if (generation !== generationRef.current) return
        listeningRef.current = true
        setIsListening(true)
      }

      recognition.onresult = (event) => {
        if (generation !== generationRef.current) return

        let finalText = finalTranscriptRef.current
        let interimText = ''
        let confidence = lastConfidenceRef.current

        for (
          let index = event.resultIndex;
          index < event.results.length;
          index += 1
        ) {
          const result = event.results[index]
          const alternative = result[0]
          if (!alternative) continue

          if (result.isFinal) {
            finalText = `${finalText} ${alternative.transcript}`.trim()
            confidence = alternative.confidence
          } else {
            interimText = `${interimText} ${alternative.transcript}`.trim()
          }
        }

        finalTranscriptRef.current = finalText
        lastConfidenceRef.current = confidence
        setTranscript(`${finalText} ${interimText}`.trim())

        if (finalText && finalText !== lastReportedRef.current) {
          lastReportedRef.current = finalText
          optionsRef.current.onResult?.({ transcript: finalText, confidence })
        }
      }

      recognition.onerror = (event) => {
        if (generation !== generationRef.current) return
        // Aborts are expected when stop()/reset() run.
        if (event.error === 'aborted') return

        const message =
          errorMessages[event.error] ??
          event.message ??
          'Speech recognition failed.'

        listeningRef.current = false
        recognitionRef.current = null
        setIsListening(false)
        setError(message)
        optionsRef.current.onError?.(message)
      }

      recognition.onend = () => {
        if (generation !== generationRef.current) return

        listeningRef.current = false
        recognitionRef.current = null
        setIsListening(false)

        // Some browsers end without emitting a final result event.
        const finalText = finalTranscriptRef.current
        if (finalText && finalText !== lastReportedRef.current) {
          lastReportedRef.current = finalText
          optionsRef.current.onResult?.({
            transcript: finalText,
            confidence: lastConfidenceRef.current,
          })
        }
      }

      return recognition
    },
    [],
  )

  const start = useCallback(() => {
    if (!RecognitionConstructor || listeningRef.current) return

    // iOS WebKit can stop delivering results on a recognizer instance after
    // media playback. Use a fresh instance for every attempt.
    disposeRecognition(recognitionRef.current)
    recognitionRef.current = null

    const generation = ++generationRef.current
    const recognition = createRecognition(generation)
    if (!recognition) return

    recognitionRef.current = recognition
    finalTranscriptRef.current = ''
    lastReportedRef.current = ''
    lastConfidenceRef.current = 0
    setTranscript('')
    setError(null)

    recognition.lang = optionsRef.current.lang ?? 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    try {
      recognition.start()
      listeningRef.current = true
      setIsListening(true)
    } catch (startError) {
      const message =
        startError instanceof Error
          ? startError.message
          : 'Unable to start speech recognition.'

      listeningRef.current = false
      recognitionRef.current = null
      disposeRecognition(recognition)
      setIsListening(false)
      setError(message)
      optionsRef.current.onError?.(message)
    }
  }, [createRecognition, disposeRecognition])

  const stop = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return

    try {
      recognition.stop()
    } catch {
      // Stopping an already-ended session throws in some browsers.
      listeningRef.current = false
      setIsListening(false)
    }
  }, [])

  const reset = useCallback(() => {
    generationRef.current += 1

    const recognition = recognitionRef.current
    recognitionRef.current = null
    listeningRef.current = false
    disposeRecognition(recognition)

    finalTranscriptRef.current = ''
    lastReportedRef.current = ''
    lastConfidenceRef.current = 0
    setIsListening(false)
    setTranscript('')
    setError(null)
  }, [disposeRecognition])

  useEffect(() => {
    return () => {
      generationRef.current += 1
      const recognition = recognitionRef.current
      recognitionRef.current = null
      disposeRecognition(recognition)
    }
  }, [disposeRecognition])

  return {
    start,
    stop,
    reset,
    isListening,
    isSupported: RecognitionConstructor !== null,
    transcript,
    error,
  }
}
