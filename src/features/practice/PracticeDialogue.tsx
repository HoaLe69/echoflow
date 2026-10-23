import samAvatar from '../../assets/sam-avatar.jpg'
import type { ScoreResult } from '../../lib/score'
import type { Scenario, Turn } from '../../types/scenario'
import FeedbackBox from './FeedbackBox'
import PartnerTurn from './PartnerTurn'
import PatternClue from './PatternClue'
import UpcomingTurn from './UpcomingTurn'
import UserTurn from './UserTurn'
import { toFeedbackProps } from './feedback'
import type { UpcomingTurnItem } from './turnUtils'
import type { PracticeRole, TranscriptMode } from './types'

type PracticeDialogueProps = {
  scenario: Scenario
  role: PracticeRole
  userSpeaker: 0 | 1
  userTurn: Turn
  partnerTurn: Turn | null
  upcomingTurns: UpcomingTurnItem[]
  partnerName: string
  userRoleLabel: string
  mode: TranscriptMode
  step: number
  totalSteps: number
  speedLabel: string
  isHintOpen: boolean
  scoreResult: ScoreResult | null
  onToggleHint: () => void
  onListenPartner: () => void
  onListenReference: () => void
  onBreakdown: () => void
}

export default function PracticeDialogue({
  scenario,
  role,
  userSpeaker,
  userTurn,
  partnerTurn,
  upcomingTurns,
  partnerName,
  userRoleLabel,
  mode,
  step,
  totalSteps,
  speedLabel,
  isHintOpen,
  scoreResult,
  onToggleHint,
  onListenPartner,
  onListenReference,
  onBreakdown,
}: PracticeDialogueProps) {
  const highlightWords =
    scenario.id === 'coffee-order' && role === 0 ? ['oat', 'latte'] : []
  const highlightIpaIndex =
    scenario.id === 'coffee-order' && role === 0 ? 2 : undefined
  const targetWordCount = userTurn.text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  const feedback = scoreResult
    ? toFeedbackProps(scoreResult, targetWordCount)
    : null

  return (
    <div className="flex flex-col gap-5">
      {partnerTurn ? (
        <PartnerTurn
          turn={partnerTurn}
          name={partnerName}
          avatarSrc={samAvatar}
          speedLabel={speedLabel}
          onListen={onListenPartner}
        />
      ) : null}

      <UserTurn
        turn={userTurn}
        roleLabel={userRoleLabel}
        mode={mode}
        step={step}
        totalSteps={totalSteps}
        isHintOpen={isHintOpen}
        onToggleHint={onToggleHint}
        onListenReference={onListenReference}
        onBreakdown={onBreakdown}
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

        {feedback ? <FeedbackBox {...feedback} /> : null}
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
  )
}
