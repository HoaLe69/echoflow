import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import Header from '../components/Header'
import Icon from '../components/Icon'
import Pill from '../components/Pill'
import scenarioData from '../data/scenarios.json'
import CustomLoopModal from '../features/library/CustomLoopModal'
import type { CustomLoopFormValues } from '../features/library/CustomLoopModal'
import LevelTabs from '../features/library/LevelTabs'
import type { LevelFilter } from '../features/library/LevelTabs'
import ScenarioCard from '../features/library/ScenarioCard'
import SearchBar from '../features/library/SearchBar'
import type { Progress, Scenario } from '../types/scenario'

const scenarios = scenarioData as Scenario[]

/** Mock progress values live on the page for now (no persistence). */
const progressById: Record<string, Progress> = {
  'coffee-order': { reps: 8, fluencyScore: 84, favorite: true },
  'airport-hotel': { reps: 3, fluencyScore: 68, favorite: false },
  'team-standup': { reps: 14, fluencyScore: 92, favorite: true },
  'food-delivery': { reps: 0, favorite: false },
  'running-late': { reps: 5, fluencyScore: 70, favorite: false },
  'neighbor-small-talk': { reps: 6, fluencyScore: 78, favorite: false },
}

const progressNotes: Record<string, string> = {
  'coffee-order': 'Blind Mode Unlocked',
  'airport-hotel': 'Next: Practice Speaker B',
  'team-standup': 'Ready for Live Call ✨',
  'food-delivery': 'Est. 4 mins',
  'running-late': 'Cadence flowing',
  'neighbor-small-talk': 'Rhythm steady',
}

export default function LibraryPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<LevelFilter>('all')
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false)

  const needle = query.trim().toLowerCase()
  const filteredScenarios = scenarios.filter((scenario) => {
    if (level !== 'all' && scenario.level !== level) return false
    if (!needle) return true

    const haystack = [
      scenario.title,
      scenario.topic,
      scenario.goal ?? '',
      ...scenario.roles,
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(needle)
  })

  const handleStart = (scenario: Scenario) => {
    navigate(`/practice/${scenario.id}`)
  }

  const handlePreviewScript = (scenario: Scenario) => {
    // TODO(me): open the Script preview.
    console.log('preview script', scenario.id)
  }

  const handleToggleFavorite = (scenario: Scenario) => {
    // TODO(me): persist the favorite state.
    console.log('toggle favorite', scenario.id)
  }

  const handleCreateLoop = (values: CustomLoopFormValues) => {
    // TODO(me): parse the script and add the custom loop.
    console.log('create custom loop', values)
    setIsCustomModalOpen(false)
  }

  const resetFilters = () => {
    setQuery('')
    setLevel('all')
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <Header />

      <main className="flex-1 pt-16">
        <h1 className="sr-only">EchoFlow scenario library</h1>

        <section className="relative overflow-hidden px-4 pb-6 pt-8 sm:px-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 right-1/4 h-80 w-80 rounded-full bg-primary-fixed/30 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-10 top-1/3 h-64 w-64 rounded-full bg-mochi-blush/60 blur-3xl"
          />

          <div className="relative mx-auto max-w-7xl">
            <div className="flex flex-col gap-3 pt-1 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col items-stretch gap-2.5 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(true)}
                  className="focus-ring flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container hover:shadow active:scale-[0.98]"
                >
                  <Icon name="add_circle" className="text-lg" />
                  Prepare Custom Loop
                </button>
                <SearchBar
                  value={query}
                  onChange={setQuery}
                  className="flex-1"
                />
              </div>

              <LevelTabs
                value={level}
                onChange={setLevel}
                className="lg:flex-shrink-0"
              />
            </div>
          </div>
        </section>

        <section className="w-full px-4 pb-16 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-matcha-forest">
                  Calibrated Practice Loops
                </h2>
                <span aria-live="polite">
                  <Pill tone="primary">
                    {filteredScenarios.length}{' '}
                    {filteredScenarios.length === 1 ? 'scenario' : 'scenarios'}
                  </Pill>
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-matcha-sage">
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary"
                />
                Audio sync ready
              </div>
            </div>

            {filteredScenarios.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredScenarios.map((scenario) => (
                  <ScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    progress={
                      progressById[scenario.id] ?? {
                        reps: 0,
                        favorite: false,
                      }
                    }
                    note={progressNotes[scenario.id]}
                    onStart={() => handleStart(scenario)}
                    onPreviewScript={() => handlePreviewScript(scenario)}
                    onToggleFavorite={() => handleToggleFavorite(scenario)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-primary/20 bg-surface-container-lowest px-6 py-16 text-center">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-matcha-foam text-primary"
                >
                  <Icon name="search_off" className="text-2xl" />
                </span>
                <h3 className="mt-4 font-headline text-lg font-bold text-matcha-forest">
                  No loops match your filters
                </h3>
                <p className="mt-1 max-w-sm text-sm text-matcha-sage">
                  Try another level or a broader search — your next practice
                  session is close.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="focus-ring mt-5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-95"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      <CustomLoopModal
        open={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSubmit={handleCreateLoop}
      />
    </div>
  )
}
