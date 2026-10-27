import { useCallback, useEffect, useRef, useState } from "react";


const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']

function supportsRecording(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  )
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder == 'undefined') return undefined
  if (typeof MediaRecorder.isTypeSupported !== 'function') return undefined
  return MIME_TYPES.find(type => MediaRecorder.isTypeSupported(type))
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [durationMs, setDurationMs] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const isSupported = supportsRecording()


  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunkRef = useRef<Blob[]>([])
  const startTimeRef = useRef(0)
  const generationRef = useRef(0)
  const startingRef = useRef(false)
  const urlRef = useRef<string | null>(null)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
  }, [])

  const revokeUrl = useCallback(() => {
    if (!urlRef.current) return
    URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
  }, [])

  const reset = useCallback(() => {
    generationRef.current += 1
    startingRef.current = false
    const recorder = recorderRef.current
    recorderRef.current = null
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop()

      } catch {
        // Recorder already stopped
      }
    }
    stopStream()
    chunkRef.current = []
    revokeUrl()
    setAudioUrl(null)
    setDurationMs(0)
    setError(null)
    setIsRecording(false)
  }, [revokeUrl, stopStream])


  const start = useCallback(async () => {
    if (!isSupported || startingRef.current || isRecording) return

    // reset
    startingRef.current = true
    setError(null)
    revokeUrl()
    setAudioUrl(null)
    setDurationMs(0)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!startingRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      streamRef.current = stream

      const mimeType = pickMimeType()

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      const generation = ++generationRef.current
      chunkRef.current = []
      startTimeRef.current = performance.now()

      recorder.ondataavailable = event => {
        if (event.data.size > 0) chunkRef.current.push(event.data)
      }

      recorder.onstop = () => {
        const elapsed = performance.now() - startTimeRef.current
        stopStream()
        setIsRecording(false)
        recorderRef.current = null
        if (generation !== generationRef.current) return

        const blob = new Blob(chunkRef.current, {
          type: recorder.mimeType || mimeType || 'audio/webm'
        })
        chunkRef.current = []

        if (blob.size === 0) {
          setError('No audio was captured.')
          return
        }

        const url = URL.createObjectURL(blob)
        urlRef.current = url
        setAudioUrl(url)
        setDurationMs(elapsed)
      }

      recorder.onerror = () => {
        setError('Audio recording failed.')
        setIsRecording(false)
      }
      recorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      startingRef.current = false
    } catch (startError) {
      startingRef.current = false
      stopStream()
      setIsRecording(false)
      setError(
        startError instanceof Error
          ? startError.message
          : 'Microphone access was denied'
      )

    }
  }, [isRecording, isSupported, revokeUrl, stopStream])

  const stop = useCallback(() => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') return

    try {
      recorder.stop()
    } catch {
      setIsRecording(false)
      stopStream()
    }

  }, [stopStream])

  useEffect(() => {
    return () => {
      generationRef.current += 1
      startingRef.current = false
      const recorder = recorderRef.current
      recorderRef.current = null

      if (recorder && recorder.state !== 'inactive') {
        try {
          recorder.stop()
        } catch {
          // Already stopped
        }
      }
      streamRef.current?.getTracks().forEach(track => track.stop())
      streamRef.current = null
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
  }, [])
  return {
    isSupported,
    isRecording,
    audioUrl,
    durationMs,
    error,
    start,
    stop,
    reset
  }
}
