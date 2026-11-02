import * as THREE from 'three'
import { HOUSE_EXISTING, HOUSE_EXTENSION, GROUND_FLOOR_LEFT, PLOT, SPOT_HEIGHTS, TERRAIN_Y0 } from '../data/site'

export type V2 = [number, number]

export const deg = (r: number) => (r * 180) / Math.PI
export const rad = (d: number) => (d * Math.PI) / 180
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

export function polyArea(p: V2[]) {
  let s = 0
  for (let i = 0; i < p.length; i++) {
    const [x1, z1] = p[i]
    const [x2, z2] = p[(i + 1) % p.length]
    s += x1 * z2 - x2 * z1
  }
  return Math.abs(s) / 2
}

export function pointInPoly(x: number, z: number, p: V2[]) {
  let inside = false
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, zi] = p[i]
    const [xj, zj] = p[j]
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside
  }
  return inside
}

export function distToSegment(x: number, z: number, a: V2, b: V2) {
  const dx = b[0] - a[0]
  const dz = b[1] - a[1]
  const l2 = dx * dx + dz * dz
  let t = l2 ? ((x - a[0]) * dx + (z - a[1]) * dz) / l2 : 0
  t = clamp(t, 0, 1)
  return Math.hypot(x - (a[0] + t * dx), z - (a[1] + t * dz))
}

/** Distance from a point to the polygon outline. */
export function distToPolyEdge(x: number, z: number, p: V2[]) {
  let d = Infinity
  for (let i = 0; i < p.length; i++) d = Math.min(d, distToSegment(x, z, p[i], p[(i + 1) % p.length]))
  return d
}

/** Signed distance: positive inside, negative outside. */
export const signedDistToPlot = (x: number, z: number, poly: V2[] = PLOT) =>
  (pointInPoly(x, z, poly) ? 1 : -1) * distToPolyEdge(x, z, poly)

export const PLOT_BBOX = (() => {
  const xs = PLOT.map((p) => p[0])
  const zs = PLOT.map((p) => p[1])
  return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) }
})()
export const PLOT_CENTER: V2 = [
  (PLOT_BBOX.x0 + PLOT_BBOX.x1) / 2,
  (PLOT_BBOX.z0 + PLOT_BBOX.z1) / 2,
]

/* ---------- oriented rectangles ---------- */
export interface Rect {
  x: number
  z: number
  w: number // along local x
  d: number // along local z
  rot: number // degrees, rotation about vertical axis (counter-clockwise seen from above ⇒ three.js y-rotation)
}

export function rectCorners(r: Rect): V2[] {
  const a = rad(r.rot)
  const c = Math.cos(a)
  const s = Math.sin(a)
  // three.js rotation.y = a maps local (lx,lz) -> (lx c + lz s, -lx s + lz c)
  const pts: V2[] = [
    [-r.w / 2, -r.d / 2],
    [r.w / 2, -r.d / 2],
    [r.w / 2, r.d / 2],
    [-r.w / 2, r.d / 2],
  ]
  return pts.map(([lx, lz]) => [r.x + lx * c + lz * s, r.z - lx * s + lz * c] as V2)
}

export function boxToRect(b: { x0: number; z0: number; x1: number; z1: number }): Rect {
  return { x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2, w: b.x1 - b.x0, d: b.z1 - b.z0, rot: 0 }
}

function project(poly: V2[], ax: V2) {
  let mn = Infinity
  let mx = -Infinity
  for (const p of poly) {
    const v = p[0] * ax[0] + p[1] * ax[1]
    mn = Math.min(mn, v)
    mx = Math.max(mx, v)
  }
  return [mn, mx]
}

