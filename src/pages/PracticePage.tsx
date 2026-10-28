import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import ActionDock from '../features/practice/ActionDock'
import ControlBar from '../features/practice/ControlBar'
import PracticeDialogue from '../features/practice/PracticeDialogue'
import PracticeNotices from '../features/practice/PracticeNotices'
import RoundTracker from '../features/practice/RoundTracker'
import { TOTAL_ROUNDS } from '../features/practice/constants'
import { usePracticeSession } from '../features/practice/session'
import type { PlaybackSpeed, PracticeRole, TranscriptMode } from '../features/practice/types'
import { usePracticeAttempt } from '../features/practice/usePracticeAttempt'
import { useScenarioById } from '../hooks/useScenarioById'
import type { Scenario } from '../types/scenario'
import MyTakeCard from '../features/practice/MyTakeCard'

export default function PracticePage() {
  const { id } = useParams<{ id: string }>()
  const { scenario, isLoading, error } = useScenarioById(id)

  if (isLoading) {
    return (
      <div className="flex min-h-dvh flex-col bg-surface">
        <Header subtitle="Matcha practice" />
        <main className="flex flex-1 items-center justify-center pt-16">
          <p className="text-sm font-semibold text-matcha-sage">Loading scenario…</p>
        </main>
      </div>
    )
  }

  if (!scenario) {
    return (
      <div className="flex min-h-dvh flex-col bg-surface">
        <Header subtitle="Matcha practice" />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 pt-16 text-center">
          <p className="text-sm font-semibold text-on-surface-variant">
            {error ?? 'Scenario not found.'}
          </p>
          <Link to="/" className="text-xs font-bold text-primary underline underline-offset-4">
            Back to library
          </Link>
        </main>
      </div>
    )
  }

  return <PracticeSession scenario={scenario} />
}

function PracticeSession({ scenario }: { scenario: Scenario }) {
  const navigate = useNavigate()
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
    audioSourceId: scenario.audioSourceId,
    cueAudio: session.partnerTurn?.audio,
    targetAudio: session.userTurn.audio,
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
              error={attempt.audioError ?? attempt.error}
              isSupported={attempt.isSupported}
              isComplete={session.isComplete}
              totalRounds={TOTAL_ROUNDS}
            />

            {attempt.autoplayBlocked && session.partnerTurn ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary-fixed bg-matcha-foam px-4 py-3">
                <div className="text-xs text-primary">
                  <p className="font-bold">Your browser blocked autoplay.</p>
                  <p className="text-matcha-sage">
                    Tap once to hear the partner line; later turns play
                    automatically.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={attempt.playPartner}
                  className="focus-ring rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-bold text-on-primary shadow-sm"
                >
                  Play partner line
                </button>
              </div>
            ) : null}
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
              takeSlot={
                <MyTakeCard
                  audioUrl={attempt.recordingUrl}
                  durationMs={attempt.recordingDurationMs}
                  transcript={attempt.spokenTranscript}
                  isRecording={attempt.isRecording}
                  recognitionSupported={attempt.isSupported}
                  error={attempt.recorderError}
                />
              }
            />
          </div>
        </div>
      </main>
      <ActionDock
        isRecording={attempt.isRecording}
        recordingHint={session.userTurn.text}
        onListenAgain={attempt.playPartner}
        onReset={attempt.resetAttempt}
        onRecord={handleRecord}
        onNext={handleNextTurn}
      />
    </div>
  )
}
