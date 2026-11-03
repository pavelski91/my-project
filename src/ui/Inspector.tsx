import { useStore } from '../store'
import { CATALOG, FEATURE_NOTES } from '../data/catalog'
import { LAYOUTS } from '../data/layouts'
import { HOUSE_EXISTING, HOUSE_EXTENSION, HOUSE_BAY, TERRACE, SECOND_DWELLING, SHED_EXISTING, GROUND_FLOOR_LEFT, GROUND_FLOOR_RIGHT, ENTRANCE } from '../data/site'
import { terrainY } from '../lib/geometry'
import { rotateSelected, tryMove, useIssues, rectOf } from '../scene/Editing'
import { Btn, NumberField, Row, Section, Slider, Toggle, cx, fmt, useMetrics } from './kit'
import { useWalk } from '../scene/useWalk'

const Pill = ({ children, tone }: { children: React.ReactNode; tone: 'existing' | 'planned' | 'proposed' }) => (
  <span className={cx('rounded-full border px-2 py-[1px] text-[10px] font-medium', tone === 'existing' ? 'border-ink/30 bg-ink text-white' : tone === 'planned' ? 'border-timber bg-timber/15 text-[#7a5430]' : 'border-sage bg-sage/15 text-sage-d')}>{children}</span>
)

function Notes({ materials, notes }: { materials?: string[]; notes?: string[] }) {
  return (
    <>
      {!!materials?.length && (
        <Section title="Materials">
          <ul className="list-disc space-y-1 pl-4 text-[12px] leading-snug">{materials.map((m) => <li key={m}>{m}</li>)}</ul>
        </Section>
      )}
      {!!notes?.length && (
        <Section title="Notes">
          <ul className="list-disc space-y-1 pl-4 text-[12px] leading-snug text-ink-2">{notes.map((m) => <li key={m}>{m}</li>)}</ul>
        </Section>
      )}
    </>
  )
}

function Overview() {
  const m = useMetrics()
  const phase = useStore((s) => s.phase)
  const layout = useStore((s) => s.layout)
  return (
    <>
      <Section title="Project">
        <p className="font-serif text-[16px] leading-snug">Narewka — Japandi Forest Sanctuary</p>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-2">Narewka, ul. Adama Mickiewicza 1 (Podlasie), działka 420. {fmt(m.plotArea, 0)} m² traced from the survey plan; house on the west side with road access to the north.</p>
      </Section>
      <Section title="At a glance">
        <Row label="Option">{layout.name}</Row>
        <Row label="Phase">{phase}</Row>
        <Row label="Built footprint">{fmt(m.builtTotal, 0)} m²</Row>
        <Row label="Boardwalk">{phase >= 2 ? `${fmt(m.boardwalkLength, 1)} m` : '—'}</Row>
        <Row label="Trees / shrubs">{m.trees} / {m.shrubs}</Row>
        <Row label="Roof water / yr">{fmt(m.rainYieldM3, 0)} m³</Row>
      </Section>
      <Section title="How to explore">
        <ul className="list-disc space-y-1 pl-4 text-[12px] leading-snug text-ink-2">
          <li>Click a building, the boardwalk or a feature to inspect it.</li>
          <li>Use the bottom bar for aerial, isometric, plan, eye-level and boardwalk-tour views.</li>
          <li>Switch to <b>Edit</b> to drag pavilions, rotate with R, resize, and reshape the boardwalk.</li>
          <li>Eye-level: drag to look, W A S D / arrows to walk, Shift to run.</li>
        </ul>
      </Section>
    </>
  )
}