/** Separating-axis overlap for two convex polygons (returns penetration depth > 0 when overlapping). */
export function polyOverlap(a: V2[], b: V2[], margin = 0): number {
  let minPen = Infinity
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const p1 = poly[i]
      const p2 = poly[(i + 1) % poly.length]
      const ax: V2 = [-(p2[1] - p1[1]), p2[0] - p1[0]]
      const l = Math.hypot(ax[0], ax[1]) || 1
      ax[0] /= l
      ax[1] /= l
      const [a0, a1] = project(a, ax)
      const [b0, b1] = project(b, ax)
      const pen = Math.min(a1, b1) - Math.max(a0, b0) + margin
      if (pen <= 0) return 0
      minPen = Math.min(minPen, pen)
    }
  }
  return minPen
}

export function rectInsidePlot(r: Rect, setback: number, poly: V2[] = PLOT) {
  return rectCorners(r).every(([x, z]) => pointInPoly(x, z, poly) && distToPolyEdge(x, z, poly) >= setback - 1e-6)
}

export function rectCirclesPoint(r: Rect, x: number, z: number, pad = 0) {
  // is point inside rect grown by pad
  const a = rad(-r.rot)
  const dx = x - r.x
  const dz = z - r.z
  const c = Math.cos(a)
  const s = Math.sin(a)
  const lx = dx * c + dz * s
  const lz = -dx * s + dz * c
  return Math.abs(lx) <= r.w / 2 + pad && Math.abs(lz) <= r.d / 2 + pad
}

/* ---------- terrain ---------- */
// Plane fit on spot heights + inverse-distance-weighted residual, giving a smooth surface without bull's-eyes.
const plane = (() => {
  const n = SPOT_HEIGHTS.length
  let sx = 0, sz = 0, sh = 0, sxx = 0, szz = 0, sxz = 0, sxh = 0, szh = 0
  for (const [x, z, h] of SPOT_HEIGHTS) {
    sx += x; sz += z; sh += h
    sxx += x * x; szz += z * z; sxz += x * z
    sxh += x * h; szh += z * h
  }
  // solve normal equations for h = a + b x + c z
  const M = [
    [n, sx, sz],
    [sx, sxx, sxz],
    [sz, sxz, szz],
  ]
  const v = [sh, sxh, szh]
  const det = (m: number[][]) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  const D = det(M)
  const col = (i: number) => M.map((r, k) => r.map((val, j) => (j === i ? v[k] : val)))
  return { a: det(col(0)) / D, b: det(col(1)) / D, c: det(col(2)) / D }
})()
const planeH = (x: number, z: number) => plane.a + plane.b * x + plane.c * z
const residuals = SPOT_HEIGHTS.map(([x, z, h]) => h - planeH(x, z))

function hash2(x: number, z: number) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453
  return s - Math.floor(s)
}
function vnoise(x: number, z: number) {
  const xi = Math.floor(x), zi = Math.floor(z)
  const xf = x - xi, zf = z - zi
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf)
  return lerp(lerp(hash2(xi, zi), hash2(xi + 1, zi), u), lerp(hash2(xi, zi + 1), hash2(xi + 1, zi + 1), u), v)
}
export const fbm = (x: number, z: number) => vnoise(x, z) * 0.6 + vnoise(x * 2.1, z * 2.1) * 0.28 + vnoise(x * 4.3, z * 4.3) * 0.12

const PAD_Y = GROUND_FLOOR_LEFT
/** Elevation above sea level (m). */
export function elevation(x: number, z: number) {
  let sw = 1 / 900
  let sr = 0
  for (let i = 0; i < SPOT_HEIGHTS.length; i++) {
    const dx = x - SPOT_HEIGHTS[i][0]
    const dz = z - SPOT_HEIGHTS[i][1]
    const w = 1 / (dx * dx + dz * dz + 9)
    sw += w
    sr += w * residuals[i]
  }
  let h = planeH(x, z) + sr / sw
  h += (fbm(x * 0.35, z * 0.35) - 0.5) * 0.09 // micro-relief
  // level pad below existing house + extension (finished floor at 148.10)
  const b = { x0: Math.min(HOUSE_EXISTING.x0, HOUSE_EXTENSION.x0), x1: Math.max(HOUSE_EXISTING.x1, HOUSE_EXTENSION.x1), z0: HOUSE_EXTENSION.z0, z1: HOUSE_EXISTING.z1 }
  const dx = Math.max(b.x0 - 1 - x, 0, x - (b.x1 + 1))
  const dz = Math.max(b.z0 - 1 - z, 0, z - (b.z1 + 4.4 - 3.3))
  const dist = Math.hypot(dx, dz)
  const wPad = 1 - smooth(0, 4, dist)
  h = lerp(h, PAD_Y - 0.12, wPad)
  return h
}
/** Local y (m) in scene space. */
export const terrainY = (x: number, z: number) => elevation(x, z) - TERRAIN_Y0

