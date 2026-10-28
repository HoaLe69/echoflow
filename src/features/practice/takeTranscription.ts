export type TakeTranscriptionMode = 'browser' | 'whisper'

/**
 * iOS/Android browsers use Whisper for take transcription because mobile
 * Web Speech recognition is unreliable after audio playback. Desktop keeps
 * the faster SpeechRecognition path.
 *
 * Narrow this to `isIOSDevice()` if Android should stay on Web Speech.
 */
export function getTakeTranscriptionMode(): TakeTranscriptionMode {
  if (typeof navigator === 'undefined') return 'browser'

  const isMobile =
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  return isMobile ? 'whisper' : 'browser'
}

/** Whisper accepts a File/Blob; the extension helps the browser decode it. */
export function toAudioFile(blob: Blob): File {
  const extension = blob.type.includes('mp4')
    ? 'm4a'
    : blob.type.includes('ogg')
      ? 'ogg'
      : 'webm'

  return new File([blob], `take.${extension}`, {
    type: blob.type || 'audio/webm',
  })
}
