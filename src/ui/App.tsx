import { SceneRoot } from '../scene/SceneRoot'
import { Sidebar } from './Sidebar'
import { Inspector } from './Inspector'
import { Toolbar, TourBar, Hints } from './Toolbar'
import { ComparePanel, StrategyPanel, VerifyPanel, HelpPanel } from './Panels'
import { SitePlanModal } from './SitePlan'
import { useStore } from '../store'
import { PHASES } from '../data/layouts'

function PhaseStrip() {
  const phase = useStore((s) => s.phase)
  const setPhase = useStore((s) => s.setPhase)
  return (
    <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1 rounded-xl border border-line bg-paper/95 p-1.5 shadow backdrop-blur">
      <span className="px-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-2">Phase</span>
      {PHASES.map((p) => (
        <button
          key={p.id}
          onClick={() => setPhase(p.id)}
          title={`${p.id} — ${p.name}: ${p.desc}`}
          className={'rounded-md border px-2 py-1 text-[11.5px] font-medium ' + (phase === p.id ? 'border-sage-d bg-sage-d text-white' : phase > p.id ? 'border-line bg-card text-ink' : 'border-line bg-transparent text-ink-2 hover:bg-card')}
        >
          {p.id} <span className="hidden 2xl:inline">{p.short}</span>
        </button>
      ))}
    </div>
  )
}

export function App() {
  return (
    <div className="fixed inset-0 flex bg-paper">
      <Sidebar />
      <main className="relative isolate z-0 min-w-0 flex-1 overflow-hidden">
        <div className="absolute inset-0"><SceneRoot /></div>
        <PhaseStrip />
        <TourBar />
        <Hints />
        <Toolbar />
      </main>
      <Inspector />
      <SitePlanModal />
      <ComparePanel />
      <StrategyPanel />
      <VerifyPanel />
      <HelpPanel />
    </div>
  )
}
