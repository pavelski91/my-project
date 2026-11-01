import type { V2 } from '../lib/geometry'

export type StructKind = 'office' | 'wellness' | 'greenhouse' | 'bania'
export type FeatureKind =
  | 'firepit' | 'hammock' | 'meditation' | 'dining' | 'toolshed' | 'tanks' | 'bikes'
  | 'compost' | 'pond' | 'raingarden' | 'beds' | 'habitat' | 'platform'

export interface Structure {
  id: string
  kind: StructKind
  label: string
  x: number
  z: number
  w: number // along local x
  d: number // along local z (local -z = entrance side, +z = glazed view side)
  rot: number // degrees
  phase: number
  setback: number
  wLim: [number, number]
  dLim: [number, number]
}

export interface Feature {
  id: string
  kind: FeatureKind
  label: string
  x: number
  z: number
  w: number
  d: number
  rot: number
  phase: number
  enabled: boolean
}

export type ZoneType =
  | 'woodland' // native canopy: pine / birch / rowan / alder / aspen + understorey
  | 'screen' // dense hedgerow: hazel, hawthorn, guelder rose, dog rose, juniper
  | 'meadow' // native wildflower meadow
  | 'foodforest' // fruit trees + berry shrubs + perennial edibles
  | 'berries' // soft fruit rows
  | 'kitchen' // herb & vegetable garden
  | 'shade' // woodland-floor planting: ferns, bilberry, moss
  | 'wetland' // sedges, iris, marsh marigold (rain garden surroundings)

export interface Zone {
  id: string
  type: ZoneType
  label: string
  poly: V2[]
  phase: number
}

export interface Layout {
  id: 'A' | 'B' | 'C'
  name: string
  tagline: string
  description: string
  pros: string[]
  cons: string[]
  structures: Structure[]
  features: Feature[]
  boardwalk: V2[]
  stonePath: V2[]
  zones: Zone[]
  boardwalkWidth: number
}

const R = (x0: number, z0: number, x1: number, z1: number): V2[] => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]
const E = (cx: number, cz: number, rx: number, rz: number, n = 16): V2[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    return [cx + Math.cos(a) * rx, cz + Math.sin(a) * rz] as V2
  })
const P = (...p: number[]): V2[] => {
  const o: V2[] = []
  for (let i = 0; i < p.length; i += 2) o.push([p[i], p[i + 1]])
  return o
}

const S = (
  id: string, kind: StructKind, label: string, x: number, z: number, w: number, d: number, rot: number,
  phase: number, setback: number, wLim: [number, number], dLim: [number, number],
): Structure => ({ id, kind, label, x, z, w, d, rot, phase, setback, wLim, dLim })

const F = (
  id: string, kind: FeatureKind, label: string, x: number, z: number, w: number, d: number, rot = 0,
  phase = 5, enabled = true,
): Feature => ({ id, kind, label, x, z, w, d, rot, phase, enabled })

const Z = (id: string, type: ZoneType, label: string, poly: V2[], phase = 5): Zone => ({ id, type, label, poly, phase })

