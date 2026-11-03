import type { Layout, ZoneType } from '../data/layouts'
import { HOUSE_EXISTING, HOUSE_EXTENSION, HOUSE_BAY, PLAN_BALANCE, SECOND_DWELLING, SHED_EXISTING, TERRACE, PLOT } from '../data/site'
import { boxToRect, pointInPoly, polyArea, PLOT_BBOX, samplePath, maxGradient, type Rect } from './geometry'
import { classifyPoint, makeCtx, type GroundClass } from './ground'
import { generateVegetation, plantStats, type Vegetation } from './vegetation'
import { sunHours, type CrownOccluder, type Occluder } from './solar'

export const ASSUMPTIONS = {
  precipitationMm: 600,
  runoff: 0.9,
  filter: 0.9,
  roofOverhang: 1.12,
  gridStep: 0.5,
}

export interface Metrics {
  plotArea: number
  gridArea: number
  area: Record<string, number>
  builtTotal: number
  builtParts: { label: string; area: number }[]
  paved: number
  decks: number
  boardwalkArea: number
  boardwalkLength: number
  boardwalkGrade: number
  permeable: number
  vegetated: number
  biologicallyActive: number
  edibleIntensive: number
  edibleZones: number
  roofArea: number
  rainYieldM3: number
  tankLitres: number
  trees: number
  shrubs: number
  woody: number
  nativeShare: number
  ediblePlants: number
  bySpecies: Record<string, number>
  habitat: Record<string, number>
}

const roofOf = (r: Rect, kind: string) => {
  const f = kind === 'greenhouse' ? 1.04 : ASSUMPTIONS.roofOverhang
  return r.w * r.d * f
}

export const tankCount = (w: number, d: number) => Math.max(1, Math.floor((w * d) / 1.2))

export function computeMetrics(layout: Layout, phase: number, releaseSecond: boolean, veg: Vegetation, precipMm = ASSUMPTIONS.precipitationMm): Metrics {
  const c = makeCtx(layout, phase, releaseSecond)
  const step = ASSUMPTIONS.gridStep
  const counts: Record<string, number> = {}
  let cells = 0
  for (let x = PLOT_BBOX.x0; x < PLOT_BBOX.x1; x += step)
    for (let z = PLOT_BBOX.z0; z < PLOT_BBOX.z1; z += step) {
      const cx = x + step / 2, cz = z + step / 2
      if (!pointInPoly(cx, cz, PLOT)) continue
      cells++
      const k: GroundClass = classifyPoint(cx, cz, c)
      counts[k] = (counts[k] || 0) + 1
    }
  const plotArea = polyArea(PLOT)
  const gridArea = cells * step * step
  const k = plotArea / gridArea // normalise raster to the surveyed polygon area
  const area: Record<string, number> = {}
  for (const [key, n] of Object.entries(counts)) area[key] = n * step * step * k

  // Exact built footprint = analytical rectangles
  const parts: { label: string; area: number }[] = []
  const ex = boxToRect(HOUSE_EXISTING)
  parts.push({ label: 'Existing house', area: ex.w * ex.d })
  if (phase >= 1) {
    const e = boxToRect(HOUSE_EXTENSION)
    parts.push({ label: 'House extension', area: e.w * e.d })
    const bay = boxToRect(HOUSE_BAY)
    parts.push({ label: 'Family annex (kitchen · dining · living)', area: bay.w * bay.d })
  } else {
    const s = boxToRect(SHED_EXISTING)
    parts.push({ label: 'Existing tin garage', area: s.w * s.d })
  }
  for (const s of layout.structures) if (s.phase <= phase && s.kind !== 'bania') parts.push({ label: s.label, area: s.w * s.d })
  for (const f of layout.features) if (f.enabled && f.phase <= phase && ['toolshed', 'bikes', 'tanks'].includes(f.kind)) parts.push({ label: f.label, area: f.w * f.d })
  const builtTotal = parts.reduce((a, b) => a + b.area, 0)

  const stats = plantStats(veg.plants, phase)
  const nativeShare = stats.woody.length ? stats.native.length / stats.woody.length : 0

  // roof water
  let roof = ex.w * ex.d * ASSUMPTIONS.roofOverhang
  if (phase >= 1) roof += (boxToRect(HOUSE_EXTENSION).w * boxToRect(HOUSE_EXTENSION).d + boxToRect(HOUSE_BAY).w * boxToRect(HOUSE_BAY).d) * ASSUMPTIONS.roofOverhang
  for (const s of layout.structures) if (s.phase <= phase && s.kind !== 'bania') roof += roofOf(s, s.kind)
  for (const f of layout.features) if (f.enabled && f.phase <= phase && ['toolshed', 'bikes'].includes(f.kind)) roof += f.w * f.d * 1.15
  // pergola over terrace is open — not counted
  const rainYieldM3 = (roof * precipMm * ASSUMPTIONS.runoff * ASSUMPTIONS.filter) / 1000
  let tankLitres = 0
  for (const f of layout.features) if (f.enabled && f.phase <= phase && f.kind === 'tanks') tankLitres += tankCount(f.w, f.d) * 1000

  const gh = layout.structures.find((s) => s.kind === 'greenhouse' && s.phase <= phase)
  const edibleIntensive = (area.beds || 0) + (gh ? gh.w * gh.d * 0.55 : 0)
  const edibleZones = (area.foodforest || 0) + (area.berries || 0) + (area.kitchen || 0)

  const vegKeys = ['grass', 'woodland', 'screen', 'meadow', 'foodforest', 'berries', 'kitchen', 'shade', 'wetland', 'raingarden', 'beds']
  const vegetated = vegKeys.reduce((a, kk) => a + (area[kk] || 0), 0)
  const decks = area.deck || 0
  const paved = area.paved || 0
  const bwLen = phase >= 2 ? samplePath(layout.boardwalk, 0.25) : { samples: [], length: 0 }
  const habitat: Record<string, number> = {
    'Native woodland (canopy + understorey)': area.woodland || 0,
    'Hedgerow / screen': area.screen || 0,
    'Wildflower meadow': area.meadow || 0,
    'Wetland, rain garden & pond': (area.wetland || 0) + (area.raingarden || 0) + (area.water || 0),
    'Food forest & soft fruit': (area.foodforest || 0) + (area.berries || 0),
    'Shade garden': area.shade || 0,
  }
  return {
    plotArea,
    gridArea,
    area,
    builtTotal,
    builtParts: parts,
    paved,
    decks,
    boardwalkArea: phase >= 2 ? bwLen.length * layout.boardwalkWidth : 0,
    boardwalkLength: bwLen.length,
    boardwalkGrade: maxGradient(bwLen.samples),
    permeable: plotArea - builtTotal - paved,
    vegetated,
    biologicallyActive: vegetated + (area.water || 0),
    edibleIntensive,
    edibleZones,
    roofArea: roof,
    rainYieldM3,
    tankLitres,
    trees: stats.trees.length,
    shrubs: stats.shrubs.length,
    woody: stats.woody.length,
    nativeShare,
    ediblePlants: stats.edible.length,
    bySpecies: stats.bySpecies,
    habitat,
  }
}

