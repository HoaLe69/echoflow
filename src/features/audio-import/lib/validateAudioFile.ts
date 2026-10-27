export const MAX_AUDIO_BYTES = 50 * 1024 * 1024
export const MAX_AUDIO_DURATION_MS = 5 * 60 * 1000

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export async function inspectAudioFile(
  file: File
): Promise<{ durationMs: number }> {
  if (
    !file.type.startsWith('audio/') &&
    !/\.(mp3|wav|m4a|aac|ogg|webm)$/i.test(file.name)
  ) {
    throw new Error('Please choose an audio file (MP3, WAV,M4A, OGG).')
  }
  if (file.size > MAX_AUDIO_BYTES) {
    throw new Error('Audio files must be 50 MB or smaller.')
  }

  const url = URL.createObjectURL(file)
  try {
    const durationMs = await new Promise<number>((resolve, reject) => {
      const audio = new Audio()
      audio.preload = 'metadata'
      audio.onloadedmetadata = () => resolve(audio.duration * 1000)
      audio.onerror = () => reject(new Error('The audio file could not be read.'))
      audio.src = url
    })
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      throw new Error('The audio duration could not be detected.')
    }

    if (durationMs > MAX_AUDIO_DURATION_MS) {
      throw new Error('Audio files must be 5 minutes or shorter.')
    }
    return { durationMs }
  } finally {
    URL.revokeObjectURL(url)
  }
}