/* ------------------------------------------------------------------ */
/* OPTION B — JAPANDI COURTYARD (recommended)                          */
/* ------------------------------------------------------------------ */
const B: Layout = {
  id: 'B',
  name: 'Japandi Courtyard',
  tagline: 'A compact south-west court framed by office, wellness pavilion and bania.',
  description:
    'The three outbuildings are grouped into one sheltered court south of the house, leaving the east and north of the plot for ' +
    'meadow, orchard and woodland. The boardwalk becomes a short, deliberate ritual: terrace → office → wellness court → bania. ' +
    'The greenhouse sits in the sunniest south-east corner with the rain garden and wildlife pond downhill of it.',
  pros: [
    'Best greenhouse sun in winter and spring, and the largest edible growing area',
    'Large uninterrupted meadow / orchard to the east',
    'Court gives wind shelter and privacy for the sauna, tub and shower',
    'Water flows downhill from the greenhouse to the rain garden and pond',
  ],
  cons: ['Longest service runs of the three (pavilions sit 10–16 m from the house)', 'Short boardwalk — less "forest journey"', 'Densest building cluster, in the south-west'],
  boardwalkWidth: 1.2,
  structures: [
    S('office', 'office', 'Micro office', 19.1, 26.2, 3.4, 3.0, 90, 3, 3.0, [2.8, 4.4], [2.6, 3.6]),
    S('wellness', 'wellness', 'Gym & sauna pavilion', 11.8, 32.5, 6.6, 4.2, 0, 4, 3.0, [5.4, 8.0], [3.6, 5.0]),
    S('bania', 'bania', 'Bania (wood-fired tub) & deck', 20.9, 33.4, 4.2, 3.6, 0, 4, 1.0, [3.2, 5.2], [3.0, 4.4]),
    S('greenhouse', 'greenhouse', 'Greenhouse', 25.6, 29.4, 4.4, 3.0, 0, 5, 2.0, [3.0, 5.6], [2.4, 3.6]),
  ],
  features: [
    F('dining', 'dining', 'Outdoor dining (terrace)', 11.9, 19.9, 2.6, 1.3, 0, 1),
    F('firepit', 'firepit', 'Fire pit under birches', 7.6, 6.0, 3.0, 3.0, 0, 5),
    F('hammock', 'hammock', 'Hammock between pines', 13.6, 5.4, 3.6, 0.8, 18, 5),
    F('meditation', 'meditation', 'Japanese meditation corner', 4.6, 31.0, 3.2, 3.2, 0, 5),
    F('toolshed', 'toolshed', 'Tool storage', 2.6, 16.3, 1.9, 1.2, 90, 2),
    F('tanks-house', 'tanks', 'Rain tanks (house roof) 2 × 1000 L', 10.3, 13.6, 1.2, 2.2, 0, 2),
    F('tanks-gh', 'tanks', 'Rain tank (greenhouse) 1000 L', 28.7, 30.3, 1.2, 1.2, 0, 5),
    F('bikes', 'bikes', 'Bicycle shelter', 15.1, 1.4, 2.2, 1.0, 0, 2),
    F('compost', 'compost', 'Compost bays', 24.4, 25.6, 2.4, 1.2, 0, 5),
    F('pond', 'pond', 'Wildlife pond', 31.6, 23.6, 3.2, 2.4, 0, 5),
    F('raingarden', 'raingarden', 'Rain garden', 30.6, 27.6, 3.0, 2.0, 0, 2),
    F('beds', 'beds', 'Raised vegetable beds', 22.6, 22.0, 3.0, 1.8, 0, 5),
    F('habitat-1', 'habitat', 'Deadwood & insect habitat', 3.6, 6.4, 2.4, 1.6, 20, 5),
    F('habitat-2', 'habitat', 'Log pile & bee hotel', 34.0, 8.0, 2.0, 1.4, -10, 5),
    F('platform', 'platform', 'Woodland seating platform', 10.2, 7.9, 2.0, 2.0, 0, 5),
  ],
  boardwalk: P(14.2, 20.6, 15.7, 22.6, 16.1, 25.2, 15.9, 27.7, 14.0, 29.3, 15.9, 30.2, 17.1, 32.0, 18.8, 33.3),
  stonePath: P(22.2, 3.4, 19.0, 8.0, 15.7, 12.6, 12.6, 15.4),
  zones: [
    Z('nw-wood', 'woodland', 'North-west woodland', R(0.6, 0.5, 18.5, 11.6), 2),
    Z('west-screen', 'screen', 'West hedgerow', R(0.6, 11.5, 4.1, 21.4), 2),
    Z('sw-wood', 'woodland', 'South-west woodland edge', R(0.6, 27.2, 6.2, 38.6), 5),
    Z('corridor-meadow', 'meadow', 'Entrance meadow', R(10.8, 3.5, 24.8, 15.4), 5),
    Z('south-meadow', 'meadow', 'South meadow', R(7.5, 35.9, 17.5, 38.4), 5),
    Z('shade-sw', 'shade', 'Shade garden', R(5.0, 24.4, 8.8, 29.8), 5),
    Z('foodforest-e', 'foodforest', 'Food forest', R(30.0, 2.5, 34.4, 23.4), 5),
    Z('berries-ne', 'berries', 'Soft fruit', R(31.0, -3.5, 38.4, 1.4), 5),
    Z('kitchen', 'kitchen', 'Herb & kitchen garden', R(20.4, 19.0, 24.8, 25.2), 5),
    Z('wetland-se', 'wetland', 'Wetland margin', E(30.6, 28.0, 3.4, 4.6), 5),
    Z('east-meadow', 'meadow', 'East meadow', R(30.2, 11.0, 35.0, 26.0), 5),
    Z('ne-screen', 'screen', 'Road-side screen', P(0.6, -0.2, 15.2, -1.6, 15.2, 2.2, 0.6, 2.2), 2),
    Z('north-screen-e', 'screen', 'North-east screen', R(29.6, -3.8, 38.6, -1.4), 2),
  ],
}

