import type { V2 } from '../lib/geometry'

export type StructKind = 'office' | 'wellness' | 'greenhouse' | 'bania' | 'workshop' | 'carport'
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

/* The whole parcel is available: the plan's second dwelling footprint (x 25–30, z 17–24) is free land. */

const STONE_PATH: V2[] = P(22.2, 3.4, 19.0, 8.0, 15.7, 12.6, 12.6, 15.4)
const NE_SCREEN: V2[] = P(0.6, -0.2, 15.2, -1.6, 15.2, 2.2, 0.6, 2.2)

/* ------------------------------------------------------------------ */
/* OPTION B — JAPANDI COURTYARD (recommended)                           */
/* ------------------------------------------------------------------ */
const B: Layout = {
  id: 'B',
  name: 'Japandi Courtyard',
  tagline: 'A framed court in the middle of the plot: office, wellness pavilion and bania around one sheltered garden room.',
  description:
    'The three outbuildings face each other across a quiet court in the centre-east of the plot (the land the plan reserved for a second house). ' +
    'The boardwalk crosses the whole garden from the terrace, enters the court at the office, passes the sauna door and ends at the bania. ' +
    'The greenhouse sits south of the court in full sun with the pond and rain garden downhill; woodland screens the north and west, the food forest the east.',
  pros: [
    'Strongest "designed" composition — three buildings frame one outdoor room',
    'Good greenhouse sun and the largest edible growing area',
    'Wind-sheltered, private court for the sauna, tub and shower',
    'Water flows downhill from the court to the rain garden and pond',
  ],
  cons: ['Pavilions sit 10–17 m from the house, so the longest service runs', 'Court is more built-up than the other options', 'Shorter boardwalk — less "forest journey"'],
  boardwalkWidth: 1.2,
  structures: [
    S('office', 'office', 'Micro office', 27.6, 14.8, 3.4, 3.0, 180, 3, 3.0, [2.8, 4.4], [2.6, 3.6]),
    S('wellness', 'wellness', 'Gym & sauna pavilion', 21.3, 22.4, 6.6, 4.2, -90, 4, 3.0, [5.4, 8.0], [3.6, 5.0]),
    S('bania', 'bania', 'Bania (wood-fired tub) & deck', 30.4, 22.8, 3.8, 3.4, 0, 4, 1.0, [3.2, 5.2], [3.0, 4.4]),
    S('greenhouse', 'greenhouse', 'Greenhouse', 26.2, 28.5, 4.4, 3.0, 0, 5, 2.0, [3.0, 5.6], [2.4, 3.6]),
    S('workshop', 'workshop', 'Workshop & tool house', 9.6, 34.0, 3.6, 2.8, 0, 2, 2.0, [2.6, 5.0], [2.2, 3.6]),
    S('carport', 'carport', 'Carport (open garage shelter)', 26.6, 3.6, 5.5, 3.2, 90, 2, 1.5, [4.8, 7.0], [2.6, 3.6]),
  ],
  features: [
    F('dining', 'dining', 'Outdoor dining (terrace)', 11.9, 19.9, 2.6, 1.3, 0, 1),
    F('firepit', 'firepit', 'Fire pit under birches', 29.8, 8.4, 3.0, 3.0, 0, 5),
    F('hammock', 'hammock', 'Hammock between pines', 13.8, 5.6, 3.6, 0.8, 18, 5),
    F('meditation', 'meditation', 'Japanese meditation corner', 4.6, 31.6, 3.2, 3.2, 0, 5),
    F('tanks-house', 'tanks', 'Rain tanks (house roof) 2 × 1000 L', 10.3, 13.6, 1.2, 2.2, 0, 2),
    F('tanks-gh', 'tanks', 'Rain tank (greenhouse) 1000 L', 23.0, 28.6, 1.2, 1.2, 0, 5),
    F('bikes', 'bikes', 'Bicycle shelter', 15.1, 1.4, 2.2, 1.0, 0, 2),
    F('compost', 'compost', 'Compost bays', 18.8, 34.6, 2.4, 1.2, 0, 5),
    F('pond', 'pond', 'Garden pond', 23.4, 32.3, 4.6, 3.2, 0, 5),
    F('raingarden', 'raingarden', 'Rain garden', 31.4, 27.2, 2.6, 1.8, 0, 2),
    F('beds', 'beds', 'Raised vegetable beds', 19.2, 29.0, 3.0, 1.8, 0, 5),
    F('habitat-1', 'habitat', 'Deadwood & insect habitat', 3.6, 6.4, 2.4, 1.6, 20, 5),
    F('habitat-2', 'habitat', 'Log pile & bee hotel', 34.0, 8.0, 2.0, 1.4, -10, 5),
    F('platform', 'platform', 'Woodland seating platform', 21.8, 8.6, 2.0, 2.0, 0, 5),
  ],
  boardwalk: P(14.2, 20.2, 17.8, 18.8, 21.8, 17.9, 25.4, 17.7, 27.4, 18.9, 25.9, 21.4, 25.0, 23.6, 27.0, 24.8, 28.9, 23.4),
  stonePath: STONE_PATH,
  zones: [
    Z('nw-wood', 'woodland', 'North-west woodland', R(0.6, 0.5, 18.5, 11.6), 2),
    Z('west-screen', 'screen', 'West hedgerow', R(0.6, 11.5, 4.1, 21.4), 2),
    Z('sw-wood', 'woodland', 'South-west woodland edge', R(0.6, 27.2, 6.2, 38.6), 5),
    Z('n-meadow', 'meadow', 'Entrance meadow', R(10.8, 3.5, 20.5, 15.4), 5),
    Z('south-meadow', 'meadow', 'South meadow', R(7.5, 35.0, 17.5, 38.4), 5),
    Z('court-meadow', 'meadow', 'Court meadow', R(14.6, 21.2, 18.6, 29.5), 5),
    Z('shade-sw', 'shade', 'Shade garden', R(5.0, 24.4, 8.8, 29.8), 5),
    Z('ne-wood', 'woodland', 'North-east woodland', R(22.5, 4.0, 33.5, 11.0), 5),
    Z('foodforest-e', 'foodforest', 'Food forest', R(32.2, 10.5, 35.6, 19.6), 5),
    Z('orchard', 'foodforest', 'Orchard', R(10.4, 24.6, 14.2, 29.2), 5),
    Z('berries-ne', 'berries', 'Soft fruit', R(31.0, -3.5, 38.4, 1.4), 5),
    Z('kitchen', 'kitchen', 'Herb & kitchen garden', R(18.0, 28.4, 22.6, 31.6), 5),
    Z('wetland-s', 'wetland', 'Wetland margin', E(23.4, 32.3, 4.0, 3.2), 5),
    Z('wetland-e', 'wetland', 'Wetland swale', E(31.4, 27.2, 3.4, 2.6), 5),
    Z('ne-screen', 'screen', 'Road-side screen', NE_SCREEN, 2),
  ],
}