function Fixed({ id }: { id: string }) {
  const c = CATALOG[id]
  const dims: Record<string, { box: { x0: number; z0: number; x1: number; z1: number }; level?: string }> = {
    house: { box: HOUSE_EXISTING, level: `${GROUND_FLOOR_LEFT.toFixed(2)} m a.s.l. (floor)` },
    extension: { box: HOUSE_EXTENSION, level: `${GROUND_FLOOR_LEFT.toFixed(2)} m a.s.l. (floor)` },
    bay: { box: HOUSE_BAY, level: `${GROUND_FLOOR_LEFT.toFixed(2)} m a.s.l. (floor)` },
    terrace: { box: TERRACE, level: `${(GROUND_FLOOR_LEFT - 0.04).toFixed(2)} m a.s.l. (deck)` },
    shed: { box: SHED_EXISTING },
    second: { box: SECOND_DWELLING, level: `${GROUND_FLOOR_RIGHT.toFixed(2)} m a.s.l. (plan p.p.p.)` },
  }
  const d = dims[id]
  return (
    <>
      <Header title={c.title} sub={c.subtitle} status={c.status} phase={c.phase} />
      <Section title="Description"><p className="text-[12.5px] leading-relaxed">{c.description}</p></Section>
      {d && (
        <Section title="Dimensions & position">
          <Row label="Footprint">{(d.box.x1 - d.box.x0).toFixed(1)} × {(d.box.z1 - d.box.z0).toFixed(1)} m</Row>
          <Row label="Area">{fmt((d.box.x1 - d.box.x0) * (d.box.z1 - d.box.z0), 1)} m²</Row>
          <Row label="Centre (E, S from corner A)">{((d.box.x0 + d.box.x1) / 2).toFixed(1)}, {((d.box.z0 + d.box.z1) / 2).toFixed(1)} m</Row>
          {d.level && <Row label="Level">{d.level}</Row>}
          <Row label="Edit">fixed — taken from the plan</Row>
        </Section>
      )}
      <Notes materials={c.materials} notes={c.notes} />
    </>
  )
}

function Header({ title, sub, status, phase }: { title: string; sub: string; status: 'existing' | 'planned' | 'proposed'; phase: number }) {
  const select = useStore((s) => s.select)
  return (
    <div className="border-b border-line px-4 pb-3 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5"><Pill tone={status}>{status}</Pill><span className="text-[11px] text-ink-2">Phase {phase}</span></div>
        <button className="text-[11px] text-ink-2 hover:text-ink" onClick={() => select(null)}>✕ clear</button>
      </div>
      <h2 className="mt-1.5 font-serif text-[19px] leading-tight">{title}</h2>
      <p className="mt-0.5 text-[12px] text-ink-2">{sub}</p>
    </div>
  )
}

function IssuesFor({ id }: { id: string }) {
  const issues = useIssues().filter((i) => i.ids.includes(id))
  if (!issues.length) return null
  return (
    <Section title="Flags">
      <ul className="space-y-1.5">
        {issues.map((i) => (
          <li key={i.id} className="flex gap-2 text-[12px] leading-snug">
            <i className={cx('mt-[5px] h-2 w-2 shrink-0 rounded-full', i.severity === 'error' ? 'bg-[#c0392b]' : i.severity === 'warn' ? 'bg-[#d89a3a]' : 'bg-ink-2/50')} />
            {i.text}
          </li>
        ))}
      </ul>
    </Section>
  )
}

