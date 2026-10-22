import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import samAvatar from '../assets/sam-avatar.jpg'
import Header from '../components/Header'
import scenarioData from '../data/scenarios.json'
import ActionDock from '../features/practice/ActionDock'
import ControlBar from '../features/practice/ControlBar'
import type {
  PlaybackSpeed,
  PracticeRole,
  TranscriptMode,
} from '../features/practice/ControlBar'
import FeedbackBox from '../features/practice/FeedbackBox'
import PartnerTurn from '../features/practice/PartnerTurn'
import PatternClue from '../features/practice/PatternClue'
import RoundTracker from '../features/practice/RoundTracker'
import UpcomingTurn from '../features/practice/UpcomingTurn'
import UserTurn from '../features/practice/UserTurn'
import { useProgress } from '../hooks/useProgress'
import { useRecognition } from '../hooks/useRecognition'
import { useSpeech } from '../hooks/useSpeech'
import { scorePronunciation } from '../lib/score'
import type { ScoreResult } from '../lib/score'
import type { Scenario, Turn } from '../types/scenario'

const scenarios = scenarioData as Scenario[]
const TOTAL_ROUNDS = 5

function firstUserTurnIndex(turns: Turn[], userSpeaker: 0 | 1): number {
  const index = turns.findIndex((turn) => turn.speaker === userSpeaker)
  return index === -1 ? 0 : index
}

function nextUserTurnIndex(turns: Turn[], fromIndex: number, userSpeaker: 0 | 1): number | null {
  for (let index = fromIndex + 1; index < turns.length; index += 1) {
    if (turns[index].speaker === userSpeaker) return index
  }
  return null
}

function previousPartnerTurn(
  turns: Turn[],
  activeIndex: number,
  userSpeaker: 0 | 1,
): Turn | null {
  for (let index = activeIndex - 1; index >= 0; index -= 1) {
    if (turns[index].speaker !== userSpeaker) return turns[index]
  }
  return null
}

function matchLabel(score: number): string {
  if (score >= 90) return 'Pronunciation Match: Velvety smooth!'
  if (score >= 75) return 'Pronunciation Match: Clear and steady!'
  if (score >= 50) return 'Pronunciation Match: Getting there!'
  return 'Pronunciation Match: Keep going!'
}

