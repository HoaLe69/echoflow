import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import { getScenarioById, scenarios } from '../data/scenarios'
import ActionDock from '../features/practice/ActionDock'
import ControlBar from '../features/practice/ControlBar'
import PracticeDialogue from '../features/practice/PracticeDialogue'
import PracticeNotices from '../features/practice/PracticeNotices'
import RoundTracker from '../features/practice/RoundTracker'
import { TOTAL_ROUNDS } from '../features/practice/constants'
import { usePracticeSession } from '../features/practice/session'
import type { PlaybackSpeed, PracticeRole, TranscriptMode } from '../features/practice/types'
import { usePracticeAttempt } from '../features/practice/usePracticeAttempt'

export default function PracticePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const scenario = getScenarioById(id) ?? scenarios[0]

  const session = usePracticeSession(scenario)

  const [transcriptMode, setTranscriptMode] = useState<TranscriptMode>('full')
  const [speed, setSpeed] = useState<PlaybackSpeed>('1.0')
  const [isHintOpen, setIsHintOpen] = useState(false)

  const attempt = usePracticeAttempt({
    scenarioId: scenario.id,
    turnKey: session.turnKey,
    cue: session.partnerTurn?.text ?? null,
    target: session.userTurn.text,
    rate: Number(speed),
    isActive: !session.isComplete,
  })

  const handleRoleChange = (nextRole: PracticeRole) => {
    if (nextRole === session.role) return

    attempt.resetAttempt()
    session.changeRole(nextRole)
  }

  const handleNextTurn = () => {
    attempt.resetAttempt()

    if (session.isComplete) {
      navigate('/')
      return
    }

    session.nextTurn()
  }

  const handleRecord = () => {
    if (session.isComplete) return
    attempt.toggleRecording()
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <Header subtitle="Matcha practice" />

      <main className="flex-1 pt-16">
        <ControlBar
          scenario={scenario}
          role={session.role}
          onRoleChange={handleRoleChange}
          transcriptMode={transcriptMode}
          onTranscriptModeChange={setTranscriptMode}
          speed={speed}
          onSpeedChange={setSpeed}
          onBack={() => navigate('/')}
        />

        <div className="mx-auto w-full max-w-3xl px-4 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-6 sm:px-6">
          <div className="flex flex-col gap-5">
            <RoundTracker round={session.round} totalRounds={TOTAL_ROUNDS} />

            <PracticeNotices
              error={attempt.error}
              isSupported={attempt.isSupported}
              isComplete={session.isComplete}
              totalRounds={TOTAL_ROUNDS}
            />

            <PracticeDialogue
              scenario={scenario}
              role={session.role}
              userSpeaker={session.userSpeaker}
              userTurn={session.userTurn}
              partnerTurn={session.partnerTurn}
              upcomingTurns={session.upcomingTurns}
              partnerName={session.partnerName}
              userRoleLabel={session.userRoleLabel}
              mode={transcriptMode}
              step={session.step}
              totalSteps={session.totalSteps}
              speedLabel={speed}
              isHintOpen={isHintOpen}
              scoreResult={attempt.scoreResult}
              onToggleHint={() => setIsHintOpen((open) => !open)}
              onListenPartner={attempt.playPartner}
              onListenReference={attempt.playReference}
              onBreakdown={attempt.playBreakdown}
            />
          </div>
        </div>
      </main>

      <ActionDock
        isRecording={attempt.isListening}
        recordingHint={session.userTurn.text}
        onListenAgain={attempt.playPartner}
        onReset={attempt.resetAttempt}
        onRecord={handleRecord}
        onNext={handleNextTurn}
      />
    </div>
  )
}
