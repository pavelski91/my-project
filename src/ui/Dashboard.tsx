import { useStore } from '../store'
import { PLAN_BALANCE, PLOT_AREA_STATED } from '../data/site'
import { ASSUMPTIONS, zoneLabel } from '../lib/analysis'
import { SPECIES } from '../data/species'
import { Bar, Row, Section, useMetrics, useSolar, fmt, NumberField } from './kit'

const CLASS_COLORS: Record<string, string> = {
  building: '#3b3f40', deck: '#8a6f52', paved: '#9a9890', stone: '#b4b0a4', grass: '#a7b873', meadow: '#d4c46e', woodland: '#587046',
  screen: '#6e8350', foodforest: '#8d9a52', berries: '#8d7a4c', kitchen: '#7a6246', shade: '#4c6b46', wetland: '#4f7867', water: '#3f6f78',
  raingarden: '#6b9a8a', beds: '#8a5f3e', compost: '#5a4430',
}

const Unknown = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded border border-dashed border-clay/60 px-1.5 py-[1px] text-[11px] font-medium text-clay">{children}</span>
)

export function Dashboard() {
  const m = useMetrics()
  const solar = useSolar()
  const phase = useStore((s) => s.phase)
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const optionId = useStore((s) => s.optionId)
  const total = m.plotArea
  const classes = Object.entries(m.area).sort((a, b) => b[1] - a[1])
  const bioPct = (m.biologicallyActive / total) * 100
  const topSpecies = Object.entries(m.bySpecies).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const builtOver = m.builtTotal > PLAN_BALANCE.built

  return (
    <div>
      <div className="border-b border-line bg-paper-2/60 px-4 py-3 text-[11.5px] leading-snug text-ink-2">
        All figures are computed from the current model geometry (Option {optionId}, phase {phase}). Raster resolution {ASSUMPTIONS.gridStep} m, normalised to the surveyed {fmt(m.plotArea, 1)} m² polygon (plan states {PLOT_AREA_STATED} m²). Unknowns are marked, not guessed.
      </div>

      <Section title="Land balance vs. development plan">
        <Row label="Plot area">{fmt(total, 0)} m²</Row>
        <Row label="Built footprint" hint="Dwelling(s) + pavilions + small sheds + tanks (bania deck excluded)">
          <span className={builtOver ? 'text-clay' : ''}>{fmt(m.builtTotal, 0)} m²</span> <span className="text-ink-2">({fmt((m.builtTotal / total) * 100, 1)} %)</span>
        </Row>
        <div className="mb-1 text-[11px] text-ink-2">Plan "Bilans terenu": {PLAN_BALANCE.built} m² for two dwellings ({PLAN_BALANCE.builtPct} %). {builtOver && <b className="text-clay">Additional pavilions exceed it — legal route to verify.</b>}</div>
        <Row label="Paved (apron, bin store)">{fmt(m.paved, 0)} m² <span className="text-ink-2">/ plan {PLAN_BALANCE.paved}</span></Row>
        <Row label="Timber decks & boardwalk" hint="Raised on piles with open joints; the ground below stays permeable">{fmt(m.decks, 0)} m²</Row>
        <Row label="Permeable surface" hint="Plot − built − paved. Decks are counted as permeable (open joints, raised).">{fmt(m.permeable, 0)} m² <span className="text-ink-2">({fmt((m.permeable / total) * 100, 1)} %)</span></Row>
        <Row label="Vegetated area">{fmt(m.vegetated, 0)} m²</Row>
        <Row label="Biologically active" hint="Vegetated + pond. The plan lists 88.15 % (1250 m²).">
          <span className={bioPct < PLAN_BALANCE.biologicallyActivePct ? 'text-clay' : ''}>{fmt(bioPct, 1)} %</span> <span className="text-ink-2">/ plan {PLAN_BALANCE.biologicallyActivePct} %</span>
        </Row>
        {bioPct < PLAN_BALANCE.biologicallyActivePct && (
          <p className="mt-1 text-[11px] leading-snug text-clay">Below the plan's biologically-active share — mainly because the pavilions, decks and boardwalk are additional to the plan. Check the local plan's minimum before filing.</p>
        )}
        <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full border border-line">
          {classes.map(([k, v]) => <div key={k} title={`${zoneLabel(k)}: ${fmt(v, 0)} m²`} style={{ width: `${(v / total) * 100}%`, background: CLASS_COLORS[k] ?? '#999' }} />)}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-ink-2">
          {classes.map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 shrink-0 rounded-sm" style={{ background: CLASS_COLORS[k] ?? '#999' }} />{zoneLabel(k)} <span className="ml-auto tabular-nums text-ink">{fmt(v, 0)}</span></div>
          ))}
        </div>
      </Section>

      <Section title="Boardwalk">
        {phase < 2 ? <p className="text-[12px] text-ink-2">Appears in Phase 2.</p> : (
          <>
            <Row label="Length">{fmt(m.boardwalkLength, 1)} m</Row>
            <Row label="Width × footprint">{fmt(useStore.getState().layout.boardwalkWidth, 1)} m · {fmt(m.boardwalkArea, 0)} m²</Row>
            <Row label="Steepest gradient" hint="Computed from the elevated deck line; target ≤ 8.3 % (1:12)">
              <span className={m.boardwalkGrade > 0.0835 ? 'text-clay' : ''}>{fmt(m.boardwalkGrade * 100, 1)} %</span>
            </Row>
            <p className="mt-1 text-[11px] leading-snug text-ink-2">Deck rides on piles taller downhill. Flat landings at the doors; a 1.5 m turning space exists at each pavilion entrance.</p>
          </>
        )}
      </Section>

      <Section title="Rainwater harvesting potential">
        <Row label="Roof catchment (plan area + overhang)">{fmt(m.roofArea, 0)} m²</Row>
        <Row label="Annual precipitation (assumed)"><span className="inline-block w-[130px]"><NumberField label="" value={settings.precipMm} step={10} unit="mm" onChange={(v) => setSettings({ precipMm: Math.max(300, Math.min(1000, v)) })} /></span></Row>
        <Row label="Harvestable per year" hint={`catchment × rainfall × runoff ${ASSUMPTIONS.runoff} × filter ${ASSUMPTIONS.filter}`}><b>{fmt(m.rainYieldM3, 0)} m³</b></Row>
        <Row label="Tank storage">{fmt(m.tankLitres / 1000, 0)} m³ <span className="text-ink-2">({fmt((m.tankLitres / 1000 / Math.max(1, m.rainYieldM3)) * 100, 0)} % of yearly yield)</span></Row>
        <Row label="Garden water demand"><Unknown>unknown</Unknown></Row>
        <p className="mt-1 text-[11px] leading-snug text-ink-2">Sloped metal roofs, first-flush diverter assumed. Overflow feeds the rain garden. Rainfall is a placeholder — use IMGW data for the Narewka station.</p>
      </Section>

      <Section title="Biodiversity zones">
        {Object.entries(m.habitat).map(([k, v]) => (
          <div key={k} className="mb-1.5">
            <div className="flex justify-between text-[12px]"><span className="text-ink-2">{k}</span><span className="tabular-nums">{fmt(v, 0)} m²</span></div>
            <Bar value={v} max={Math.max(...Object.values(m.habitat), 1)} />
          </div>
        ))}
        <p className="mt-1 text-[11px] leading-snug text-ink-2">Habitat structures: log piles / deadwood snags, insect hotels, bird boxes and a hibernaculum are placed as features (see Landscape). Nest-box count is a design allowance, not a measured value.</p>
      </Section>

      <Section title="Planting">
        <Row label="Trees (canopy)">{m.trees}</Row>
        <Row label="Shrubs & hedging">{m.shrubs}</Row>
        <Row label="Native share of woody plants" hint="Count of woody plants that are native in NE Poland ÷ all woody plants. Cultivars/fruit trees count as non-native.">{fmt(m.nativeShare * 100, 0)} %</Row>
        <Row label="Edible plants (woody + berries)">{m.ediblePlants}</Row>
        <Row label="Intensive growing (beds + greenhouse)">{fmt(m.edibleIntensive, 0)} m²</Row>
        <Row label="Edible planting zones (food forest, berries, kitchen)">{fmt(m.edibleZones, 0)} m²</Row>
        <div className="mt-2 space-y-1">
          {topSpecies.map(([id, n]) => (
            <div key={id} className="flex items-center gap-2 text-[11.5px]">
              <span className="w-[130px] truncate text-ink-2">{SPECIES[id]?.name ?? id}</span>
              <div className="flex-1"><Bar value={n} max={topSpecies[0][1]} color={SPECIES[id]?.native ? '#7c8f6b' : '#b98a55'} /></div>
              <span className="w-6 text-right tabular-nums">{n}</span>
            </div>
          ))}
        </div>
        <p className="mt-1.5 flex items-center gap-3 text-[11px] text-ink-2"><span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-sm bg-sage" /> native</span><span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-sm bg-timber" /> cultivated / fruit</span></p>
        <p className="mt-1 text-[11px] leading-snug text-ink-2">Counts are for the finished scheme at planting density; the model shows trees at {settings.growthYears} years of growth.</p>
      </Section>

      <Section title="Greenhouse sun exposure">
        {solar ? (
          <>
            {solar.map((r) => (
              <div key={r.label} className="mb-1.5">
                <div className="flex justify-between text-[12px]"><span className="text-ink-2">{r.label}</span><span className="tabular-nums">{fmt(r.hours, 1)} h</span></div>
                <Bar value={r.hours} max={16} color="#d6a94a" />
              </div>
            ))}
            <p className="mt-1 text-[11px] leading-snug text-ink-2">Direct-sun hours at the south glazing, ray-cast against this site's buildings and tree crowns (leaf-on / leaf-off as appropriate). Neighbouring plots, terrain shading and cloud are not modelled.</p>
          </>
        ) : <p className="text-[12px] text-ink-2">No greenhouse in this option.</p>}
      </Section>

      <Section title="Not known — to verify">
        <div className="space-y-1.5 text-[12px]">
          <div className="flex justify-between"><span className="text-ink-2">Soil infiltration rate</span><Unknown>unknown</Unknown></div>
          <div className="flex justify-between"><span className="text-ink-2">Groundwater level</span><Unknown>unknown</Unknown></div>
          <div className="flex justify-between"><span className="text-ink-2">Soil pH / organic matter</span><Unknown>unknown</Unknown></div>
          <div className="flex justify-between"><span className="text-ink-2">Existing vegetation survey</span><Unknown>unknown</Unknown></div>
          <div className="flex justify-between"><span className="text-ink-2">Carbon / energy performance</span><Unknown>not modelled</Unknown></div>
        </div>
      </Section>
    </div>
  )
}