function Transform({ id }: { id: string }) {
  const edit = useStore((s) => s.editMode)
  const setEdit = useStore((s) => s.setEdit)
  const layout = useStore((s) => s.layout)
  const patchS = useStore((s) => s.patchStructure)
  const patchF = useStore((s) => s.patchFeature)
  const optionId = useStore((s) => s.optionId)
  const s = layout.structures.find((q) => q.id === id)
  const f = layout.features.find((q) => q.id === id)
  const o = s ?? f
  if (!o) return null
  const patch = (p: Partial<typeof o>) => (s ? patchS(id, p as never) : patchF(id, p as never))
  const def = (s ? LAYOUTS[optionId].structures.find((q) => q.id === id) : LAYOUTS[optionId].features.find((q) => q.id === id)) as typeof o | undefined
  const wLim = s?.wLim ?? [Math.max(0.6, o.w * 0.5), o.w * 2]
  const dLim = s?.dLim ?? [Math.max(0.6, o.d * 0.5), o.d * 2]
  return (
    <Section
      title="Position, rotation & size"
      right={!edit ? <Btn className="!py-0.5 !text-[11px]" tone="sage" onClick={() => setEdit(true)}>Enable edit</Btn> : undefined}
    >
      <div className={cx('space-y-1.5', !edit && 'pointer-events-none opacity-50')}>
        <NumberField label="East (x)" value={o.x} onChange={(v) => tryMove(id, v, o.z)} />
        <NumberField label="South (z)" value={o.z} onChange={(v) => tryMove(id, o.x, v)} />
        <Slider label="Rotation" value={o.rot} min={-180} max={180} step={1} digits={0} unit="°" onChange={(v) => rotateSelected(id, v - o.rot)} />
        <div className="flex gap-1.5">
          <Btn className="flex-1 !py-1" onClick={() => rotateSelected(id, -15)}>↺ 15°</Btn>
          <Btn className="flex-1 !py-1" onClick={() => rotateSelected(id, 15)}>↻ 15°</Btn>
          <Btn className="flex-1 !py-1" onClick={() => rotateSelected(id, 180)}>Flip</Btn>
        </div>
        <Slider label={s?.kind === 'wellness' ? 'Length (along x)' : 'Width (local x)'} value={o.w} min={wLim[0]} max={wLim[1]} step={0.1} unit=" m" onChange={(v) => patch({ w: v } as never)} />
        <Slider label="Depth (local z)" value={o.d} min={dLim[0]} max={dLim[1]} step={0.1} unit=" m" onChange={(v) => patch({ d: v } as never)} />
        <Row label="Footprint">{fmt(o.w * o.d, 1)} m²</Row>
        {def && <Btn className="w-full" onClick={() => patch({ x: def.x, z: def.z, rot: def.rot, w: def.w, d: def.d } as never)}>Reset this object</Btn>}
      </div>
    </Section>
  )
}

