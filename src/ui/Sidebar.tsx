import { useEffect, useRef } from 'react'
import { useStore, type LeftTab } from '../store'
import { LAYOUTS, RECOMMENDED, PHASES } from '../data/layouts'
import { CATALOG, ZONE_INFO } from '../data/catalog'
import { VERIFY_ITEMS } from '../data/site'
import { samplePath } from '../lib/geometry'
import { useIssues } from '../scene/Editing'
import { Btn, Section, Slider, Toggle, cx, useMetrics, fmt } from './kit'
import { Dashboard } from './Dashboard'
import { zoneLabel } from '../lib/analysis'

const TABS: { id: LeftTab; label: string }[] = [
  { id: 'plan', label: 'Plan' },
  { id: 'buildings', label: 'Buildings' },
  { id: 'landscape', label: 'Landscape' },
  { id: 'sustain', label: 'Sustain' },
  { id: 'phases', label: 'Phases' },
]

const StatusPill = ({ s }: { s: 'existing' | 'planned' | 'proposed' }) => (
  <span className={cx('rounded-full border px-1.5 py-[1px] text-[10px] font-medium', s === 'existing' ? 'border-ink/30 bg-ink text-white' : s === 'planned' ? 'border-timber bg-timber/15 text-[#7a5430]' : 'border-sage bg-sage/15 text-sage-d')}>
    {s}
  </span>
)