/* ------------------------------------------------------------------ */
/* OPTION A — FOREST RETREAT                                           */
/* ------------------------------------------------------------------ */
const A: Layout = {
  id: 'A',
  name: 'Forest Retreat',
  tagline: 'Pavilions scattered through woodland, linked by a long meandering walkway.',
  description:
    'Buildings are separated and hidden in planting: the office sits in a birch grove north of the house, the wellness pavilion and bania ' +
    'are tucked into the south, and the boardwalk makes a long meandering loop between them — the most immersive "forest bathing" sequence.',
  pros: [
    'Longest boardwalk journey and the strongest forest-bathing atmosphere',
    'Maximum privacy — office is acoustically separate from the wellness zone',
    'Full-size office (10 m²) and wellness pavilion (28 m²) with the greenhouse in a sunny south-west spot',
    'Best fit with the brief: a retreat that "developed organically" in its landscape',
  ],
  cons: [
    'Office sits in the cooler north strip — less winter daylight',
    'More boardwalk footprint and longer cable/pipe runs',
    'Fragments the open meadow into smaller glades',
  ],
  boardwalkWidth: 1.2,
  structures: [
    S('office', 'office', 'Micro office', 16.2, 9.4, 3.4, 3.0, 188, 3, 3.0, [2.8, 4.4], [2.6, 3.6]),
    S('wellness', 'wellness', 'Gym & sauna pavilion', 17.9, 31.8, 6.6, 4.2, -6, 4, 3.0, [5.4, 8.0], [3.6, 5.0]),
    S('bania', 'bania', 'Bania (wood-fired tub) & deck', 24.0, 29.6, 3.8, 3.4, 0, 4, 1.0, [3.2, 5.2], [3.0, 4.4]),
    S('greenhouse', 'greenhouse', 'Greenhouse', 9.9, 28.4, 4.4, 3.0, 0, 5, 2.0, [3.0, 5.6], [2.4, 3.6]),
  ],
  features: [
    F('dining', 'dining', 'Outdoor dining (terrace)', 11.9, 19.9, 2.6, 1.3, 0, 1),
    F('firepit', 'firepit', 'Fire pit clearing', 22.0, 6.8, 3.0, 3.0, 0, 5),
    F('hammock', 'hammock', 'Hammock among birches', 6.0, 7.0, 3.6, 0.8, 30, 5),
    F('meditation', 'meditation', 'Japanese meditation corner', 4.2, 31.8, 3.2, 3.2, 0, 5),
    F('toolshed', 'toolshed', 'Tool storage', 2.6, 16.3, 1.9, 1.2, 90, 2),
    F('tanks-house', 'tanks', 'Rain tanks (house roof) 2 × 1000 L', 10.3, 13.6, 1.2, 2.2, 0, 2),
    F('tanks-gh', 'tanks', 'Rain tank (greenhouse) 1000 L', 12.9, 28.6, 1.2, 1.2, 0, 5),
    F('bikes', 'bikes', 'Bicycle shelter', 15.1, 1.4, 2.2, 1.0, 0, 2),
    F('compost', 'compost', 'Compost bays', 6.8, 25.8, 2.4, 1.2, 90, 5),
    F('pond', 'pond', 'Wildlife pond', 30.6, 25.8, 3.2, 2.6, 0, 5),
    F('raingarden', 'raingarden', 'Rain garden', 29.4, 29.4, 2.6, 1.8, 0, 2, true),
    F('beds', 'beds', 'Raised vegetable beds', 9.9, 25.4, 3.0, 1.8, 0, 5),
    F('habitat-1', 'habitat', 'Deadwood & insect habitat', 3.6, 5.0, 2.4, 1.6, 20, 5),
    F('habitat-2', 'habitat', 'Log pile & bee hotel', 34.0, 8.0, 2.0, 1.4, -10, 5),
    F('platform', 'platform', 'Woodland seating platform', 22.5, 11.6, 2.0, 2.0, 0, 5),
  ],
  boardwalk: P(14.2, 19.8, 15.6, 16.8, 16.3, 13.9, 16.4, 12.0, 18.9, 12.2, 21.0, 14.0, 21.6, 17.0, 20.6, 22.2, 19.4, 26.2, 17.6, 28.3, 20.4, 28.7, 22.0, 29.0),
  stonePath: P(22.2, 3.4, 19.4, 6.4, 17.4, 11.0),
  zones: [
    Z('n-wood', 'woodland', 'North forest', R(0.6, 0.5, 20.5, 11.5), 2),
    Z('w-wood', 'woodland', 'West forest strip', R(0.6, 11.5, 4.3, 22), 2),
    Z('sw-wood', 'woodland', 'South-west forest', R(0.6, 27.0, 6.4, 38.6), 5),
    Z('s-screen', 'screen', 'South hedgerow', R(7.0, 34.6, 15.5, 38.4), 5),
    Z('e-wood', 'woodland', 'East woodland band', R(30.0, 3.0, 35.5, 14.0), 5),
    Z('e-food', 'foodforest', 'Food forest', R(30.2, 14.0, 34.6, 24.0), 5),
    Z('corr-meadow', 'meadow', 'Central glade meadow', R(12.0, 12.0, 24.8, 16.0), 5),
    Z('mid-meadow', 'meadow', 'Southern glade', R(11.0, 21.5, 19.0, 26.5), 5),
    Z('kitchen', 'kitchen', 'Herb garden', R(7.6, 24.2, 12.0, 27.0), 5),
    Z('berries', 'berries', 'Soft fruit', R(31.0, -3.5, 38.4, 1.4), 5),
    Z('wet', 'wetland', 'Wetland margin', E(30.3, 27.9, 3.2, 4.0), 5),
    Z('shade', 'shade', 'Shade garden', R(23.0, 6.8, 29.0, 12.0), 5),
    Z('ne-screen', 'screen', 'Road-side screen', P(0.6, -0.2, 15.2, -1.6, 15.2, 2.2, 0.6, 2.2), 2),
  ],
}