export default function PracticePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const scenario = scenarios.find((item) => item.id === id) ?? scenarios[0]

  const [round, setRound] = useState(1)
  const [isSessionComplete, setIsSessionComplete] = useState(false)

  const [role, setRole] = useState<PracticeRole>(0)

  const [activeTurnIndex, setActiveTurnIndex] = useState(() =>
    firstUserTurnIndex(scenario.turns, role),
  )
  const [transcriptMode, setTranscriptMode] = useState<TranscriptMode>('full')
  const [speed, setSpeed] = useState<PlaybackSpeed>('1.0')
  const [isHintOpen, setIsHintOpen] = useState(false)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)

  const lastScoredTranscript = useRef<string | null>(null)

  const { speak, cancel: cancelSpeech } = useSpeech()
  const { recordAttempt } = useProgress()
  const recognition = useRecognition({ lang: 'en-US' })
  const userSpeaker = role
  const otherRole: PracticeRole = role === 0 ? 1 : 0

  const partnerTurn = previousPartnerTurn(scenario.turns, activeTurnIndex, userSpeaker)
  const userTurn =
    scenario.turns[activeTurnIndex] ??
    scenario.turns[firstUserTurnIndex(scenario.turns, userSpeaker)]

  const upcomingTurns = scenario.turns
    .map((turn, index) => ({ turn, index }))
    .slice(activeTurnIndex + 1, activeTurnIndex + 3)

  const step = activeTurnIndex + 1
  const totalSteps = scenario.turns.length

  const highlightWords =
    scenario.id === 'coffee-order' && role === 0 ? ['oat', 'latte'] : []
  const highlightIpaIndex =
    scenario.id === 'coffee-order' && role === 0 ? 2 : undefined

  const partnerName = `Sam (${scenario.roles[otherRole]})`
  const userRoleLabel = `You (${scenario.roles[role]})`
  const cueText = partnerTurn?.text ?? userTurn.text
  const speedRate = Number(speed)
  const targetWordCount = userTurn.text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  const handleChangeRole = (nextRole: PracticeRole) => {
    if (nextRole == role) return
    cancelSpeech()
    recognition.reset()
    lastScoredTranscript.current = null
    setScoreResult(null)
    setRound(1)
    setIsSessionComplete(false)
    setRole(nextRole)
    setActiveTurnIndex(firstUserTurnIndex(scenario.turns, nextRole))
  }

  // Score once per completed attempt: recognition has stopped and a new
  // transcript is available.
  useEffect(() => {
    if (recognition.isListening) return

    const transcript = recognition.transcript.trim()
    if (!transcript || transcript === lastScoredTranscript.current) return

    lastScoredTranscript.current = transcript
    const result = scorePronunciation(userTurn.text, transcript)
    setScoreResult(result)
    recordAttempt(scenario.id, { fluencyScore: result.score })
  }, [
    recognition.isListening,
    recognition.transcript,
    recordAttempt,
    scenario.id,
    userTurn.text,
  ])

  const handleRecord = () => {
    if (!recognition.isSupported || isSessionComplete) return

    if (recognition.isListening) {
      recognition.stop()
      return
    }

    cancelSpeech()
    lastScoredTranscript.current = null
    setScoreResult(null)
    recognition.start()
  }

  const handleReset = () => {
    cancelSpeech()
    recognition.reset()
    lastScoredTranscript.current = null
    setScoreResult(null)
  }

  const handleNextTurn = () => {
    if (isSessionComplete) {
      navigate('/')
      return
    }

    // Stop anything still playing/recording and clear the last attempt.
    cancelSpeech()
    recognition.reset()
    lastScoredTranscript.current = null
    setScoreResult(null)

    const nextIndex = nextUserTurnIndex(scenario.turns, activeTurnIndex, userSpeaker)

    if (nextIndex !== null) {
      setActiveTurnIndex(nextIndex)
      return
    }

    if (round < TOTAL_ROUNDS) {
      setRound((current) => current + 1)
      setActiveTurnIndex(firstUserTurnIndex(scenario.turns, userSpeaker))
      return
    }

    setIsSessionComplete(true)
  }

  const recognitionNotice =
    recognition.error ??
    (recognition.isSupported
      ? null
      : 'Speech recognition is not available in this browser. Try Chrome or Edge.')

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <Header subtitle="Matcha practice" />

      <main className="flex-1 pt-16">
        <ControlBar
          scenario={scenario}
          role={role}
          onRoleChange={handleChangeRole}
          transcriptMode={transcriptMode}
          onTranscriptModeChange={setTranscriptMode}
          speed={speed}
          onSpeedChange={setSpeed}
          onBack={() => navigate('/')}
        />

        <div className="mx-auto w-full max-w-3xl px-4 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-6 sm:px-6">
          <div className="flex flex-col gap-5">
            <RoundTracker round={round} totalRounds={TOTAL_ROUNDS} />

            {recognitionNotice ? (
              <p
                role="alert"
                className="rounded-2xl border border-error/20 bg-error-container px-4 py-3 text-xs font-medium text-on-error-container"
              >
                {recognitionNotice}
              </p>
            ) : null}

            {isSessionComplete ? (
              <div
                role="status"
                className="rounded-2xl border border-primary-fixed bg-matcha-foam px-4 py-3 text-xs font-semibold text-primary"
              >
                Loop complete — all {TOTAL_ROUNDS} rounds finished. 🍵 Next Turn
                returns to the library.
              </div>
            ) : null}

            <div className="flex flex-col gap-5">
              {partnerTurn ? (
                <PartnerTurn
                  turn={partnerTurn}
                  name={partnerName}
                  avatarSrc={samAvatar}
                  speedLabel={speed}
                  onListen={() => speak(cueText, { rate: speedRate })}
                />
              ) : null}

              <UserTurn
                turn={userTurn}
                roleLabel={userRoleLabel}
                mode={transcriptMode}
                step={step}
                totalSteps={totalSteps}
                isHintOpen={isHintOpen}
                onToggleHint={() => setIsHintOpen((open) => !open)}
                onListenReference={() =>
                  speak(userTurn.text, { rate: speedRate })
                }
                onBreakdown={() => speak(userTurn.text, { rate: 0.8 })}
                highlightWords={highlightWords}
                highlightIpaIndex={highlightIpaIndex}
              >
                {isHintOpen ? (
                  <PatternClue
                    title="Natural Cafe Frame:"
                    pattern='"Could I get [drink] with [request], please?"'
                    description='Soft, polite, and native-sounding without blunt "I want" commands.'
                  />
                ) : null}

                {scoreResult ? (
                  <FeedbackBox
                    score={scoreResult.score}
                    message={matchLabel(scoreResult.score)}
                    detail={`${scoreResult.matchedWords.length} of ${targetWordCount} words matched${scoreResult.hesitationCount > 0
                      ? ` · ${scoreResult.hesitationCount} filler${scoreResult.hesitationCount === 1 ? '' : 's'
                      }`
                      : ''
                      }`}
                    feedbackMessage={scoreResult.feedbackMessage}
                  />
                ) : null}
              </UserTurn>

              {upcomingTurns.map(({ turn, index }) => {
                const isPartner = turn.speaker !== userSpeaker

                return (
                  <UpcomingTurn
                    key={`${turn.speaker}-${index}`}
                    side={isPartner ? 'partner' : 'user'}
                    name={isPartner ? partnerName : userRoleLabel}
                    label={`Upcoming Turn ${index + 1}`}
                    text={turn.text}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </main>

      <ActionDock
        isRecording={recognition.isListening}
        recordingHint={userTurn.text}
        onListenAgain={() => speak(cueText, { rate: speedRate })}
        onReset={handleReset}
        onRecord={handleRecord}
        onNext={handleNextTurn}
      />
    </div>
  )
}
