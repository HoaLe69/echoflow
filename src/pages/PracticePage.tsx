import { useState } from 'react'
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
import type { Scenario } from '../types/scenario'

const scenarios = scenarioData as Scenario[]

export default function PracticePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const scenario = scenarios.find((item) => item.id === id) ?? scenarios[0]

  const [role, setRole] = useState<PracticeRole>(0)
  const [transcriptMode, setTranscriptMode] =
    useState<TranscriptMode>('full')
  const [speed, setSpeed] = useState<PlaybackSpeed>('1.0')
  const [isHintOpen, setIsHintOpen] = useState(false)
  // UI-only mock for the docking button's visual state; no microphone access.
  const [isRecording, setIsRecording] = useState(false)

  const partnerTurn = scenario.turns[0]
  const userTurn = scenario.turns[1]
  const upcomingTurns = scenario.turns.slice(2, 4)
  const highlightWords =
    scenario.id === 'coffee-order' ? ['oat', 'latte'] : []
  const highlightIpaIndex = scenario.id === 'coffee-order' ? 2 : undefined

  const partnerName = `Sam (${scenario.roles[1]})`
  const userRoleLabel = `You (${scenario.roles[role]})`

  const onRecord = () => {
    console.log("Start to record")
    setIsRecording((recording) => !recording)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <Header subtitle="Matcha practice" />

      <main className="flex-1 pt-16">
        <ControlBar
          scenario={scenario}
          role={role}
          onRoleChange={setRole}
          transcriptMode={transcriptMode}
          onTranscriptModeChange={setTranscriptMode}
          speed={speed}
          onSpeedChange={setSpeed}
          onBack={() => navigate('/')}
        />

        <div className="mx-auto w-full max-w-3xl px-4 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-6 sm:px-6">
          <div className="flex flex-col gap-5">
            <RoundTracker round={4} totalRounds={5} />

            <div className="flex flex-col gap-5">
              <PartnerTurn
                turn={partnerTurn}
                name={partnerName}
                avatarSrc={samAvatar}
                speedLabel={speed}
                onListen={() => {
                  // TODO(me): play the partner's native audio.
                  console.log('listen to partner turn')
                }}
              />

              <UserTurn
                turn={userTurn}
                roleLabel={userRoleLabel}
                mode={transcriptMode}
                step={2}
                totalSteps={4}
                isHintOpen={isHintOpen}
                onToggleHint={() => setIsHintOpen((open) => !open)}
                onListenReference={() => {
                  // TODO(me): play the reference pronunciation.
                  console.log('listen to reference')
                }}
                onBreakdown={() => {
                  // TODO(me): play the 0.8x breakdown.
                  console.log('play 0.8x breakdown')
                }}
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

                <FeedbackBox
                  score={94}
                  message="Pronunciation Match: Velvety smooth!"
                  detail="Spot-on cadence on /ˈlɑːteɪ/"
                  feedbackMessage="Zero 'umms' detected! Flowing like fresh whisked matcha 🍵"
                />
              </UserTurn>

              {upcomingTurns.map((turn, index) => {
                const isPartner = turn.speaker === 1

                return (
                  <UpcomingTurn
                    key={`${turn.speaker}-${index}`}
                    side={isPartner ? 'partner' : 'user'}
                    name={isPartner ? partnerName : userRoleLabel}
                    label={`Upcoming Turn ${index + 3}`}
                    text={turn.text}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </main>

      <ActionDock
        isRecording={isRecording}
        recordingHint={userTurn.text}
        onListenAgain={() => {
          // TODO(me): replay the last audio prompt.
          console.log('listen again')
        }}
        onReset={() => {
          // TODO(me): reset the repetition state.
          console.log('reset repetition')
        }}
        onRecord={onRecord}
        onNext={() => {
          // TODO(me): advance the conversation.
          console.log('next turn')
        }}
      />
    </div>
  )
}
