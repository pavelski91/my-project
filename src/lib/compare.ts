import { LAYOUTS, cloneLayout, type Layout } from '../data/layouts'
import { computeMetrics, greenhouseSolar, type Metrics, type SolarResult } from './analysis'
import { generateVegetation } from './vegetation'
import { validateLayout } from './validate'
import { samplePath } from './geometry'

export interface OptionResult {
  id: 'A' | 'B' | 'C'
  layout: Layout
  m: Metrics
  solar: SolarResult[] | null
  errors: number
  warnings: number
  infos: number
  boardwalk: number
  service: number
  office: number
  wellness: number
}

export function evaluateOption(id: 'A' | 'B' | 'C', years = 15): OptionResult {
  const layout = cloneLayout(LAYOUTS[id])
  const veg = generateVegetation(layout, 5, true)
  const m = computeMetrics(layout, 5, true, veg)
  const g = 0.12 + 0.88 * (1 - Math.exp(-years / 11))
  const solar = greenhouseSolar(layout, 5, true, veg, g)
  const issues = validateLayout(layout, { releaseSecondDwelling: true, featureSetback: 1 }, 5)
  const bw = samplePath(layout.boardwalk, 0.5)
  // service-spine proxy: straight-line distance from the house terrace edge to every pavilion centre
  const service = layout.structures.reduce((a, s) => a + Math.hypot(s.x - 11, s.z - 20), 0)
  const o = layout.structures.find((s) => s.kind === 'office')!
  const w = layout.structures.find((s) => s.kind === 'wellness')!
  return {
    id, layout, m, solar,
    errors: issues.filter((i) => i.severity === 'error').length,
    warnings: issues.filter((i) => i.severity === 'warn').length,
    infos: issues.filter((i) => i.severity === 'info').length,
    boardwalk: bw.length, service, office: o.w * o.d, wellness: w.w * w.d,
  }
}

export const CRITERIA = [
  { id: 'ecology', label: 'Ecology', desc: 'Biologically active share, native planting share, habitat area', w: 1 },
  { id: 'water', label: 'Water & food', desc: 'Roof-water yield and edible growing area', w: 1 },
  { id: 'journey', label: 'Boardwalk journey', desc: 'Length of the house → office → wellness walk', w: 1 },
  { id: 'compact', label: 'Compactness', desc: 'Built footprint and service-run length (cheaper, less disturbance)', w: 1 },
  { id: 'solar', label: 'Greenhouse sun', desc: 'Direct-sun hours at the greenhouse in winter and spring', w: 1 },
  { id: 'comfort', label: 'Usable space', desc: 'Office + wellness floor area (less compromise on the brief)', w: 1 },
] as const
export type CriterionId = (typeof CRITERIA)[number]['id']

const norm = (vals: number[], higherBetter = true) => {
  const mn = Math.min(...vals), mx = Math.max(...vals)
  return vals.map((v) => (mx - mn < 1e-9 ? 0.5 : higherBetter ? (v - mn) / (mx - mn) : (mx - v) / (mx - mn)))
}

export function scoreOptions(rs: OptionResult[], weights: Record<CriterionId, number>) {
  const bio = norm(rs.map((r) => r.m.biologicallyActive / r.m.plotArea))
  const nat = norm(rs.map((r) => r.m.nativeShare))
  const hab = norm(rs.map((r) => Object.values(r.m.habitat).reduce((a, b) => a + b, 0)))
  const rain = norm(rs.map((r) => r.m.rainYieldM3))
  const edible = norm(rs.map((r) => r.m.edibleIntensive + r.m.edibleZones))
  const journey = norm(rs.map((r) => r.boardwalk))
  const built = norm(rs.map((r) => r.m.builtTotal), false)
  const service = norm(rs.map((r) => r.service), false)
  const solar = norm(rs.map((r) => (r.solar ? r.solar[0].hours + r.solar[1].hours : 0)))
  const comfort = norm(rs.map((r) => r.office + r.wellness))
  const per = rs.map((_, i) => ({
    ecology: 0.5 * bio[i] + 0.25 * nat[i] + 0.25 * hab[i],
    water: 0.5 * rain[i] + 0.5 * edible[i],
    journey: journey[i],
    compact: 0.5 * built[i] + 0.5 * service[i],
    solar: solar[i],
    comfort: comfort[i],
  }))
  const wsum = Object.values(weights).reduce((a, b) => a + b, 0) || 1
  return per.map((p) => ({ ...p, total: (Object.keys(p) as CriterionId[]).reduce((a, k) => a + p[k] * (weights[k] ?? 0), 0) / wsum }))
}