/* ------------------------------------------------------------------ */
/* OPTION A — FOREST RETREAT                                           */
/* ------------------------------------------------------------------ */
const A: Layout = {
  id: 'A',
  name: 'Forest Retreat',
  tagline: 'Pavilions spread over the whole plot, hidden in woodland and linked by one long meandering walkway.',
  description:
    'Each use gets its own corner of the property: the office in a birch grove just east of the house, the wellness pavilion deep in the east woodland, ' +
    'the bania below it near the pond, and the greenhouse in the sunny south-west. One boardwalk wanders across the garden between them — the most immersive ' +
    '"forest bathing" sequence, and a retreat that feels like it developed organically in the landscape.',
  pros: [
    'Longest boardwalk journey and the strongest forest-bathing atmosphere',
    'Uses the entire plot — no part is left over; the east is woodland, the south is productive',
    'Maximum privacy: office, wellness and bania are each separate rooms in the landscape',
    'Full-size office (10 m²) and wellness pavilion (28 m²), greenhouse in open south-west sun',
  ],
  cons: [
    'Longest service runs (power, water, drainage to the east pavilions)',
    'More boardwalk footprint',
    'Fragments the open meadow into glades',
  ],
  boardwalkWidth: 1.2,
  structures: [
    S('office', 'office', 'Micro office', 20.6, 15.4, 3.4, 3.0, 180, 3, 3.0, [2.8, 4.4], [2.6, 3.6]),
    S('wellness', 'wellness', 'Gym & sauna pavilion', 27.4, 22.0, 6.6, 4.2, 0, 4, 3.0, [5.4, 8.0], [3.6, 5.0]),
    S('bania', 'bania', 'Bania (wood-fired tub) & deck', 29.4, 27.9, 4.0, 3.4, 0, 4, 1.0, [3.2, 5.2], [3.0, 4.4]),
    S('greenhouse', 'greenhouse', 'Greenhouse', 14.5, 31.0, 4.4, 3.0, 0, 5, 2.0, [3.0, 5.6], [2.4, 3.6]),
    S('workshop', 'workshop', 'Workshop & tool house', 9.3, 34.2, 3.6, 2.8, 0, 2, 2.0, [2.6, 5.0], [2.2, 3.6]),
    S('carport', 'carport', 'Carport (open garage shelter)', 26.6, 3.6, 5.5, 3.2, 90, 2, 1.5, [4.8, 7.0], [2.6, 3.6]),
  ],
  features: [
    F('dining', 'dining', 'Outdoor dining (terrace)', 11.9, 19.9, 2.6, 1.3, 0, 1),
    F('firepit', 'firepit', 'Fire pit clearing', 29.8, 9.2, 3.0, 3.0, 0, 5),
    F('hammock', 'hammock', 'Hammock among birches', 13.8, 5.6, 3.6, 0.8, 18, 5),
    F('meditation', 'meditation', 'Japanese meditation corner', 4.4, 31.6, 3.2, 3.2, 0, 5),
    F('tanks-house', 'tanks', 'Rain tanks (house roof) 2 × 1000 L', 10.3, 13.6, 1.2, 2.2, 0, 2),
    F('tanks-gh', 'tanks', 'Rain tank (greenhouse) 1000 L', 17.9, 32.6, 1.2, 1.2, 0, 5),
    F('bikes', 'bikes', 'Bicycle shelter', 15.1, 1.4, 2.2, 1.0, 0, 2),
    F('compost', 'compost', 'Compost bays', 22.0, 34.0, 2.4, 1.2, 0, 5),
    F('pond', 'pond', 'Garden pond', 24.6, 31.2, 5.0, 3.4, 0, 5),
    F('raingarden', 'raingarden', 'Rain garden', 24.4, 27.0, 2.6, 1.8, 0, 2),
    F('beds', 'beds', 'Raised vegetable beds', 20.2, 30.4, 3.0, 1.8, 0, 5),
    F('habitat-1', 'habitat', 'Deadwood & insect habitat', 3.6, 5.0, 2.4, 1.6, 20, 5),
    F('habitat-2', 'habitat', 'Log pile & bee hotel', 34.0, 8.0, 2.0, 1.4, -10, 5),
    F('platform', 'platform', 'Woodland seating platform', 24.5, 8.6, 2.0, 2.0, 0, 5),
  ],
  boardwalk: P(14.2, 20.2, 16.2, 18.9, 19.6, 18.3, 22.8, 18.5, 25.8, 18.9, 28.7, 19.1, 31.8, 20.7, 33.0, 23.5, 31.2, 25.3),
  stonePath: STONE_PATH,
  zones: [
    Z('n-wood', 'woodland', 'North forest', R(0.6, 0.5, 20.5, 11.5), 2),
    Z('w-wood', 'woodland', 'West forest strip', R(0.6, 11.5, 4.3, 22), 2),
    Z('sw-wood', 'woodland', 'South-west forest', R(0.6, 27.0, 6.4, 38.6), 5),
    Z('s-meadow', 'meadow', 'South meadow', R(6.8, 35.0, 19.5, 38.4), 5),
    Z('n-meadow', 'meadow', 'Entrance glade', R(10.8, 3.5, 22.5, 12.0), 5),
    Z('c-meadow', 'meadow', 'Central glade', R(14.8, 21.0, 24.0, 28.0), 5),
    Z('ne-wood', 'woodland', 'East woodland', R(23.0, 4.0, 34.0, 13.0), 5),
    Z('e-wood', 'woodland', 'East forest (wellness)', R(23.0, 13.5, 35.4, 18.0), 5),
    Z('foodforest-e', 'foodforest', 'Food forest', R(32.4, 18.5, 35.4, 22.5), 5),
    Z('orchard', 'foodforest', 'Orchard', R(10.4, 24.6, 14.2, 29.2), 5),
    Z('berries', 'berries', 'Soft fruit', R(31.0, -3.5, 38.4, 1.4), 5),
    Z('kitchen', 'kitchen', 'Herb & kitchen garden', R(18.4, 28.6, 22.4, 33.0), 5),
    Z('wet', 'wetland', 'Wetland margin', E(24.2, 31.6, 4.0, 3.2), 5),
    Z('wet2', 'wetland', 'Swale margin', E(24.4, 27.0, 3.2, 2.4), 5),
    Z('shade', 'shade', 'Shade garden', R(5.0, 24.4, 9.0, 29.8), 5),
    Z('ne-screen', 'screen', 'Road-side screen', NE_SCREEN, 2),
  ],
}

