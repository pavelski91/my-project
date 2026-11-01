import type { Layout, Zone } from '../data/layouts'
import { SPECIES, ZONE_MIX, type Arch } from '../data/species'
import { PLOT, ENTRANCE } from '../data/site'
import {
  distToPolyEdge, pointInPoly, polyArea, polyBBox, rng, terrainY, rectCirclesPoint, rad, PLOT_BBOX, type V2,
} from './geometry'
import { classifyPoint, exclusions, insidePlot, makeCtx, nearBoardwalk } from './ground'

export interface Plant {
  sp: string
  arch: Arch
  x: number
  y: number
  z: number
  h: number // mature height (m)
  rot: number
  var: number // 0..1 variation
  native: boolean
  edible: boolean
  phase: number
  zone: string
}
export interface Tuft { x: number; y: number; z: number; s: number; rot: number; c: number; phase: number; meadow: boolean }
export interface Flower { x: number; y: number; z: number; s: number; rot: number; col: number; phase: number }
export interface Vegetation { plants: Plant[]; tufts: Tuft[]; flowers: Flower[]; context: Plant[]; contextTufts: Tuft[] }

const pick = (mix: [string, number][], r: number) => {
  let t = 0
  for (const [, w] of mix) t += w
  let u = r * t
  for (const [id, w] of mix) {
    u -= w
    if (u <= 0) return id
  }
  return mix[mix.length - 1][0]
}

const hashStr = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

