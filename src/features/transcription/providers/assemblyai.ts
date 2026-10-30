import { createHttpProvider } from './httpProvider'

export function createAssemblyAIProvider() {
  return createHttpProvider(
    'assemblyai',
    '/api/transcription/assemblyai',
  )
}
