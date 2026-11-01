import * as THREE from 'three'
import { useMemo } from 'react'
import { M, boxGeo } from './materials'

type V3 = [number, number, number]

/** Box by centre position + size. */
export function B({
  at, s, m, rot, cast = true, recv = true, name, visible = true, onClick,
}: {
  at: V3; s: V3; m: THREE.Material; rot?: V3; cast?: boolean; recv?: boolean; name?: string; visible?: boolean; onClick?: () => void
}) {
  return (
    <mesh position={at} rotation={rot} geometry={boxGeo(s[0], s[1], s[2])} material={m} castShadow={cast} receiveShadow={recv} name={name} visible={visible} onClick={onClick} />
  )
}

const cylCache = new Map<string, THREE.CylinderGeometry>()
export function Cyl({
  at, r, h, m, rot, seg = 20, r2, cast = true, open = false,
}: { at: V3; r: number; h: number; m: THREE.Material; rot?: V3; seg?: number; r2?: number; cast?: boolean; open?: boolean }) {
  const key = `${r}|${r2 ?? r}|${h}|${seg}|${open}`
  let g = cylCache.get(key)
  if (!g) {
    g = new THREE.CylinderGeometry(r2 ?? r, r, h, seg, 1, open)
    cylCache.set(key, g)
  }
  return <mesh position={at} rotation={rot} geometry={g} material={m} castShadow={cast} receiveShadow />
}

export interface Opening {
  x0: number
  x1: number
  y0: number
  y1: number
  mullions?: number
  door?: boolean
  fixed?: boolean
}

/** Wall (along local x, from -L/2..L/2, y 0..H) with true openings. */
export function Wall({
  L, H, t, openings = [], m, at, rot, cast = true,
}: { L: number; H: number; t: number; openings?: Opening[]; m: THREE.Material; at: V3; rot?: V3; cast?: boolean }) {
  const parts = useMemo(() => {
    const out: { x0: number; x1: number; y0: number; y1: number }[] = []
    const ops = [...openings].sort((a, b) => a.x0 - b.x0)
    let cur = -L / 2
    for (const o of ops) {
      if (o.x0 > cur + 1e-3) out.push({ x0: cur, x1: o.x0, y0: 0, y1: H })
      if (o.y0 > 1e-3) out.push({ x0: o.x0, x1: o.x1, y0: 0, y1: o.y0 })
      if (o.y1 < H - 1e-3) out.push({ x0: o.x0, x1: o.x1, y0: o.y1, y1: H })
      cur = o.x1
    }
    if (cur < L / 2 - 1e-3) out.push({ x0: cur, x1: L / 2, y0: 0, y1: H })
    return out
  }, [L, H, openings])
  return (
    <group position={at} rotation={rot}>
      {parts.map((p, i) => (
        <mesh key={i} position={[(p.x0 + p.x1) / 2, (p.y0 + p.y1) / 2, 0]} geometry={boxGeo(p.x1 - p.x0, p.y1 - p.y0, t)} material={m} castShadow={cast} receiveShadow />
      ))}
    </group>
  )
}

/** Dark-framed glazing sitting in a wall opening (wall plane = local z 0). */
export function Glazing({ o, wallT, at = [0, 0, 0], rot, frame = 0.055, glass = M.glass }: { o: Opening; wallT: number; at?: V3; rot?: V3; frame?: number; glass?: THREE.Material }) {
  const w = o.x1 - o.x0
  const h = o.y1 - o.y0
  const cx = (o.x0 + o.x1) / 2
  const cy = (o.y0 + o.y1) / 2
  const n = o.mullions ?? 0
  const zf = wallT * 0.28
  return (
    <group position={at} rotation={rot}>
      <mesh position={[cx, cy, 0]} material={glass} castShadow={false}>
        <planeGeometry args={[w - 0.02, h - 0.02]} />
      </mesh>
      <B at={[cx, o.y1 - frame / 2, zf]} s={[w, frame, wallT * 0.5]} m={M.steel} cast={false} />
      <B at={[cx, o.y0 + frame / 2, zf]} s={[w, frame, wallT * 0.5]} m={M.steel} cast={false} />
      <B at={[o.x0 + frame / 2, cy, zf]} s={[frame, h, wallT * 0.5]} m={M.steel} cast={false} />
      <B at={[o.x1 - frame / 2, cy, zf]} s={[frame, h, wallT * 0.5]} m={M.steel} cast={false} />
      {Array.from({ length: n }, (_, i) => (
        <B key={i} at={[o.x0 + (w * (i + 1)) / (n + 1), cy, zf]} s={[frame * 0.8, h, wallT * 0.4]} m={M.steel} cast={false} />
      ))}
      {o.door && <B at={[cx + w * 0.18, cy, wallT * 0.3]} s={[0.025, 0.9, 0.03]} m={M.steelLight} cast={false} />}
    </group>
  )
}

