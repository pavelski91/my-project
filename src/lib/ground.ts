import type { Layout, Structure, Feature, ZoneType } from '../data/layouts'
import { ENTRANCE, HOUSE_EXISTING, HOUSE_EXTENSION, HOUSE_BAY, LOGGIA, SECOND_DWELLING, SHED_EXISTING, TERRACE, PLOT } from '../data/site'
import { boxToRect, distToSegment, pointInPoly, rectCirclesPoint, samplePath, type PathSample, type Rect, type V2, rad } from './geometry'
import { apronRect } from './validate'

export type GroundClass =
  | 'building' | 'deck' | 'paved' | 'stone' | 'water' | 'raingarden' | 'beds' | 'compost' | 'grass'
  | ZoneType

export interface GroundCtx {
  layout: Layout
  phase: number
  releaseSecond: boolean
  bw: PathSample[]
  bwWidth: number
  structs: Structure[]
  feats: Feature[]
  fixed: { rect: Rect; cls: GroundClass; id: string }[]
  apron: Rect
}

export function makeCtx(layout: Layout, phase: number, releaseSecond: boolean): GroundCtx {
  const structs = layout.structures.filter((s) => s.phase <= phase)
  const feats = layout.features.filter((f) => f.enabled && f.phase <= phase)
  const fixed: GroundCtx['fixed'] = [{ rect: boxToRect(HOUSE_EXISTING), cls: 'building', id: 'house' }]
  if (phase >= 1) {
    fixed.push({ rect: boxToRect(HOUSE_EXTENSION), cls: 'building', id: 'extension' })
    fixed.push({ rect: boxToRect(HOUSE_BAY), cls: 'building', id: 'bay' })
    fixed.push({ rect: boxToRect(LOGGIA), cls: 'deck', id: 'loggia' })
    fixed.push({ rect: boxToRect(TERRACE), cls: 'deck', id: 'terrace' })
  } else fixed.push({ rect: boxToRect(SHED_EXISTING), cls: 'building', id: 'shed' })
  const bw = phase >= 2 ? samplePath(layout.boardwalk, 0.4).samples : []
  return { layout, phase, releaseSecond, bw, bwWidth: layout.boardwalkWidth, structs, feats, fixed, apron: apronRect() }
}

const ellipseHit = (r: Rect, x: number, z: number) => {
  const a = rad(-r.rot)
  const dx = x - r.x, dz = z - r.z
  const lx = dx * Math.cos(a) + dz * Math.sin(a)
  const lz = -dx * Math.sin(a) + dz * Math.cos(a)
  return (lx / (r.w / 2)) ** 2 + (lz / (r.d / 2)) ** 2 <= 1
}

export function classifyPoint(x: number, z: number, c: GroundCtx): GroundClass {
  for (const f of c.fixed) if (rectCirclesPoint(f.rect, x, z)) return f.cls
  for (const s of c.structs) {
    if (rectCirclesPoint(s, x, z)) return s.kind === 'bania' ? 'deck' : 'building'
  }
  for (const f of c.feats) {
    switch (f.kind) {
      case 'pond': if (ellipseHit(f, x, z)) return 'water'; break
      case 'raingarden': if (ellipseHit(f, x, z)) return 'raingarden'; break
      case 'beds': if (rectCirclesPoint(f, x, z)) return 'beds'; break
      case 'compost': if (rectCirclesPoint(f, x, z)) return 'compost'; break
      case 'toolshed': case 'bikes': case 'tanks': if (rectCirclesPoint(f, x, z)) return 'building'; break
      case 'platform': if (rectCirclesPoint(f, x, z)) return 'deck'; break
      case 'firepit': case 'meditation': if (ellipseHit(f, x, z)) return 'stone'; break
    }
  }
  if (c.phase >= 2) {
    if (rectCirclesPoint(c.apron, x, z)) return 'paved'
    if (rectCirclesPoint({ x: ENTRANCE.waste.x, z: ENTRANCE.waste.z, w: ENTRANCE.waste.w, d: ENTRANCE.waste.d, rot: 0 }, x, z)) return 'paved'
    const dp = ENTRANCE.drive.pts
    for (let i = 0; i < dp.length - 1; i++) if (distToSegment(x, z, dp[i], dp[i + 1]) <= ENTRANCE.drive.width / 2) return 'paved'
    const half = c.bwWidth / 2
    for (let i = 0; i < c.bw.length - 1; i++) {
      if (distToSegment(x, z, [c.bw[i].x, c.bw[i].z], [c.bw[i + 1].x, c.bw[i + 1].z]) <= half) return 'deck'
    }
    const sp = c.layout.stonePath
    for (let i = 0; i < sp.length - 1; i++) if (distToSegment(x, z, sp[i], sp[i + 1]) <= 0.35) return 'stone'
  }
  for (const zn of c.layout.zones) if (zn.phase <= c.phase && pointInPoly(x, z, zn.poly)) return zn.type
  return 'grass'
}

/** Rectangles that plants may not occupy, with clearance margins. */
export function exclusions(c: GroundCtx): { rect: Rect; pad: number }[] {
  const o: { rect: Rect; pad: number }[] = []
  for (const f of c.fixed) o.push({ rect: f.rect, pad: f.id === 'terrace' ? 0.6 : 1.8 })
  if (!c.releaseSecond) o.push({ rect: boxToRect(SECOND_DWELLING), pad: 1.4 })
  if (c.phase >= 1) { o.push({ rect: boxToRect(HOUSE_EXTENSION), pad: 1.8 }); o.push({ rect: boxToRect(HOUSE_BAY), pad: 1.8 }) }
  for (const s of c.structs) o.push({ rect: s, pad: s.kind === 'bania' ? 1.0 : 1.5 })
  for (const f of c.feats) if (f.kind !== 'habitat' && f.kind !== 'hammock' && f.kind !== 'dining') o.push({ rect: f, pad: f.kind === 'beds' ? 0.4 : f.kind === 'pond' ? 2.6 : 0.8 })
  if (c.phase >= 2) {
    o.push({ rect: c.apron, pad: 0.8 })
    o.push({ rect: { x: ENTRANCE.waste.x, z: ENTRANCE.waste.z, w: ENTRANCE.waste.w, d: ENTRANCE.waste.d, rot: 0 }, pad: 0.8 })
  }
  return o
}

export function nearBoardwalk(x: number, z: number, c: GroundCtx, clearance: number) {
  if (c.phase >= 2) {
    const dp = ENTRANCE.drive.pts
    for (let i = 0; i < dp.length - 1; i++) if (distToSegment(x, z, dp[i], dp[i + 1]) < ENTRANCE.drive.width / 2 + clearance + 0.3) return true
  }
  const half = c.bwWidth / 2 + clearance
  for (let i = 0; i < c.bw.length - 1; i += 1)
    if (distToSegment(x, z, [c.bw[i].x, c.bw[i].z], [c.bw[i + 1].x, c.bw[i + 1].z]) < half) return true
  const sp = c.layout.stonePath
  if (c.phase >= 2) for (let i = 0; i < sp.length - 1; i++) if (distToSegment(x, z, sp[i], sp[i + 1]) < clearance + 0.4) return true
  return false
}

export const insidePlot = (x: number, z: number) => pointInPoly(x, z, PLOT as V2[])
