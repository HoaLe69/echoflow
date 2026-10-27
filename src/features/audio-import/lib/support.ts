export type ImportSupport = {
  supported: boolean,
  reason?: string
}

export function getImportSupport(): ImportSupport {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'Import is only available in the browser.' }
  }
  if (!('indexedDB' in window)) {
    return { supported: false, reason: 'IndexedDB is required to store audio.' }
  }
  if (typeof AudioContext === 'undefined') {
    return { supported: false, reason: 'Web audio is required to read audio files.' }
  }

  if (!window.crossOriginIsolated) {
    return {
      supported: false,
      reason: 'Audio import requires cross-origin isolation. The server must send COOP/COEP headers.'
    }
  }
  return { supported: true }
}
