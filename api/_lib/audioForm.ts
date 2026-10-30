/**
 * Vercel/Edge can return a File created by a different realm than the global
 * File/Blob constructors. `instanceof` checks constructor identity and is not
 * reliable across realms, so validate the Blob-like shape instead.
 */
export function getAudioFile(form: FormData): Blob | null {
  const value = form.get('file')
  if (typeof value !== 'object' || value === null) return null

  const candidate = value as Blob
  if (
    typeof candidate.arrayBuffer !== 'function' ||
    typeof candidate.size !== 'number' ||
    typeof candidate.type !== 'string'
  ) {
    return null
  }

  return candidate
}

export function getAudioFileName(
  file: Blob,
  fallback = 'audio.webm',
): string {
  const name = (file as File).name
  return typeof name === 'string' && name.trim().length > 0
    ? name
    : fallback
}