/** Heights used for shading (m). */
const STRUCT_H: Record<string, number> = { office: 3.1, wellness: 3.7, greenhouse: 2.7, bania: 1.9, workshop: 2.9, carport: 2.7 }

export interface SolarResult {
  label: string
  month: number
  day: number
  hours: number
}

export function greenhouseSolar(layout: Layout, phase: number, releaseSecond: boolean, veg: Vegetation, growth: number): SolarResult[] | null {
  const gh = layout.structures.find((s) => s.kind === 'greenhouse')
  if (!gh) return null
  const occ: Occluder[] = [{ rect: boxToRect(HOUSE_EXISTING), h: 4.7 }]
  occ.push({ rect: boxToRect(HOUSE_EXTENSION), h: 4.3 })
  occ.push({ rect: boxToRect(HOUSE_BAY), h: 4.3 })
  if (!releaseSecond) occ.push({ rect: boxToRect(SECOND_DWELLING), h: 4.7 })
  occ.push({ rect: boxToRect(TERRACE), h: 0.1 })
  for (const s of layout.structures) if (s.kind !== 'greenhouse' && s.phase <= phase) occ.push({ rect: s, h: STRUCT_H[s.kind] })
  const crowns: CrownOccluder[] = veg.plants
    .filter((p) => p.phase <= phase && ['pine', 'spruce', 'birch', 'rowan', 'broad', 'fruit'].includes(p.arch))
    .map((p) => {
      const h = p.h * growth
      return { x: p.x, z: p.z, r: h * 0.2, y0: h * 0.4, y1: h, evergreen: p.arch === 'pine' || p.arch === 'spruce' }
    })
  const dates: [string, number, number, boolean][] = [
    ['Winter solstice (21 Dec)', 12, 21, false],
    ['Spring equinox (21 Mar)', 3, 21, false],
    ['Summer solstice (21 Jun)', 6, 21, true],
  ]
  return dates.map(([label, month, day, leaf]) => ({
    label,
    month,
    day,
    hours: sunHours(gh.x, gh.z + gh.d / 2 + 0.2, month, day, occ, crowns, leaf),
  }))
}

export function zoneLabel(t: ZoneType | string) {
  return (
    {
      woodland: 'Native woodland', screen: 'Hedgerow / screen', meadow: 'Wildflower meadow', foodforest: 'Food forest',
      berries: 'Soft fruit', kitchen: 'Herb & kitchen garden', shade: 'Shade garden', wetland: 'Wetland margin',
      grass: 'Retained pasture grass', beds: 'Raised beds', raingarden: 'Rain garden', water: 'Wildlife pond',
      deck: 'Timber decks & boardwalk', paved: 'Paved (apron, bin store)', stone: 'Stepping stones / gravel', building: 'Buildings', compost: 'Compost bays',
    } as Record<string, string>
  )[t] || t
}

export { PLAN_BALANCE }