function PlanTab() {
  const optionId = useStore((s) => s.optionId)
  const setOption = useStore((s) => s.setOption)
  const resetLayout = useStore((s) => s.resetLayout)
  const openPanel = useStore((s) => s.openPanel)
  const select = useStore((s) => s.select)
  const issues = useIssues()
  const layout = useStore((s) => s.layout)
  const second = useStore((s) => s.settings.releaseSecondDwelling)
  void second
  return (
    <>
      <Section title="Masterplan options">
        <div className="space-y-2">
          {(['A', 'B', 'C'] as const).map((id) => {
            const L = LAYOUTS[id]
            const len = samplePath(L.boardwalk, 0.5).length
            return (
              <button
                key={id}
                onClick={() => setOption(id)}
                className={cx('w-full rounded-lg border p-3 text-left transition-colors', optionId === id ? 'border-sage-d bg-card shadow-sm ring-1 ring-sage-d/40' : 'border-line bg-card/60 hover:bg-card')}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-[15px]">Option {id} — {L.name}</span>
                  {id === RECOMMENDED && <span className="rounded-full bg-sage-d px-2 py-[1px] text-[10px] font-semibold text-white">Recommended</span>}
                </div>
                <p className="mt-1 text-[12px] leading-snug text-ink-2">{L.tagline}</p>
                <p className="mt-1.5 text-[11px] text-ink-2">Boardwalk {fmt(len, 0)} m · office {fmt(L.structures[0].w * L.structures[0].d, 0)} m² · wellness {fmt(L.structures[1].w * L.structures[1].d, 0)} m²</p>
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex gap-2">
          <Btn className="flex-1" tone="sage" onClick={() => openPanel('compare', true)}>Compare options</Btn>
          <Btn className="flex-1" onClick={resetLayout} title="Discard edits and restore this option's default layout">Reset layout</Btn>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-ink-2">{layout.description}</p>
      </Section>

      <Section title={`Checks (${issues.filter((i) => i.severity !== 'info').length} to review)`}>
        {issues.length === 0 && <p className="text-[12px] text-sage-d">✓ No boundary, collision or boardwalk problems detected.</p>}
        <ul className="space-y-1.5">
          {issues.map((i) => (
            <li key={i.id}>
              <button onClick={() => select(i.ids[i.ids.length - 1] === 'boardwalk' ? 'boardwalk' : i.ids[0])} className="flex w-full items-start gap-2 rounded-md border border-line bg-card px-2.5 py-1.5 text-left text-[12px] leading-snug hover:bg-paper-2">
                <i className={cx('mt-[5px] h-2 w-2 shrink-0 rounded-full', i.severity === 'error' ? 'bg-[#c0392b]' : i.severity === 'warn' ? 'bg-[#d89a3a]' : 'bg-ink-2/50')} />
                <span>{i.text}</span>
              </button>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Site facts & open questions">
        <p className="text-[12px] leading-relaxed text-ink-2">
          Geometry is traced from the survey plan (1:500) and checked against the stated 1418 m². Setbacks, permits, utilities, soil and groundwater are <b>not</b> assumed.
        </p>
        <Btn className="mt-2 w-full" onClick={() => openPanel('verify', true)}>Verification items ({VERIFY_ITEMS.length})</Btn>
      </Section>
    </>
  )
}

function BuildingsTab() {
  const layout = useStore((s) => s.layout)
  const phase = useStore((s) => s.phase)
  const select = useStore((s) => s.select)
  const selected = useStore((s) => s.selected)
  const setEdit = useStore((s) => s.setEdit)
  const edit = useStore((s) => s.editMode)
  const fixed = [
    { id: 'house', area: 4.2 * 7.4 },
    { id: 'extension', area: 5.8 * 5.5 },
    { id: 'terrace', area: 4.8 * 7.2 },
    ...(phase < 1 ? [{ id: 'shed', area: 3.4 * 4.6 }] : []),
    ...(useStore.getState().settings.releaseSecondDwelling ? [] : [{ id: 'second', area: 4.3 * 7.4 }]),
  ]
  const Row = ({ id, label, area, sub, status, ph }: { id: string; label: string; area: number; sub: string; status: 'existing' | 'planned' | 'proposed'; ph: number }) => (
    <button
      onClick={() => select(id)}
      className={cx('flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left', selected === id ? 'border-sage-d bg-card ring-1 ring-sage-d/40' : 'border-line bg-card/60 hover:bg-card', ph > phase && 'opacity-45')}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{label}</div>
        <div className="truncate text-[11px] text-ink-2">{sub}</div>
      </div>
      <div className="text-right">
        <div className="text-[12px] tabular-nums">{fmt(area, 0)} m²</div>
        <StatusPill s={status} />
      </div>
    </button>
  )
  return (
    <>
      <Section title="Existing & planned (fixed)">
        <div className="space-y-1.5">
          {fixed.map((f) => (
            <Row key={f.id} id={f.id} label={CATALOG[f.id].title} area={f.area} sub={`Phase ${CATALOG[f.id].phase} · ${CATALOG[f.id].subtitle.split('—').pop()!.trim()}`} status={CATALOG[f.id].status} ph={CATALOG[f.id].phase} />
          ))}
        </div>
      </Section>
      <Section title="Proposed pavilions (editable)" right={<Btn className="!py-0.5 !text-[11px]" active={edit} onClick={() => setEdit(!edit)}>{edit ? 'Editing' : 'Edit'}</Btn>}>
        <div className="space-y-1.5">
          {layout.structures.map((s) => (
            <Row key={s.id} id={s.id} label={s.label} area={s.w * s.d} sub={`Phase ${s.phase} · ${s.w.toFixed(1)} × ${s.d.toFixed(1)} m · rot ${Math.round(s.rot)}°`} status="proposed" ph={s.phase} />
          ))}
        </div>
        <p className="mt-2 text-[11.5px] leading-snug text-ink-2">In Edit mode drag a pavilion on the ground, press <kbd className="rounded border border-line bg-card px-1">R</kbd> to rotate 15°, or use the inspector sliders. Objects cannot leave the boundary; overlaps are flagged in red.</p>
      </Section>
      <Section title="Other">
        <div className="space-y-1.5">
          <Row id="boardwalk" label="Continuous boardwalk" area={useMetrics().boardwalkArea} sub={`Phase 2 · ${CATALOG.boardwalk.subtitle.split('—').pop()!.trim()}`} status="proposed" ph={2} />
          <Row id="fence" label="Fence, gates & entrance" area={0} sub="Phase 2 · natural timber, dark steel" status="proposed" ph={2} />
        </div>
      </Section>
    </>
  )
}

function LandscapeTab() {
  const layers = useStore((s) => s.layers)
  const toggleLayer = useStore((s) => s.toggleLayer)
  const layout = useStore((s) => s.layout)
  const patchFeature = useStore((s) => s.patchFeature)
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const openPanel = useStore((s) => s.openPanel)
  const select = useStore((s) => s.select)
  const phase = useStore((s) => s.phase)
  const m = useMetrics()
  const zones = Object.keys(ZONE_INFO)
  return (
    <>
      <Section title="Layers">
        <Toggle label="Vegetation" checked={layers.vegetation} onChange={() => toggleLayer('vegetation')} />
        <Toggle label="Boardwalk" checked={layers.boardwalk} onChange={() => toggleLayer('boardwalk')} />
        <Toggle label="Fences & gates" checked={layers.fences} onChange={() => toggleLayer('fences')} />
        <Toggle label="Dimensions" checked={layers.dimensions} onChange={() => toggleLayer('dimensions')} />
        <Toggle label="Name tags" checked={layers.labels} onChange={() => toggleLayer('labels')} />
        <Toggle label="Utility routes (plan)" checked={layers.utilities} onChange={() => toggleLayer('utilities')} />
        <Toggle label="Open roofs (interiors)" checked={layers.interiors} onChange={() => toggleLayer('interiors')} />
        <Toggle label="Night lighting" checked={layers.lights} onChange={() => toggleLayer('lights')} />
        <Toggle label="Surroundings & neighbours" checked={layers.context} onChange={() => toggleLayer('context')} />
        <Toggle label="Second-dwelling ghost" checked={layers.second} onChange={() => toggleLayer('second')} />
      </Section>

      <Section title="Growth & boardwalk">
        <Slider label="Planting age" value={settings.growthYears} min={0} max={30} step={1} digits={0} unit=" yrs" onChange={(v) => setSettings({ growthYears: v })} />
        <Slider label="Boardwalk width" value={layout.boardwalkWidth} min={1.0} max={1.4} step={0.05} unit=" m" digits={2} onChange={(v) => setSettings({ boardwalkWidth: v })} />
      </Section>

      <Section title="Optional features">
        {layout.features.map((f) => (
          <div key={f.id} className={cx(f.phase > phase && 'opacity-50')}>
            <Toggle
              label={<button onClick={() => select(f.id)} className="text-left hover:underline">{f.label}</button>}
              checked={f.enabled}
              onChange={(v) => patchFeature(f.id, { enabled: v })}
              hint={`Phase ${f.phase}`}
            />
          </div>
        ))}
      </Section>

      <Section title="Planting zones" right={<Btn className="!py-0.5 !text-[11px]" tone="sage" onClick={() => openPanel('plants', true)}>Strategy</Btn>}>
        <div className="space-y-2">
          {zones.map((z) => (
            <div key={z} className="flex gap-2.5">
              <i className="mt-1 h-3 w-3 shrink-0 rounded-sm" style={{ background: ZONE_INFO[z].color }} />
              <div className="min-w-0">
                <div className="flex justify-between gap-2 text-[12.5px] font-medium"><span>{ZONE_INFO[z].name}</span><span className="tabular-nums text-ink-2">{fmt(m.area[z] || 0, 0)} m²</span></div>
                <p className="text-[11px] leading-snug text-ink-2">{ZONE_INFO[z].desc}</p>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-ink-2">Remaining: {zoneLabel('grass').toLowerCase()} {fmt(m.area.grass || 0, 0)} m² (kept as pasture, mown paths only).</p>
        </div>
      </Section>

      <Section title="Settings">
        <Toggle label="Use second-dwelling land" checked={settings.releaseSecondDwelling} onChange={(v) => setSettings({ releaseSecondDwelling: v })} hint="Treat the right-hand dwelling footprint from the plan as available land" />
        <Slider label="Feature setback to boundary" value={settings.featureSetback} min={0.5} max={3} step={0.25} unit=" m" digits={2} onChange={(v) => setSettings({ featureSetback: v })} />
        <Slider label="Sheet bearing from true north" value={settings.northOffset} min={-30} max={30} step={1} digits={0} unit="°" onChange={(v) => setSettings({ northOffset: v })} />
        <div className="mt-1 flex items-center justify-between text-[12.5px]">
          <span>Render quality</span>
          <span className="flex gap-1">
            <Btn active={settings.quality === 'medium'} className="!py-0.5" onClick={() => setSettings({ quality: 'medium' })}>Standard</Btn>
            <Btn active={settings.quality === 'high'} className="!py-0.5" onClick={() => setSettings({ quality: 'high' })} title="Ambient occlusion, bloom, 4k ground map">High</Btn>
          </span>
        </div>
      </Section>
    </>
  )
}

function PhasesTab() {
  const phase = useStore((s) => s.phase)
  const setPhase = useStore((s) => s.setPhase)
  const layout = useStore((s) => s.layout)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])
  const play = () => {
    if (timer.current) clearInterval(timer.current)
    let p = 0
    setPhase(0)
    timer.current = setInterval(() => {
      p++
      if (p > 5) {
        if (timer.current) clearInterval(timer.current)
        return
      }
      setPhase(p)
    }, 2600)
  }
  const items = (p: number): string[] => {
    const out: string[] = []
    if (p === 0) out.push('Existing house', 'Existing tin garage', 'Open pasture, spot-height terrain')
    if (p === 1) out.push('House extension (+3.3 m south)', 'Main terrace & pergola', 'Tin garage removed')
    if (p === 2) out.push('Fence, gates & entrance apron', 'Continuous boardwalk', 'Bin store, bike shelter', ...layout.features.filter((f) => f.phase === 2).map((f) => f.label), ...layout.zones.filter((z) => z.phase === 2).map((z) => z.label))
    layout.structures.filter((s) => s.phase === p).forEach((s) => out.push(s.label))
    if (p === 5) out.push(...layout.features.filter((f) => f.phase === 5).map((f) => f.label), ...layout.zones.filter((z) => z.phase === 5).map((z) => z.label))
    return out
  }
  return (
    <Section title="Project phases" right={<Btn className="!py-0.5 !text-[11px]" tone="sage" onClick={play}>▶ Play evolution</Btn>}>
      <div className="space-y-2">
        {PHASES.map((p) => (
          <button key={p.id} onClick={() => setPhase(p.id)} className={cx('w-full rounded-lg border p-3 text-left', phase === p.id ? 'border-sage-d bg-card ring-1 ring-sage-d/40' : phase > p.id ? 'border-line bg-card/70' : 'border-dashed border-line bg-transparent opacity-80 hover:bg-card/60')}>
            <div className="flex items-center gap-2">
              <span className={cx('grid h-5 w-5 place-items-center rounded-full text-[11px] font-semibold', phase >= p.id ? 'bg-sage-d text-white' : 'bg-paper-2 text-ink-2')}>{p.id}</span>
              <span className="font-serif text-[14px]">{p.name}</span>
            </div>
            <p className="mt-1 text-[11.5px] leading-snug text-ink-2">{p.desc}</p>
            {phase === p.id && (
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[11.5px] text-ink">
                {items(p.id).slice(0, 14).map((t) => <li key={t}>{t}</li>)}
              </ul>
            )}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11.5px] leading-snug text-ink-2">The scene shows everything up to the selected phase. Sustainability figures follow the phase too.</p>
    </Section>
  )
}

export function Sidebar() {
  const tab = useStore((s) => s.leftTab)
  const setTab = useStore((s) => s.setLeftTab)
  return (
    <aside className="flex h-full w-[312px] shrink-0 flex-col border-r border-line bg-paper">
      <div className="border-b border-line px-4 pb-3 pt-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sage-d">Narewka · Mickiewicza 1 · dz. 420</div>
        <h1 className="mt-1 font-serif text-[21px] leading-[1.15]">Japandi Forest Sanctuary</h1>
        <p className="mt-1 text-[12px] italic text-ink-2">Japanese simplicity meets the wild landscape of Podlasie.</p>
      </div>
      <nav className="grid grid-cols-5 border-b border-line text-[11.5px]">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cx('border-b-2 px-1 py-2.5 font-medium', tab === t.id ? 'border-sage-d text-ink' : 'border-transparent text-ink-2 hover:text-ink')}>{t.label}</button>
        ))}
      </nav>
      <div className="flex-1 overflow-y-auto">
        {tab === 'plan' && <PlanTab />}
        {tab === 'buildings' && <BuildingsTab />}
        {tab === 'landscape' && <LandscapeTab />}
        {tab === 'sustain' && <Dashboard />}
        {tab === 'phases' && <PhasesTab />}
      </div>
    </aside>
  )
}