export function Inspector() {
  const selected = useStore((s) => s.selected)
  const layout = useStore((s) => s.layout)
  const patchF = useStore((s) => s.patchFeature)
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const selWp = useStore((s) => s.selectedWp)
  const selectWp = useStore((s) => s.selectWp)
  const addWp = useStore((s) => s.addWaypoint)
  const removeWp = useStore((s) => s.removeWaypoint)
  const moveWp = useStore((s) => s.moveWaypoint)
  const edit = useStore((s) => s.editMode)
  const setEdit = useStore((s) => s.setEdit)
  const { samples, length } = useWalk()
  const m = useMetrics()
  const struct = layout.structures.find((s) => s.id === selected)
  const feat = layout.features.find((f) => f.id === selected)

  let body: React.ReactNode = <Overview />
  if (selected && CATALOG[selected] && ['house', 'extension', 'bay', 'terrace', 'shed', 'second'].includes(selected)) body = <Fixed id={selected} />
  else if (struct) {
    const c = CATALOG[struct.kind]
    const g = terrainY(struct.x, struct.z)
    body = (
      <>
        <Header title={struct.label} sub={c.subtitle} status="proposed" phase={struct.phase} />
        <IssuesFor id={struct.id} />
        <Transform id={struct.id} />
        <Section title="Description"><p className="text-[12.5px] leading-relaxed">{c.description}</p></Section>
        <Section title="Data">
          <Row label="Ground level here">{(g + 145).toFixed(2)} m a.s.l.</Row>
          <Row label="Boundary setback used">{struct.setback.toFixed(1)} m <span className="text-ink-2">(verify)</span></Row>
          <Row label="Entrance side">local north (−z)</Row>
          <Row label="Glazed view side">local south (+z)</Row>
        </Section>
        <Notes materials={c.materials} notes={c.notes} />
      </>
    )
  } else if (feat) {
    const n = FEATURE_NOTES[feat.kind]
    body = (
      <>
        <Header title={feat.label} sub={n?.title ?? feat.kind} status="proposed" phase={feat.phase} />
        <Section title="Feature">
          <Toggle label="Included in the plan" checked={feat.enabled} onChange={(v) => patchF(feat.id, { enabled: v })} />
        </Section>
        <IssuesFor id={feat.id} />
        <Transform id={feat.id} />
        <Notes notes={n?.notes} />
      </>
    )
  } else if (selected === 'boardwalk') {
    const c = CATALOG.boardwalk
    body = (
      <>
        <Header title={c.title} sub={c.subtitle} status="proposed" phase={2} />
        <IssuesFor id="boardwalk" />
        <Section title="Route">
          <Row label="Length">{fmt(length, 1)} m</Row>
          <Row label="Steepest gradient">{fmt(m.boardwalkGrade * 100, 1)} %</Row>
          <Row label="Deck height above ground">{fmt(Math.min(...samples.map((p) => p.y - terrainY(p.x, p.z))), 2)} – {fmt(Math.max(...samples.map((p) => p.y - terrainY(p.x, p.z))), 2)} m</Row>
          <Slider label="Width" value={layout.boardwalkWidth} min={1.0} max={1.4} step={0.05} unit=" m" digits={2} onChange={(v) => setSettings({ boardwalkWidth: v })} />
          <div className="mt-1 flex gap-1.5">
            <Btn className="flex-1" active={edit} onClick={() => setEdit(!edit)}>{edit ? 'Editing waypoints' : 'Edit route'}</Btn>
            <Btn className="flex-1" disabled={!edit} onClick={addWp}>+ Waypoint</Btn>
            <Btn className="flex-1" disabled={!edit || selWp === null} onClick={() => selWp !== null && removeWp(selWp)}>Remove</Btn>
          </div>
          <div className="mt-2 max-h-[200px] space-y-1 overflow-auto">
            {layout.boardwalk.map(([x, z], i) => (
              <div key={i} onClick={() => selectWp(i)} className={cx('flex cursor-pointer items-center justify-between rounded border px-2 py-1 text-[11.5px]', selWp === i ? 'border-sage-d bg-card' : 'border-line')}>
                <span className="text-ink-2">{i === 0 ? 'Start · terrace' : i === layout.boardwalk.length - 1 ? 'End' : `Waypoint ${i}`}</span>
                <span className="tabular-nums">{x.toFixed(1)}, {z.toFixed(1)}</span>
              </div>
            ))}
          </div>
          {selWp !== null && edit && (
            <div className="mt-2 space-y-1.5">
              <NumberField label="East (x)" value={layout.boardwalk[selWp][0]} onChange={(v) => moveWp(selWp, [v, layout.boardwalk[selWp][1]])} />
              <NumberField label="South (z)" value={layout.boardwalk[selWp][1]} onChange={(v) => moveWp(selWp, [layout.boardwalk[selWp][0], v])} />
            </div>
          )}
        </Section>
        <Section title="Description"><p className="text-[12.5px] leading-relaxed">{c.description}</p></Section>
        <Notes materials={c.materials} notes={c.notes} />
      </>
    )
  } else if (selected === 'fence') {
    const c = CATALOG.fence
    body = (
      <>
        <Header title={c.title} sub={c.subtitle} status="proposed" phase={2} />
        <Section title="Entrance"><Row label="Vehicle gate">{ENTRANCE.gate.width.toFixed(1)} m sliding</Row><Row label="Pedestrian gate">1.0 m</Row><Row label="Service wicket">south fence</Row><Row label="Bin store">{ENTRANCE.waste.w} × {ENTRANCE.waste.d} m</Row></Section>
        <Section title="Description"><p className="text-[12.5px] leading-relaxed">{c.description}</p></Section>
        <Notes materials={c.materials} notes={c.notes} />
      </>
    )
  }
  void rectOf
  return (
    <aside className="flex h-full w-[322px] shrink-0 flex-col border-l border-line bg-paper">
      <div className="border-b border-line px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-2">Inspector</div>
      <div className="flex-1 overflow-y-auto">{body}</div>
    </aside>
  )
}
