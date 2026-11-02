import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store'
import { RECOMMENDED } from '../data/layouts'
import { VERIFY_ITEMS, SITE_FACTS } from '../data/site'
import { ZONE_INFO } from '../data/catalog'
import { SPECIES, MEADOW_FLOWERS } from '../data/species'
import { CRITERIA, evaluateOption, scoreOptions, type CriterionId, type OptionResult } from '../lib/compare'
import { Bar, Btn, Modal, Slider, fmt, cx, useMetrics } from './kit'

/* ------------------------------------------------------------------ compare */
const DEFAULT_W: Record<CriterionId, number> = { ecology: 1.2, water: 0.8, journey: 1.5, compact: 0.7, solar: 0.8, comfort: 1.2 }

let cache: OptionResult[] | null = null

export function ComparePanel() {
  const open = useStore((s) => s.panel.compare)
  const openPanel = useStore((s) => s.openPanel)
  const setOption = useStore((s) => s.setOption)
  const current = useStore((s) => s.optionId)
  const years = useStore((s) => s.settings.growthYears)
  const [rs, setRs] = useState<OptionResult[] | null>(cache)
  const [w, setW] = useState(DEFAULT_W)
  useEffect(() => {
    if (!open || cache) return
    const id = setTimeout(() => {
      cache = (['A', 'B', 'C'] as const).map((i) => evaluateOption(i, years))
      setRs(cache)
    }, 40)
    return () => clearTimeout(id)
  }, [open, years])
  const scores = useMemo(() => (rs ? scoreOptions(rs, w) : null), [rs, w])
  if (!open) return null
  const best = scores ? scores.reduce((bi, s, i, a) => (s.total > a[bi].total ? i : bi), 0) : 0
  return (
    <Modal wide title="Option comparison" sub="Three site configurations evaluated on the same geometry, planting generator and solar model." onClose={() => openPanel('compare', false)}>
      {!rs || !scores ? (
        <div className="p-10 text-center text-[13px] text-ink-2">Evaluating the three layouts…</div>
      ) : (
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
          <div>
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="py-2 pr-3 font-medium text-ink-2">Metric</th>
                  {rs.map((r) => (
                    <th key={r.id} className="px-2 py-2 align-top">
                      <div className="font-serif text-[15px]">{r.id} — {r.layout.name}</div>
                      {r.id === RECOMMENDED && <span className="mt-0.5 inline-block rounded-full bg-sage-d px-2 py-[1px] text-[10px] font-semibold text-white">Recommended</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="[&_td]:px-2 [&_td]:py-1.5 [&_tr]:border-b [&_tr]:border-line/70">
                {([
                  ['Boardwalk length', (r: OptionResult) => `${fmt(r.boardwalk, 0)} m`],
                  ['Office / wellness area', (r) => `${fmt(r.office, 1)} / ${fmt(r.wellness, 1)} m²`],
                  ['Built footprint', (r) => `${fmt(r.m.builtTotal, 0)} m²`],
                  ['Decks & boardwalk', (r) => `${fmt(r.m.decks, 0)} m²`],
                  ['Biologically active', (r) => `${fmt((r.m.biologicallyActive / r.m.plotArea) * 100, 1)} %`],
                  ['Trees / shrubs', (r) => `${r.m.trees} / ${r.m.shrubs}`],
                  ['Native share (woody)', (r) => `${fmt(r.m.nativeShare * 100, 0)} %`],
                  ['Roof water per year', (r) => `${fmt(r.m.rainYieldM3, 0)} m³`],
                  ['Edible growing (intensive + zones)', (r) => `${fmt(r.m.edibleIntensive, 0)} + ${fmt(r.m.edibleZones, 0)} m²`],
                  ['Greenhouse sun Dec / Mar / Jun', (r) => (r.solar ? r.solar.map((s) => fmt(s.hours, 1)).join(' / ') + ' h' : '—')],
                  ['Distance house → pavilions (sum)', (r) => `${fmt(r.service, 0)} m`],
                  ['Flags: errors / warnings / notes', (r) => `${r.errors} / ${r.warnings} / ${r.infos}`],
                ] as [string, (r: OptionResult) => string][]).map(([label, f]) => (
                  <tr key={label}><td className="text-ink-2">{label}</td>{rs.map((r) => <td key={r.id} className="tabular-nums">{f(r)}</td>)}</tr>
                ))}
                <tr className="border-t-2 border-line"><td className="pt-3 font-medium">Weighted score</td>
                  {scores.map((s, i) => (
                    <td key={i} className="pt-3"><div className="flex items-center gap-2"><b className="tabular-nums">{(s.total * 100).toFixed(0)}</b><div className="flex-1"><Bar value={s.total} max={1} color={i === best ? '#5d7150' : '#b9b3a2'} /></div></div></td>
                  ))}
                </tr>
                {CRITERIA.map((c) => (
                  <tr key={c.id}><td className="text-ink-2" title={c.desc}>{c.label}</td>{scores.map((s, i) => <td key={i}><Bar value={s[c.id]} max={1} color="#7c8f6b" /></td>)}</tr>
                ))}
              </tbody>
            </table>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {rs.map((r) => (
                <div key={r.id} className="rounded-lg border border-line bg-card p-3">
                  <div className="font-serif text-[14px]">{r.id} — {r.layout.name}</div>
                  <p className="mt-1 text-[11.5px] leading-snug text-ink-2">{r.layout.tagline}</p>
                  <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[11.5px] leading-snug">{r.layout.pros.map((p) => <li key={p}>{p}</li>)}</ul>
                  <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[11.5px] leading-snug text-clay">{r.layout.cons.map((p) => <li key={p}>{p}</li>)}</ul>
                  <Btn className="mt-3 w-full" active={current === r.id} onClick={() => { setOption(r.id); openPanel('compare', false) }}>{current === r.id ? 'Showing' : 'Show this option'}</Btn>
                </div>
              ))}
            </div>
          </div>
          <aside>
            <div className="rounded-xl border border-sage-d/40 bg-sage/10 p-4">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-sage-d">Recommendation</div>
              <p className="mt-1 font-serif text-[18px] leading-tight">Option {rs[best].id} — {rs[best].layout.name}</p>
              <p className="mt-2 text-[12.5px] leading-relaxed">
                {rs[best].id === 'A'
                  ? 'Forest Retreat best fits the brief: it gives the longest boardwalk journey, keeps full-size office and wellness pavilions and hides the buildings in planting. It trades some compactness (longer service runs) and a cooler office position for atmosphere and privacy.'
                  : rs[best].id === 'B'
                    ? 'Japandi Courtyard uses the whole plot: three pavilions frame a sheltered court in the centre-east (the land the plan reserved for a second house), the greenhouse gets the best spring sun, and water runs downhill to the pond. It trades longer service runs for the strongest composition and the largest edible area.'
                    : 'Regenerative Sanctuary delivers the highest ecological performance but squeezes the pavilions below the sizes in the brief.'}
              </p>
              <p className="mt-2 text-[11.5px] leading-snug text-ink-2">Margins are small: with equal weights the order is the same, and only an ecology-first weighting turns C into the winner. The scores are relative (best = 100 % per criterion) — not absolute performance.</p>
            </div>
            <h4 className="mb-1 mt-5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-2">Weights — try your own priorities</h4>
            {CRITERIA.map((c) => <Slider key={c.id} label={c.label} value={w[c.id]} min={0} max={2} step={0.1} onChange={(v) => setW({ ...w, [c.id]: v })} digits={1} />)}
            <Btn className="mt-2 w-full" onClick={() => setW(DEFAULT_W)}>Reset to brief priorities</Btn>
            <p className="mt-3 text-[11px] leading-snug text-ink-2">Default weights follow the brief's priority order (house → boardwalk → office → gym/sauna → bania → greenhouse → biodiversity), with ecology kept high because of the regenerative goal.</p>
          </aside>
        </div>
      )}
    </Modal>
  )
}

/* ---------------------------------------------------------------- strategy */
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

export function StrategyPanel() {
  const open = useStore((s) => s.panel.plants)
  const openPanel = useStore((s) => s.openPanel)
  const layout = useStore((s) => s.layout)
  const m = useMetrics()
  if (!open) return null
  const species = Object.values(SPECIES).filter((s) => m.bySpecies[s.id])
  return (
    <Modal wide title="Planting & biodiversity strategy" sub={`Option ${layout.id} — ${layout.name}. Frost-hardy (≈ USDA 5b–6a), locally appropriate species; soil and wetness are NOT assumed — see verification items.`} onClose={() => openPanel('plants', false)}>
      <div className="grid gap-8 p-6 lg:grid-cols-2">
        <div>
          <h3 className="font-serif text-[16px]">Layers & zones</h3>
          <div className="mt-2 space-y-3">
            {Object.entries(ZONE_INFO).map(([k, z]) => (
              <div key={k} className="flex gap-3">
                <i className="mt-1 h-3.5 w-3.5 shrink-0 rounded-sm" style={{ background: z.color }} />
                <div><div className="text-[13px] font-medium">{z.name} <span className="font-normal text-ink-2">· {fmt(m.area[k] || 0, 0)} m²</span></div><p className="text-[12px] leading-snug text-ink-2">{z.desc}</p></div>
              </div>
            ))}
          </div>
          <h3 className="mt-6 font-serif text-[16px]">Biodiversity measures</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[12.5px] leading-snug">
            <li><b>Layered vegetation:</b> canopy (pine, birch) → sub-canopy (rowan, bird cherry) → shrub (hazel, guelder rose) → herb/moss.</li>
            <li><b>Deadwood:</b> standing snags and log piles in habitat features; fallen birch left in the woodland.</li>
            <li><b>Insects:</b> unmown meadow strips through winter, bee hotels, bare sunny soil patches, no pesticides.</li>
            <li><b>Birds & mammals:</b> thorny hedgerows, nest boxes (design allowance ≈ 6), 13 cm fence gaps, a hibernaculum stone pile.</li>
            <li><b>Water:</b> shallow-edged wildlife pond (no fish), rain garden and wet meadow; permeable boardwalk and stepping stones only.</li>
            <li><b>Lighting:</b> low, warm, shielded path lights (2200 K), off after 22:00 to protect bats and moths.</li>
          </ul>
          <h3 className="mt-6 font-serif text-[16px]">Soil regeneration & water</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[12.5px] leading-snug">
            <li>No-dig beds, wood-chip and leaf-mould mulch, compost made on site; minimal soil disturbance — buildings and boardwalk are on screw piles.</li>
            <li>Rain tanks on the house roof; overflow runs to the rain garden. Greenhouse barrel for irrigation.</li>
            <li>Soil on the plan is brown soil with pasture class V ({SITE_FACTS.soilClass.split('—')[0]}). pH, drainage and groundwater are unknown — test before planting bilberry/blueberry (need acidic soil) or the pond.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-serif text-[16px]">Seasonal flowering sequence</h3>
          <div className="mt-2 rounded-lg border border-line bg-card p-3">
            <div className="mb-1 flex pl-[148px] text-[10px] text-ink-2">{MONTHS.map((mm, i) => <span key={i} className="w-[22px] text-center">{mm}</span>)}</div>
            {[
              ...MEADOW_FLOWERS.map((f) => ({ name: f.name, color: f.color, a: f.bloom[0], b: f.bloom[1] })),
              { name: 'Hazel catkins', color: '#c9b46a', a: 2, b: 3 }, { name: 'Bird cherry', color: '#f1ece0', a: 5, b: 5 }, { name: 'Apple / plum blossom', color: '#eac4d0', a: 4, b: 5 },
              { name: 'Rowan berries', color: '#c8442b', a: 8, b: 11 }, { name: 'Autumn colour', color: '#d89a3a', a: 10, b: 10 },
            ].map((f) => (
              <div key={f.name} className="flex items-center py-[1.5px] text-[11.5px]">
                <span className="w-[148px] truncate text-ink-2">{f.name}</span>
                <span className="relative h-3 w-[264px] rounded-sm bg-paper-2"><i className="absolute top-0 h-3 rounded-sm" style={{ left: (f.a - 1) * 22, width: (f.b - f.a + 1) * 22, background: f.color, border: '1px solid rgba(0,0,0,.15)' }} /></span>
              </div>
            ))}
          </div>
          <h3 className="mt-6 font-serif text-[16px]">Species palette in this plan</h3>
          <div className="mt-2 overflow-hidden rounded-lg border border-line">
            <table className="w-full text-[12px]">
              <thead className="bg-paper-2 text-left text-ink-2"><tr><th className="px-2 py-1.5">Species</th><th>Origin</th><th className="text-right">Count</th></tr></thead>
              <tbody>
                {species.map((s) => (
                  <tr key={s.id} className="border-t border-line align-top" title={s.role}>
                    <td className="px-2 py-1"><div className="font-medium">{s.name}</div><div className="italic text-ink-2">{s.latin}</div></td>
                    <td className="py-1"><span className={cx('rounded-full px-1.5 py-[1px] text-[10.5px]', s.native ? 'bg-sage/20 text-sage-d' : 'bg-timber/20 text-[#7a5430]')}>{s.native ? 'native' : 'cultivar'}</span></td>
                    <td className="pr-2 text-right tabular-nums">{m.bySpecies[s.id]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="mt-6 font-serif text-[16px]">Care calendar</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[12.5px] leading-snug">
            <li><b>Mar–Apr:</b> prune fruit trees, coppice hazel, sow annual meadow gaps.</li>
            <li><b>Jun & Sep:</b> cut meadow (two cuts), remove clippings.</li>
            <li><b>Autumn:</b> leave leaves under shrubs; add compost mulch; plant bare-root trees.</li>
            <li><b>Winter:</b> leave seed heads; clear snow from boardwalk and gates only.</li>
          </ul>
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ verify */
export function VerifyPanel() {
  const open = useStore((s) => s.panel.verify)
  const openPanel = useStore((s) => s.openPanel)
  if (!open) return null
  return (
    <Modal title="Verification items & assumptions" sub="What the documents do not tell us — nothing below has been assumed as fact." onClose={() => openPanel('verify', false)}>
      <div className="space-y-3 p-6">
        {VERIFY_ITEMS.map((v, i) => (
          <div key={v.id} className="flex gap-3 rounded-lg border border-line bg-card p-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-clay/15 text-[12px] font-semibold text-clay">{i + 1}</span>
            <div><div className="text-[13.5px] font-medium">{v.title}</div><p className="mt-0.5 text-[12.5px] leading-snug text-ink-2">{v.detail}</p></div>
          </div>
        ))}
        <div className="rounded-lg border border-dashed border-line p-3 text-[12px] leading-relaxed text-ink-2">
          <b>Site facts read from the survey:</b> {SITE_FACTS.soilClass}. {SITE_FACTS.neighbours}. {SITE_FACTS.buildingLine} {SITE_FACTS.climate}
        </div>
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------------- help */
export function HelpPanel() {
  const open = useStore((s) => s.panel.help)
  const openPanel = useStore((s) => s.openPanel)
  if (!open) return null
  const K = ({ children }: { children: React.ReactNode }) => <kbd className="rounded border border-line bg-card px-1.5 py-[1px] text-[11px]">{children}</kbd>
  return (
    <Modal title="Controls" onClose={() => openPanel('help', false)}>
      <div className="grid gap-6 p-6 text-[12.5px] leading-relaxed md:grid-cols-2">
        <div>
          <h4 className="mb-1 font-medium">Camera</h4>
          <p>Orbit: left-drag · Pan: right-drag · Zoom: wheel. Plan view: drag to pan.</p>
          <p className="mt-1">Eye level: drag to look, <K>W</K><K>A</K><K>S</K><K>D</K> or arrows to walk, <K>Shift</K> to run, wheel to step.</p>
          <p className="mt-1">Boardwalk tour plays House → Office → Gym &amp; Sauna → Bania, pausing at each pavilion.</p>
          <h4 className="mb-1 mt-4 font-medium">Scene</h4>
          <p>Day/night, solar time slider and seasons change light, foliage, snow and lamps. Layers can be switched from the bottom bar and the Landscape tab.</p>
        </div>
        <div>
          <h4 className="mb-1 font-medium">Edit mode</h4>
          <p>Select a pavilion or feature and drag it on the ground. It cannot leave the boundary; overlaps are outlined red/amber and listed under Plan → Checks.</p>
          <p className="mt-1"><K>R</K> rotates 15° (<K>Shift</K>+<K>R</K> the other way) · <K>Alt</K>+arrows nudge · <K>Esc</K> deselects.</p>
          <p className="mt-1">Select the boardwalk and drag its round handles; use "+ Waypoint" in the inspector to add bends.</p>
          <h4 className="mb-1 mt-4 font-medium">Files</h4>
          <p>Save / Load stores the whole editable configuration as JSON. Screenshot exports the current view as PNG (2× for large prints). The Site plan can be exported as SVG or PNG.</p>
        </div>
      </div>
    </Modal>
  )
}
