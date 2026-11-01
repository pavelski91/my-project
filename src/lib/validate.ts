import type { Layout } from '../data/layouts'
import {
  HOUSE_EXISTING, HOUSE_EXTENSION, SECOND_DWELLING, SHED_EXISTING, TERRACE, PLOT, ENTRANCE, UTILITIES,
} from '../data/site'
import {
  boxToRect, distToPolyline, polyOverlap, rectCorners, rectInsidePlot, samplePath, rectCirclesPoint, type Rect, distToSegment,
} from './geometry'

export interface Issue {
  id: string
  severity: 'error' | 'warn' | 'info'
  text: string
  ids: string[]
}

export interface Settings {
  releaseSecondDwelling: boolean
  featureSetback: number
}

export interface Obstacle {
  id: string
  label: string
  rect: Rect
  walkable?: boolean
  fixed?: boolean
}

export const apronRect = (): Rect => {
  const a = ENTRANCE.apron
  return { x: (a.x0 + a.x1) / 2, z: -0.75, w: a.x1 - a.x0, d: a.depth, rot: 0 }
}

/** All fixed obstacles for the given phase. */
export function fixedObstacles(phase: number, s: Settings): Obstacle[] {
  const o: Obstacle[] = [
    { id: 'house', label: 'Existing house', rect: boxToRect(HOUSE_EXISTING), fixed: true },
  ]
  if (phase >= 1) {
    o.push({ id: 'extension', label: 'House extension', rect: boxToRect(HOUSE_EXTENSION), fixed: true })
    o.push({ id: 'terrace', label: 'Main terrace', rect: boxToRect(TERRACE), walkable: true, fixed: true })
  }
  if (phase < 1) o.push({ id: 'shed', label: 'Existing tin garage', rect: boxToRect(SHED_EXISTING), fixed: true })
  if (!s.releaseSecondDwelling) o.push({ id: 'second', label: 'Second dwelling (plan)', rect: boxToRect(SECOND_DWELLING), fixed: true })
  return o
}

const featureSetbackFor = (kind: string, s: Settings) => (kind === 'pond' || kind === 'raingarden' ? 1.0 : s.featureSetback)

/** Validate a layout: boundary, setbacks, collisions, boardwalk clearances. */
export function validateLayout(L: Layout, s: Settings, phase = 5): Issue[] {
  const issues: Issue[] = []
  const structures = L.structures.filter((q) => q.phase <= phase)
  const features = L.features.filter((q) => q.enabled && q.phase <= phase)
  const items: Obstacle[] = [...fixedObstacles(phase, s)]
  for (const st of structures) items.push({ id: st.id, label: st.label, rect: st, walkable: st.kind === 'bania' })
  for (const f of features) items.push({ id: f.id, label: f.label, rect: f, walkable: f.kind === 'platform' || f.kind === 'dining' })

  for (const st of structures) {
    if (!rectInsidePlot(st, 0)) issues.push({ id: `out-${st.id}`, severity: 'error', text: `${st.label} extends outside the property boundary.`, ids: [st.id] })
    else if (!rectInsidePlot(st, st.setback))
      issues.push({ id: `sb-${st.id}`, severity: 'warn', text: `${st.label} is closer than ${st.setback.toFixed(1)} m to the boundary (setback — verify).`, ids: [st.id] })
  }
  for (const f of features) {
    if (!rectInsidePlot(f, 0)) issues.push({ id: `out-${f.id}`, severity: 'error', text: `${f.label} extends outside the property boundary.`, ids: [f.id] })
    else if (!rectInsidePlot(f, featureSetbackFor(f.kind, s)))
      issues.push({ id: `sb-${f.id}`, severity: 'info', text: `${f.label} is within ${featureSetbackFor(f.kind, s).toFixed(1)} m of the boundary.`, ids: [f.id] })
  }

  // collisions
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j]
      if (a.fixed && b.fixed) continue
      if ((a.id === 'terrace' && b.id === 'dining') || (b.id === 'terrace' && a.id === 'dining')) continue
      // tanks/platform/features are small; allow decks to touch (margin negative)
      const pen = polyOverlap(rectCorners(a.rect), rectCorners(b.rect), -0.05)
      if (pen > 0.001) {
        // beds / pond zones in zones are allowed to overlap other features only slightly
        issues.push({ id: `col-${a.id}-${b.id}`, severity: 'error', text: `${a.label} overlaps ${b.label} (${pen.toFixed(2)} m).`, ids: [a.id, b.id] })
      }
    }
  }

  // minimum clearance between pavilions and the house (fire / daylight) — advisory
  for (const st of structures) {
    if (st.kind === 'bania') continue
    for (const f of fixedObstacles(phase, s)) {
      if (f.id === 'terrace') continue
      const pen = polyOverlap(rectCorners(st), rectCorners(f.rect), 3.0)
      if (pen > 0 && polyOverlap(rectCorners(st), rectCorners(f.rect), -0.01) === 0)
        issues.push({ id: `cl-${st.id}-${f.id}`, severity: 'info', text: `${st.label} is under 3 m from ${f.label} (fire-safety / daylight spacing — verify).`, ids: [st.id] })
    }
  }

  // boardwalk
  const { samples, length } = samplePath(L.boardwalk, 0.5)
  void length
  for (const smp of samples) {
    if (!pointInside(smp.x, smp.z)) {
      issues.push({ id: 'bw-out', severity: 'error', text: 'Boardwalk leaves the property boundary.', ids: ['boardwalk'] })
      break
    }
  }
  const blockers = items.filter((o) => !o.walkable && !o.fixed || o.id === 'house' || o.id === 'extension' || o.id === 'second')
  for (const o of blockers) {
    if (['tanks', 'habitat'].includes(o.id)) continue
    const pad = ['compost', 'beds', 'firepit'].some((k) => o.id.startsWith(k)) ? 0.35 : -0.1
    const hit = samples.some((p) => rectCirclesPoint(o.rect, p.x, p.z, pad))
    if (hit) issues.push({ id: `bw-${o.id}`, severity: 'warn', text: `Boardwalk runs through or hugs ${o.label}.`, ids: ['boardwalk', o.id] })
  }
  // utilities: warn if a pavilion sits on a planned service line
  const lines = Object.values(UTILITIES)
  for (const st of structures) {
    const bad = lines.some((ln) => {
      for (let i = 0; i < ln.length - 1; i++) {
        const [a, b] = [ln[i], ln[i + 1]]
        for (const [px, pz] of rectCorners(st)) if (distToSegment(px, pz, a, b) < 0.4) return true
      }
      return false
    })
    if (bad) issues.push({ id: `ut-${st.id}`, severity: 'warn', text: `${st.label} is on a planned utility route.`, ids: [st.id] })
  }
  void distToPolyline
  // entrance apron
  for (const st of structures)
    if (polyOverlap(rectCorners(st), rectCorners(apronRect()), 0) > 0) issues.push({ id: `ap-${st.id}`, severity: 'error', text: `${st.label} blocks the entrance apron.`, ids: [st.id] })
  return issues
}

function pointInside(x: number, z: number) {
  // inline to avoid circular import: polygon test with slight tolerance
  let inside = false
  for (let i = 0, j = PLOT.length - 1; i < PLOT.length; j = i++) {
    const [xi, zi] = PLOT[i]
    const [xj, zj] = PLOT[j]
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside
  }
  return inside
}
