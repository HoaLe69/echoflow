export type Level = 'a1-a2' | 'b1' | 'b2'

/**
 * One line of dialogue.
 *
 * speaker 0 = the learner ("you"), speaker 1 = the practice partner.
 * `ipa` is a pronunciation hint; segments are separated by " | " so the UI can
 * render them as individual chips.
 */
export type Turn = {
  speaker: 0 | 1
  text: string
  ipa?: string
}

export type Scenario = {
  id: string
  title: string
  level: Level
  topic: string
  goal?: string
  /** [your role, partner role] */
  roles: [string, string]
  turns: Turn[]
}

export type Progress = {
  reps: number
  fluencyScore?: number
  favorite: boolean
}