export function generateVegetation(layout: Layout, phase: number, releaseSecond: boolean): Vegetation {
  const ctx = makeCtx(layout, 99, releaseSecond) // vegetation positions are computed for the finished scheme; phases filter at render time
  const excl = exclusions(ctx)
  const plants: Plant[] = []
  const tufts: Tuft[] = []
  const flowers: Flower[] = []
  const greenhouses = layout.structures.filter((s) => s.kind === 'greenhouse')
  void phase

  const blocked = (x: number, z: number, tall: boolean, clearance: number) => {
    for (const e of excl) if (rectCirclesPoint(e.rect, x, z, e.pad * (tall ? 1 : 0.5))) return true
    if (nearBoardwalk(x, z, ctx, clearance)) return true
    if (tall)
      for (const g of greenhouses) {
        const a = rad(-g.rot)
        const dx = x - g.x, dz = z - g.z
        const lx = dx * Math.cos(a) + dz * Math.sin(a)
        const lz = -dx * Math.sin(a) + dz * Math.cos(a)
        if (Math.abs(lx) < g.w / 2 + 2.0 && lz > -g.d / 2 - 2.2 && lz < g.d / 2 + 8) return true
      }
    // keep the entrance clear
    if (Math.hypot(x - ENTRANCE.gate.x, z - 0) < 1.0 && z < 4) return true
    return false
  }

  const hash = new Map<string, Plant[]>()
  const cell = 3
  const key = (x: number, z: number) => `${Math.floor(x / cell)},${Math.floor(z / cell)}`
  const tooClose = (x: number, z: number, r: number) => {
    const cx = Math.floor(x / cell), cz = Math.floor(z / cell)
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++) {
        const arr = hash.get(`${cx + i},${cz + j}`)
        if (!arr) continue
        for (const p of arr) {
          const rr = (p.arch === 'fern' ? 0.3 : p.h * 0.18 + 0.2) * 0.5 + r * 0.5
          if (Math.hypot(p.x - x, p.z - z) < rr) return true
        }
      }
    return false
  }
  const add = (p: Plant) => {
    plants.push(p)
    const k = key(p.x, p.z)
    if (!hash.has(k)) hash.set(k, [])
    hash.get(k)!.push(p)
  }

  const scatter = (zone: Zone, kind: 'trees' | 'shrubs' | 'under') => {
    const mix = ZONE_MIX[zone.type]
    const list = mix[kind]
    const density = kind === 'trees' ? mix.treeDensity : kind === 'shrubs' ? mix.shrubDensity : mix.underDensity
    if (!list.length || density <= 0) return
    const r = rng(hashStr(zone.id + kind + layout.id))
    const area = polyArea(zone.poly)
    const bb = polyBBox(zone.poly)
    const target = Math.round((density / 100) * area * (kind === 'under' ? 1 : 1))
    let placed = 0
    for (let tries = 0; tries < target * 14 && placed < target; tries++) {
      const x = bb.x0 + r() * (bb.x1 - bb.x0)
      const z = bb.z0 + r() * (bb.z1 - bb.z0)
      const sp = SPECIES[pick(list, r())]
      const hm = sp.h[0] + r() * (sp.h[1] - sp.h[0])
      const rr = r()
      if (!pointInPoly(x, z, zone.poly)) continue
      const margin = kind === 'trees' ? 0.9 : kind === 'shrubs' ? 0.5 : 0.25
      if (!insidePlot(x, z) || distToPolyEdge(x, z, PLOT) < margin) continue
      if (classifyPoint(x, z, ctx) !== zone.type) continue
      const tall = kind === 'trees' || (kind === 'shrubs' && hm > 1.9)
      if (blocked(x, z, tall, kind === 'trees' ? 1.4 : kind === 'shrubs' ? 0.7 : 0.12)) continue
      if (kind !== 'under' && tooClose(x, z, hm * 0.18 + 0.2)) continue
      add({ sp: sp.id, arch: sp.arch, x, y: terrainY(x, z), z, h: hm, rot: r() * 6.283, var: rr, native: sp.native, edible: !!sp.edible, phase: zone.phase, zone: zone.type })
      placed++
    }
  }
  for (const z of layout.zones) {
    scatter(z, 'trees')
    scatter(z, 'shrubs')
    scatter(z, 'under')
  }

  // Tufts & flowers over the whole plot following the classification of ground (meadow = dense and flowering)
  const r = rng(hashStr('tufts' + layout.id))
  const bb = PLOT_BBOX
  let guard = 0
  const maxTufts = 7500
  while (tufts.length < maxTufts && guard++ < 160000) {
    const x = bb.x0 + r() * (bb.x1 - bb.x0)
    const z = bb.z0 + r() * (bb.z1 - bb.z0)
    if (!insidePlot(x, z) || distToPolyEdge(x, z, PLOT) < 0.2) continue
    const cls = classifyPoint(x, z, ctx)
    const zone = layout.zones.find((zn) => pointInPoly(x, z, zn.poly))
    const ph = zone ? zone.phase : 0
    let p = 0
    let meadow = false
    switch (cls) {
      case 'meadow': p = 0.42; meadow = true; break
      case 'grass': p = 0.07; break
      case 'wetland': case 'raingarden': p = 0.5; meadow = true; break
      case 'foodforest': case 'berries': case 'kitchen': p = 0.16; break
      case 'woodland': case 'shade': p = 0.07; break
      case 'screen': p = 0.1; break
      default: p = 0
    }
    if (cls === 'grass' && excl.some((e) => rectCirclesPoint(e.rect, x, z, 0.25))) continue
    if (cls === 'grass' && nearBoardwalk(x, z, ctx, 0.2)) continue
    if (r() > p) continue
    const y = terrainY(x, z)
    tufts.push({ x, y, z, s: 0.6 + r() * 0.8, rot: r() * 6.283, c: r(), phase: ph, meadow })
    if (meadow && r() < 0.55) flowers.push({ x: x + (r() - 0.5) * 0.3, y, z: z + (r() - 0.5) * 0.3, s: 0.7 + r() * 0.6, rot: r() * 6.283, col: Math.floor(r() * 9), phase: ph })
  }

  // Context: far trees, hedgerows & neighbours' growth (not counted in the dashboard)
  const cr = rng(hashStr('context'))
  const context: Plant[] = []
  const contextTufts: Tuft[] = []
  const ctxSpecies = ['pine', 'pine', 'birch', 'birch', 'spruce', 'aspen', 'alder']
  const planCtx = (x: number, z: number) => {
    // no trees on road band (north), keep south open (meadow ŁV)
    return true && !(z < -6 && z > -22)
  }
  let n = 0
  for (let i = 0; i < 4000 && n < 130; i++) {
    const x = PLOT_BBOX.x0 - 40 + cr() * 130
    const z = PLOT_BBOX.z0 - 40 + cr() * 130
    if (pointInPoly(x, z, PLOT) || distToPolyEdge(x, z, PLOT) < 5) continue
    if (!planCtx(x, z)) continue
    const dc = Math.hypot(x - 20, z - 20)
    if (dc < 30) continue
    // bias: west + east + far north forest, sparse south
    const south = z > 44
    if (south && cr() < 0.7) continue
    const west = x < -8
    if (!west && cr() < 0.45) continue
    const sp = SPECIES[ctxSpecies[Math.floor(cr() * ctxSpecies.length)]]
    context.push({ sp: sp.id, arch: sp.arch, x, y: terrainY(x, z), z, h: sp.h[0] + cr() * (sp.h[1] - sp.h[0]) * 1.1, rot: cr() * 6.283, var: cr(), native: true, edible: false, phase: 0, zone: 'context' })
    n++
  }
  for (let i = 0; i < 900; i++) {
    const x = PLOT_BBOX.x0 - 30 + cr() * 100
    const z = PLOT_BBOX.z0 - 22 + cr() * 100
    if (distToPolyEdge(x, z, PLOT) < 1.2 || pointInPoly(x, z, PLOT)) continue
    contextTufts.push({ x, y: terrainY(x, z), z, s: 0.8 + cr() * 1.0, rot: cr() * 6.283, c: cr(), phase: 0, meadow: false })
  }
  return { plants, tufts, flowers, context, contextTufts }
}

export function plantStats(plants: Plant[], phase: number) {
  const vis = plants.filter((p) => p.phase <= phase)
  const trees = vis.filter((p) => ['pine', 'spruce', 'birch', 'rowan', 'broad', 'fruit'].includes(p.arch))
  const shrubs = vis.filter((p) => ['shrub', 'juniper'].includes(p.arch))
  const under = vis.filter((p) => p.arch === 'fern')
  const woody = [...trees, ...shrubs]
  const native = woody.filter((p) => p.native)
  const edible = vis.filter((p) => p.edible)
  const bySpecies: Record<string, number> = {}
  for (const p of vis) bySpecies[p.sp] = (bySpecies[p.sp] || 0) + 1
  return { vis, trees, shrubs, under, woody, native, edible, bySpecies }
}
