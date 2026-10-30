import { getAudioDb } from './audioDb'
import type {
  SpeakingAudio,
  SpeakingSession,
} from '../features/free-talk/types'

export async function listSpeakingSessions(): Promise<SpeakingSession[]> {
  const db = await getAudioDb()
  const sessions = await db.getAllFromIndex(
    'speakingSessions',
    'by-createdAt',
  )
  return sessions.sort((a, b) => b.createdAt - a.createdAt)
}

export async function getSpeakingSession(
  id: string,
): Promise<SpeakingSession | undefined> {
  const db = await getAudioDb()
  return db.get('speakingSessions', id)
}

export async function getSpeakingAudio(
  id: string,
): Promise<SpeakingAudio | undefined> {
  const db = await getAudioDb()
  return db.get('speakingAudio', id)
}

export async function listAllSpeakingAudio(): Promise<SpeakingAudio[]> {
  const db = await getAudioDb()
  return db.getAll('speakingAudio')
}

export async function saveSpeakingSession(
  session: SpeakingSession,
  audio?: SpeakingAudio,
): Promise<void> {
  const db = await getAudioDb()
  const tx = db.transaction(
    ['speakingSessions', 'speakingAudio'],
    'readwrite',
  )

  tx.objectStore('speakingSessions').put(session)
  if (audio) tx.objectStore('speakingAudio').put(audio)

  await tx.done
}

export async function updateSpeakingSession(
  session: SpeakingSession,
): Promise<void> {
  const db = await getAudioDb()
  await db.put('speakingSessions', session)
}

export async function deleteSpeakingSession(id: string): Promise<void> {
  const db = await getAudioDb()
  const session = await db.get('speakingSessions', id)
  const tx = db.transaction(
    ['speakingSessions', 'speakingAudio'],
    'readwrite',
  )

  tx.objectStore('speakingSessions').delete(id)
  if (session) {
    tx.objectStore('speakingAudio').delete(session.audioId)
  }

  await tx.done
}

export async function replaceSpeakingData(
  sessions: SpeakingSession[],
  audio: SpeakingAudio[],
): Promise<void> {
  const db = await getAudioDb()
  const tx = db.transaction(
    ['speakingSessions', 'speakingAudio'],
    'readwrite',
  )
  const sessionStore = tx.objectStore('speakingSessions')
  const audioStore = tx.objectStore('speakingAudio')

  sessionStore.clear()
  audioStore.clear()

  for (const item of sessions) sessionStore.put(item)
  for (const item of audio) audioStore.put(item)

  await tx.done
}