/* ---------- paths ---------- */
export function makeCurve(pts: V2[]) {
  const v = pts.map(([x, z]) => new THREE.Vector3(x, 0, z))
  if (v.length < 2) v.push(v[0].clone().add(new THREE.Vector3(1, 0, 0)))
  return new THREE.CatmullRomCurve3(v, false, 'centripetal', 0.5)
}

export interface PathSample {
  x: number
  z: number
  y: number
  tx: number
  tz: number
  s: number // arc length
}
export const BW_MAX_GRADE = 0.08 // 1:12.5 — accessibility target for ramps (EN/ADA ~ 1:12)
export const TERRACE_DECK_Y = GROUND_FLOOR_LEFT - TERRAIN_Y0 - 0.04

/**
 * Samples the boardwalk centre line. The walkway starts at the terrace deck level and then follows the terrain
 * from above, never descending faster than BW_MAX_GRADE: on the 8–9 % slope it rides on piles that get taller
 * downhill (a 'floating' Japanese walkway) instead of becoming a staircase.
 */
export function samplePath(pts: V2[], step = 0.25, lift = 0.28, startY: number | null = TERRACE_DECK_Y): { samples: PathSample[]; length: number } {
  const curve = makeCurve(pts)
  const length = curve.getLength()
  const n = Math.max(2, Math.ceil(length / step))
  const samples: PathSample[] = []
  for (let i = 0; i <= n; i++) {
    const u = i / n
    const p = curve.getPointAt(u)
    const t = curve.getTangentAt(u)
    samples.push({ x: p.x, z: p.z, y: terrainY(p.x, p.z) + lift, tx: t.x, tz: t.z, s: u * length })
  }
  const ds = length / n
  // smooth the terrain-following line
  for (let k = 0; k < 4; k++)
    for (let i = 1; i < samples.length - 1; i++) samples[i].y = (samples[i - 1].y + samples[i].y * 2 + samples[i + 1].y) / 4
  if (startY !== null) samples[0].y = startY
  const floor = (i: number) => terrainY(samples[i].x, samples[i].z) + 0.14
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 1; i < samples.length; i++) samples[i].y = Math.max(samples[i].y, samples[i - 1].y - BW_MAX_GRADE * ds, floor(i))
    for (let i = samples.length - 2; i >= 0; i--) {
      if (i === 0 && startY !== null) continue
      samples[i].y = Math.max(samples[i].y, samples[i + 1].y - BW_MAX_GRADE * ds, floor(i))
    }
  }
  return { samples, length }
}

export function maxGradient(samples: PathSample[]) {
  let g = 0
  for (let i = 1; i < samples.length; i++) {
    const d = Math.hypot(samples[i].x - samples[i - 1].x, samples[i].z - samples[i - 1].z)
    if (d > 1e-3) g = Math.max(g, Math.abs(samples[i].y - samples[i - 1].y) / d)
  }
  return g
}

export function distToPolyline(x: number, z: number, pts: V2[]) {
  let d = Infinity
  for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, distToSegment(x, z, pts[i], pts[i + 1]))
  return d
}

/* ---------- seeded random ---------- */
export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function polyBBox(p: V2[]) {
  const xs = p.map((q) => q[0]), zs = p.map((q) => q[1])
  return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) }
}
