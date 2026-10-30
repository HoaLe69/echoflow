import {
  DEFAULT_TRANSCRIPTION_PROVIDER_ID,
  type TranscriptionProvider,
  type TranscriptionProviderId,
} from './types'

export type ProviderDefinition = {
  id: TranscriptionProviderId
  label: string
  kind: 'local' | 'remote'
  description: string
  load: () => Promise<TranscriptionProvider>
}

export const PROVIDERS: Record<
  TranscriptionProviderId,
  ProviderDefinition
> = {
  'local-whisper': {
    id: 'local-whisper',
    label: 'On-device Whisper',
    kind: 'local',
    description: 'Private, runs in the browser. Downloads a model on first use.',
    load: async () => {
      const { createLocalWhisperProvider } = await import(
        './providers/localWhisper'
      )
      return createLocalWhisperProvider()
    },
  },

  groq: {
    id: 'groq',
    label: 'Groq Whisper',
    kind: 'remote',
    description: 'Fast cloud transcription through this app’s server.',
    load: async () => {
      const { createGroqProvider } = await import('./providers/groq')
      return createGroqProvider()
    },
  },

  assemblyai: {
    id: 'assemblyai',
    label: 'AssemblyAI',
    kind: 'remote',
    description: 'Cloud transcription with optional diarization.',
    load: async () => {
      const { createAssemblyAIProvider } = await import(
        './providers/assemblyai'
      )
      return createAssemblyAIProvider()
    },
  },
}

export async function createTranscriptionProvider(
  id: TranscriptionProviderId = DEFAULT_TRANSCRIPTION_PROVIDER_ID,
): Promise<TranscriptionProvider> {
  return PROVIDERS[id].load()
}