/** Gable (triangular) infill, width W, rise R, depth D, extruded along z. UVs are in metres. */
export function Gable({ W, R, D, m, at, rot }: { W: number; R: number; D: number; m: THREE.Material; at: V3; rot?: V3 }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-W / 2, 0)
    s.lineTo(W / 2, 0)
    s.lineTo(0, R)
    s.closePath()
    return new THREE.ExtrudeGeometry(s, { depth: D, bevelEnabled: false })
  }, [W, R, D])
  return <mesh geometry={geo} material={m} position={at} rotation={rot} castShadow receiveShadow />
}

/**
 * Gable roof, ridge along local z. Returns two sloped slabs (+ optional soffit lining).
 * `endOv` = overhang at [-z, +z] ends.
 */
export function GableRoof({
  W, L, eave, pitch, ov = 0.4, endOv = [0.3, 0.3], th = 0.07, lining = true, snow = 0,
}: { W: number; L: number; eave: number; pitch: number; ov?: number; endOv?: [number, number]; th?: number; lining?: boolean; snow?: number }) {
  const run = W / 2 + ov
  const tan = Math.tan(pitch)
  const slopeLen = run / Math.cos(pitch)
  const ridgeY = eave + (W / 2) * tan
  const midY = (ridgeY + eave - ov * tan) / 2
  const len = L + endOv[0] + endOv[1]
  const zc = (endOv[1] - endOv[0]) / 2
  const roofMat = useMemo(() => {
    if (!snow) return M.roofSlope
    const m = M.roofSlope.clone()
    m.color.lerp(new THREE.Color('#e8edf0'), snow * 0.85)
    m.metalness = 0.6 * (1 - snow)
    return m
  }, [snow])
  return (
    <group>
      {[1, -1].map((sgn) => (
        <group key={sgn}>
          <mesh
            position={[(sgn * run) / 2, midY + th / 2, zc]}
            rotation={[0, 0, -sgn * pitch]}
            geometry={boxGeo(slopeLen, th, len)}
            material={roofMat}
            castShadow
            receiveShadow
          />
          {lining && (
            <mesh
              position={[(sgn * run) / 2, midY - 0.1, zc]}
              rotation={[0, 0, -sgn * pitch]}
              geometry={boxGeo(slopeLen - 0.1, 0.03, len - 0.1)}
              material={M.light}
              receiveShadow
            />
          )}
        </group>
      ))}
      {/* ridge cap */}
      <B at={[0, ridgeY + th + 0.02, zc]} s={[0.22, 0.06, len]} m={M.steel} cast={false} rot={[0, 0, 0]} />
      {/* eave gutters */}
      {[1, -1].map((sgn) => (
        <B key={'g' + sgn} at={[sgn * (run - 0.02), eave - ov * tan - 0.05, zc]} s={[0.1, 0.1, len]} m={M.steel} cast={false} />
      ))}
    </group>
  )
}

/** Mono-pitch roof. High side at +z (view side) rising from `low` to `high` over depth D, ridge along x. */
export function MonoRoof({
  W, D, low, high, ov = 0.5, ovFront = 0.9, th = 0.08, snow = 0,
}: { W: number; D: number; low: number; high: number; ov?: number; ovFront?: number; th?: number; snow?: number }) {
  // plane rises toward +z... (front/view side high), overhang bigger on view side
  const zBack = -D / 2 - ov
  const zFront = D / 2 + ovFront
  const slope = (high - low) / D
  const yBack = low - slope * ov
  const yFront = high + slope * ovFront
  const run = zFront - zBack
  const rise = yFront - yBack
  const len = Math.hypot(run, rise)
  const ang = Math.atan2(rise, run)
  const roofMat = useMemo(() => {
    if (!snow) return M.roof
    const m = M.roof.clone()
    m.color.lerp(new THREE.Color('#e8edf0'), snow * 0.85)
    m.metalness = 0.6 * (1 - snow)
    return m
  }, [snow])
  return (
    <group>
      <mesh
        position={[0, (yBack + yFront) / 2 + th / 2, (zBack + zFront) / 2]}
        rotation={[-ang, 0, 0]}
        geometry={boxGeo(W + 2 * ov, th, len)}
        material={roofMat}
        castShadow
        receiveShadow
      />
      <mesh
        position={[0, (yBack + yFront) / 2 - 0.07, (zBack + zFront) / 2]}
        rotation={[-ang, 0, 0]}
        geometry={boxGeo(W + 2 * ov - 0.1, 0.03, len - 0.1)}
        material={M.light}
        receiveShadow
      />
    </group>
  )
}