/* ------------------------------------------------------------------ */
/* OPTION C — REGENERATIVE SANCTUARY                                   */
/* ------------------------------------------------------------------ */
const C: Layout = {
  id: 'C',
  name: 'Regenerative Sanctuary',
  tagline: 'Smallest footprints in one tight belt south of the house — the whole north and east are habitat, food and water.',
  description:
    'All pavilions are sized at the low end of the brief and strung along one short boardwalk in the southern half of the plot, leaving the entire north and east ' +
    '(including the former second-house land) for a large wildflower meadow, food forest, wetland chain and woodland.',
  pros: ['Largest vegetated and permeable area', 'Wetland chain captures and infiltrates most roof water', 'Lowest built footprint and boardwalk length'],
  cons: ['Tight pavilions (office 8 m², wellness 22 m²) — compromises on gym space', 'Buildings clustered close to the house — less separation between work and rest'],
  boardwalkWidth: 1.1,
  structures: [
    S('office', 'office', 'Micro office', 12.9, 26.7, 2.9, 2.8, 0, 3, 3.0, [2.6, 4.4], [2.4, 3.6]),
    S('wellness', 'wellness', 'Gym & sauna pavilion', 20.6, 26.2, 5.4, 4.0, 0, 4, 3.0, [5.0, 8.0], [3.4, 5.0]),
    S('bania', 'bania', 'Bania (wood-fired tub) & deck', 27.4, 24.4, 3.6, 3.2, 0, 4, 1.0, [3.0, 5.2], [3.0, 4.4]),
    S('greenhouse', 'greenhouse', 'Greenhouse', 17.4, 32.0, 4.2, 2.8, 0, 5, 2.0, [3.0, 5.6], [2.4, 3.6]),
    S('workshop', 'workshop', 'Workshop & tool house', 7.6, 34.6, 3.6, 2.8, 0, 2, 2.0, [2.6, 5.0], [2.2, 3.6]),
    S('carport', 'carport', 'Carport (open garage shelter)', 26.6, 3.6, 5.5, 3.2, 90, 2, 1.5, [4.8, 7.0], [2.6, 3.6]),
  ],
  features: [
    F('dining', 'dining', 'Outdoor dining (terrace)', 11.9, 19.9, 2.6, 1.3, 0, 1),
    F('firepit', 'firepit', 'Fire pit', 29.8, 9.0, 2.8, 2.8, 0, 5, false),
    F('hammock', 'hammock', 'Hammock', 14.0, 6.0, 3.6, 0.8, 12, 5, true),
    F('meditation', 'meditation', 'Japanese meditation corner', 4.4, 30.4, 3.0, 3.0, 0, 5),
    F('tanks-house', 'tanks', 'Rain tanks (house roof) 3 × 1000 L', 10.3, 13.6, 1.2, 3.3, 0, 2),
    F('tanks-gh', 'tanks', 'Rain tank (greenhouse) 1000 L', 20.8, 32.4, 1.2, 1.2, 0, 5),
    F('bikes', 'bikes', 'Bicycle shelter', 15.1, 1.4, 2.2, 1.0, 0, 2, false),
    F('compost', 'compost', 'Compost bays', 11.0, 34.0, 2.4, 1.2, 0, 5),
    F('pond', 'pond', 'Garden pond', 27.2, 30.2, 4.8, 3.2, 0, 5),
    F('raingarden', 'raingarden', 'Rain garden (swale)', 22.2, 29.8, 3.0, 1.8, 0, 2),
    F('beds', 'beds', 'Raised vegetable beds', 13.2, 30.8, 3.0, 1.8, 0, 5),
    F('habitat-1', 'habitat', 'Deadwood & insect habitat', 3.4, 5.6, 2.4, 1.6, 20, 5),
    F('habitat-2', 'habitat', 'Log pile & bee hotel', 34.0, 8.0, 2.0, 1.4, -10, 5),
    F('habitat-3', 'habitat', 'Hibernaculum & stone pile', 24.0, 15.0, 2.0, 1.4, 5, 5),
    F('platform', 'platform', 'Woodland seating platform', 21.0, 8.6, 2.0, 2.0, 0, 5),
  ],
  boardwalk: P(14.2, 21.6, 13.8, 23.9, 16.2, 24.4, 19.0, 23.2, 21.2, 23.2, 24.0, 22.9, 25.2, 24.0),
  stonePath: STONE_PATH,
  zones: [
    Z('nw-wood', 'woodland', 'North-west woodland', R(0.6, 0.5, 17.0, 11.6), 2),
    Z('west-screen', 'screen', 'West hedgerow', R(0.6, 11.5, 4.1, 21.4), 2),
    Z('sw-wood', 'woodland', 'South-west woodland edge', R(0.6, 27.2, 5.6, 38.6), 5),
    Z('big-meadow', 'meadow', 'Central wildflower meadow', R(11.0, 3.5, 26.5, 20.5), 5),
    Z('south-meadow', 'meadow', 'South meadow', R(6.0, 35.5, 20.0, 38.4), 5),
    Z('east-meadow', 'meadow', 'East wet meadow', R(29.0, 12.0, 35.4, 21.0), 5),
    Z('foodforest', 'foodforest', 'Food forest', R(29.8, 2.0, 34.8, 11.4), 5),
    Z('orchard', 'foodforest', 'Orchard strip', R(18.0, 20.6, 26.0, 21.8), 5),
    Z('berries-ne', 'berries', 'Soft fruit', R(31.0, -3.5, 38.4, 1.4), 5),
    Z('kitchen', 'kitchen', 'Herb & kitchen garden', R(11.6, 29.4, 16.0, 32.6), 5),
    Z('wet-se', 'wetland', 'Wetland margin', E(27.4, 30.0, 4.4, 3.4), 5),
    Z('wet-swale', 'wetland', 'Swale margin', E(22.2, 29.8, 3.6, 2.4), 5),
    Z('shade-sw', 'shade', 'Shade garden', R(5.0, 24.4, 9.0, 29.4), 5),
    Z('ne-screen', 'screen', 'Road-side screen', NE_SCREEN, 2),
  ],
}

export const LAYOUTS: Record<'A' | 'B' | 'C', Layout> = { A, B, C }
export const RECOMMENDED: 'A' | 'B' | 'C' = 'B'

export const cloneLayout = (l: Layout): Layout => JSON.parse(JSON.stringify(l))

/** Phases of the project. */
export const PHASES = [
  { id: 0, name: 'Existing', short: 'Existing', desc: 'Existing house, tin garage and open pasture as surveyed.' },
  { id: 1, name: 'House extension', short: 'Extension', desc: 'Planned south extension and the main timber terrace with pergola.' },
  { id: 2, name: 'Landscape infrastructure', short: 'Infrastructure', desc: 'Fence, gates, entrance, carport, workshop, boardwalk, rain tanks, rain garden and hedge screening.' },
  { id: 3, name: 'Work', short: 'Work', desc: 'Micro office on the boardwalk.' },
  { id: 4, name: 'Wellness', short: 'Wellness', desc: 'Gym, sauna and the bania with its deck.' },
  { id: 5, name: 'Regenerative garden', short: 'Garden', desc: 'Greenhouse, edible landscape, native woodland and meadow, habitats.' },
] as const