/* ------------------------------------------------------------------ */
/* OPTION C — REGENERATIVE SANCTUARY                                   */
/* ------------------------------------------------------------------ */
const C: Layout = {
  id: 'C',
  name: 'Regenerative Sanctuary',
  tagline: 'Smallest footprints, tightest cluster — everything else is habitat, food and water.',
  description:
    'All pavilions are sized at the low end of the brief and pushed toward the house, freeing the whole east and south-east for a food forest, ' +
    'wetland chain (rain garden → pond → wet meadow) and a large wildflower meadow.',
  pros: ['Largest vegetated and permeable area', 'Wetland chain captures and infiltrates most roof water', 'Lowest built footprint and boardwalk length'],
  cons: ['Tight pavilions (office 8 m², wellness 21 m²) — compromises on gym space', 'Court is closer to the house — less separation between work/rest'],
  boardwalkWidth: 1.1,
  structures: [
    S('office', 'office', 'Micro office', 12.9, 26.7, 2.9, 2.8, -90, 3, 3.0, [2.6, 4.4], [2.4, 3.6]),
    S('wellness', 'wellness', 'Gym & sauna pavilion', 9.4, 32.6, 5.4, 4.0, 0, 4, 3.0, [5.0, 8.0], [3.4, 5.0]),
    S('bania', 'bania', 'Bania (wood-fired tub) & deck', 16.4, 33.3, 3.6, 3.2, 0, 4, 1.0, [3.0, 5.2], [3.0, 4.4]),
    S('greenhouse', 'greenhouse', 'Greenhouse', 20.6, 27.8, 4.2, 2.8, 0, 5, 2.0, [3.0, 5.6], [2.4, 3.6]),
  ],
  features: [
    F('dining', 'dining', 'Outdoor dining (terrace)', 11.9, 19.9, 2.6, 1.3, 0, 1),
    F('firepit', 'firepit', 'Fire pit', 8.0, 6.6, 2.8, 2.8, 0, 5, false),
    F('hammock', 'hammock', 'Hammock', 14.0, 6.0, 3.6, 0.8, 12, 5, true),
    F('meditation', 'meditation', 'Japanese meditation corner', 4.4, 30.0, 3.0, 3.0, 0, 5),
    F('toolshed', 'toolshed', 'Tool storage', 2.6, 16.3, 1.9, 1.2, 90, 2),
    F('tanks-house', 'tanks', 'Rain tanks (house roof) 3 × 1000 L', 10.3, 13.6, 1.2, 3.3, 0, 2),
    F('tanks-gh', 'tanks', 'Rain tank (greenhouse) 1000 L', 23.7, 28.0, 1.2, 1.2, 0, 5),
    F('bikes', 'bikes', 'Bicycle shelter', 15.1, 1.4, 2.2, 1.0, 0, 2, false),
    F('compost', 'compost', 'Compost bays', 22.4, 25.2, 2.4, 1.2, 0, 5),
    F('pond', 'pond', 'Wildlife pond', 27.0, 30.0, 3.6, 2.6, 0, 5),
    F('raingarden', 'raingarden', 'Rain garden (swale)', 22.6, 22.4, 3.4, 2.0, 0, 2),
    F('beds', 'beds', 'Raised vegetable beds', 18.6, 22.0, 3.0, 1.8, 0, 5),
    F('habitat-1', 'habitat', 'Deadwood & insect habitat', 3.4, 5.6, 2.4, 1.6, 20, 5),
    F('habitat-2', 'habitat', 'Log pile & bee hotel', 34.0, 8.0, 2.0, 1.4, -10, 5),
    F('habitat-3', 'habitat', 'Hibernaculum & stone pile', 21.4, 15.0, 2.0, 1.4, 5, 5),
    F('platform', 'platform', 'Woodland seating platform', 10.0, 8.6, 2.0, 2.0, 0, 5),
  ],
  boardwalk: P(14.2, 21.0, 16.2, 22.6, 15.9, 25.2, 15.9, 27.9, 13.6, 29.7, 12.5, 30.8, 13.8, 32.2, 14.6, 33.4),
  stonePath: P(22.2, 3.4, 19.0, 8.0, 15.7, 12.6, 12.6, 15.4),
  zones: [
    Z('nw-wood', 'woodland', 'North-west woodland', R(0.6, 0.5, 17.0, 11.6), 2),
    Z('west-screen', 'screen', 'West hedgerow', R(0.6, 11.5, 4.1, 21.4), 2),
    Z('sw-wood', 'woodland', 'South-west woodland edge', R(0.6, 27.2, 5.6, 38.6), 5),
    Z('big-meadow', 'meadow', 'Central wildflower meadow', R(11.0, 3.5, 25.0, 15.4), 5),
    Z('south-meadow', 'meadow', 'South meadow', R(6.0, 35.9, 20.0, 38.4), 5),
    Z('east-meadow', 'meadow', 'East wet meadow', R(29.6, 11.0, 35.0, 24.0), 5),
    Z('foodforest', 'foodforest', 'Food forest', R(30.0, 2.0, 34.6, 11.2), 5),
    Z('orchard', 'foodforest', 'Orchard strip', R(18.0, 17.6, 24.0, 21.4), 5),
    Z('berries-ne', 'berries', 'Soft fruit', R(31.0, -3.5, 38.4, 1.4), 5),
    Z('kitchen', 'kitchen', 'Herb & kitchen garden', R(17.4, 22.4, 22.0, 26.4), 5),
    Z('wet-se', 'wetland', 'Wetland margin', E(28.0, 30.6, 4.4, 4.4), 5),
    Z('wet-swale', 'wetland', 'Swale margin', E(24.2, 22.4, 3.4, 2.2), 5),
    Z('shade-sw', 'shade', 'Shade garden', R(5.0, 24.4, 9.0, 29.4), 5),
    Z('ne-screen', 'screen', 'Road-side screen', P(0.6, -0.2, 15.2, -1.6, 15.2, 2.2, 0.6, 2.2), 2),
  ],
}

export const LAYOUTS: Record<'A' | 'B' | 'C', Layout> = { A, B, C }
export const RECOMMENDED: 'A' | 'B' | 'C' = 'A'

export const cloneLayout = (l: Layout): Layout => JSON.parse(JSON.stringify(l))

/** Phases of the project. */
export const PHASES = [
  { id: 0, name: 'Existing', short: 'Existing', desc: 'Existing house, tin garage and open pasture as surveyed.' },
  { id: 1, name: 'House extension', short: 'Extension', desc: 'Planned south extension and the main timber terrace with pergola.' },
  { id: 2, name: 'Landscape infrastructure', short: 'Infrastructure', desc: 'Fence, gates, entrance, boardwalk, rain tanks, rain garden and hedge screening.' },
  { id: 3, name: 'Work', short: 'Work', desc: 'Micro office on the boardwalk.' },
  { id: 4, name: 'Wellness', short: 'Wellness', desc: 'Gym, sauna and the bania with its deck.' },
  { id: 5, name: 'Regenerative garden', short: 'Garden', desc: 'Greenhouse, edible landscape, native woodland and meadow, habitats.' },
] as const
