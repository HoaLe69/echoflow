import { createHttpProvider } from './httpProvider'

export function createGroqProvider() {
  return createHttpProvider('groq', '/api/transcription/groq')
}
