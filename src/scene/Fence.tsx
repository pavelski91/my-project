import { useMemo } from 'react'
import * as THREE from 'three'
import { useStore } from '../store'
import { ENTRANCE, PLOT } from '../data/site'
import { terrainY } from '../lib/geometry'
import { Inst } from './Inst'
import { B, Cyl } from './prims'
import { M, boxGeo } from './materials'
import { usePick } from './env'

type Style = 'privacy' | 'slat' | 'rail'
const EDGE_STYLE: Style[] = ['privacy', 'privacy', 'slat', 'rail', 'rail', 'privacy', 'privacy'] // AB BC CD DE EF FG GA
const EDGE_H: Record<Style, number> = { privacy: 1.7, slat: 1.5, rail: 1.2 }

const boardGeo = new THREE.BoxGeometry(0.11, 1, 0.03)
const slatGeo = new THREE.BoxGeometry(1, 0.1, 0.035)
const railGeo = new THREE.BoxGeometry(1, 0.07, 0.045)
const postGeo = new THREE.BoxGeometry(0.08, 1, 0.08)

interface Seg {
  ax: number; az: number; bx: number; bz: number; len: number; dx: number; dz: number; style: Style; gates: [number, number][]
}

export function gatePos(edge: number, x: number) {
  const a = PLOT[edge], b = PLOT[(edge + 1) % PLOT.length]
  const t = (x - a[0]) / (b[0] - a[0])
  return { x, z: a[1] + (b[1] - a[1]) * t, ang: -Math.atan2(b[1] - a[1], b[0] - a[0]) }
}

export function Fence() {
  const on = useStore((s) => s.layers.fences)
  const phase = useStore((s) => s.phase)
  const pick = usePick('fence')

  const { segs, boards, slats, rails, posts } = useMemo(() => {
    const segs: Seg[] = []
    for (let i = 0; i < PLOT.length; i++) {
      const a = PLOT[i], b = PLOT[(i + 1) % PLOT.length]
      const len = Math.hypot(b[0] - a[0], b[1] - a[1])
      const dx = (b[0] - a[0]) / len, dz = (b[1] - a[1]) / len
      const gates: [number, number][] = []
      const addGate = (x: number, w: number) => {
        const s = ((x - a[0]) * dx + (a[1] + (b[1] - a[1]) * ((x - a[0]) / (b[0] - a[0])) - a[1]) * dz)
        gates.push([s - w / 2, s + w / 2])
      }
      if (i === 0) {
        addGate(ENTRANCE.gate.x, ENTRANCE.gate.width + 0.3)
        addGate(ENTRANCE.pedestrian.x, 1.2)
      }
      if (i === 4) addGate(ENTRANCE.service.x, 1.3)
      segs.push({ ax: a[0], az: a[1], bx: b[0], bz: b[1], len, dx, dz, style: EDGE_STYLE[i], gates })
    }
    const boards: { x: number; z: number; ang: number; h: number }[] = []
    const slats: { x: number; z: number; ang: number; y: number; l: number }[] = []
    const rails: { x: number; z: number; ang: number; y: number; l: number }[] = []
    const posts: { x: number; z: number; h: number }[] = []
    for (const s of segs) {
      const ang = -Math.atan2(s.dz, s.dx)
      const inGate = (d: number, pad = 0) => s.gates.some(([g0, g1]) => d > g0 - pad && d < g1 + pad)
      const H = EDGE_H[s.style]
      const nPosts = Math.max(1, Math.round(s.len / 2.4))
      const step = s.len / nPosts
      for (let k = 0; k <= nPosts; k++) {
        const d = k * step
        if (inGate(d, -0.05)) continue
        const x = s.ax + s.dx * d, z = s.az + s.dz * d
        posts.push({ x, z, h: H + 0.15 })
      }
      // gate-side posts
      for (const [g0, g1] of s.gates) for (const d of [g0, g1]) posts.push({ x: s.ax + s.dx * d, z: s.az + s.dz * d, h: H + 0.45 })
      if (s.style === 'privacy') {
        for (let d = 0.08; d < s.len; d += 0.135) {
          if (inGate(d)) continue
          const x = s.ax + s.dx * d, z = s.az + s.dz * d
          boards.push({ x, z, ang, h: H })
        }
      } else if (s.style === 'slat') {
        for (let d = 0; d < s.len; d += 1.2) {
          const l = Math.min(1.2, s.len - d)
          const mid = d + l / 2
          if (inGate(mid)) continue
          for (let r = 0; r < 5; r++) slats.push({ x: s.ax + s.dx * mid, z: s.az + s.dz * mid, ang, y: 0.3 + r * 0.26, l })
        }
      } else {
        for (let d = 0; d < s.len; d += 1.2) {
          const l = Math.min(1.2, s.len - d)
          const mid = d + l / 2
          if (inGate(mid)) continue
          for (const y of [0.55, 1.0]) rails.push({ x: s.ax + s.dx * mid, z: s.az + s.dz * mid, ang, y, l })
        }
      }
    }
    return { segs, boards, slats, rails, posts }
  }, [])

  if (!on || phase < 2) return null
  const g = ENTRANCE.gate
  const gp = gatePos(0, g.x)
  const pp = gatePos(0, ENTRANCE.pedestrian.x)
  const sp = gatePos(4, ENTRANCE.service.x)
  void segs
  const hv = (i: number) => {
    const s = Math.sin(i * 7.31) * 9999
    return s - Math.floor(s)
  }
  return (
    <group {...pick}>
      <Inst count={posts.length} geometry={postGeo} material={M.steel} deps={[posts]} fill={(i, o) => { const p = posts[i]; const y = terrainY(p.x, p.z); o.position.set(p.x, y + p.h / 2 - 0.2, p.z); o.scale.set(1, p.h + 0.2, 1) }} />
      <Inst
        count={boards.length}
        geometry={boardGeo}
        material={M.larchWarm}
        deps={[boards]}
        fill={(i, o, c) => {
          const b = boards[i]
          const y = terrainY(b.x, b.z)
          const h = b.h - 0.1 - hv(i) * 0.05
          o.position.set(b.x, y + 0.13 + h / 2, b.z) // 13 cm gap under the boards for hedgehogs & small mammals
          o.rotation.set(0, b.ang, 0)
          o.scale.set(1, h, 1)
          const v = 0.78 + hv(i + 3) * 0.35
          c.setRGB(v, v * 0.97, v * 0.93)
        }}
      />
      <Inst count={slats.length} geometry={slatGeo} material={M.larchWarm} deps={[slats]} fill={(i, o) => { const s = slats[i]; o.position.set(s.x, terrainY(s.x, s.z) + s.y, s.z); o.rotation.set(0, s.ang, 0); o.scale.set(s.l * 0.98, 1, 1) }} />
      <Inst count={rails.length} geometry={railGeo} material={M.larchWarm} deps={[rails]} fill={(i, o) => { const s = rails[i]; o.position.set(s.x, terrainY(s.x, s.z) + s.y, s.z); o.rotation.set(0, s.ang, 0); o.scale.set(s.l * 0.98, 1, 1) }} />

      {/* vehicle gate: sliding, dark steel frame with timber infill */}
      <group position={[gp.x, terrainY(gp.x, gp.z), gp.z]} rotation={[0, gp.ang, 0]}>
        <B at={[-g.width / 2 - 0.1, 1.1, 0]} s={[0.22, 2.2, 0.22]} m={M.steel} />
        <B at={[g.width / 2 + 0.1, 1.1, 0]} s={[0.22, 2.2, 0.22]} m={M.steel} />
        <B at={[0, 1.78, 0]} s={[g.width, 0.06, 0.06]} m={M.steel} />
        <B at={[0, 0.2, 0]} s={[g.width, 0.06, 0.06]} m={M.steel} />
        {Array.from({ length: Math.floor(g.width / 0.14) }, (_, i) => (
          <B key={i} at={[-g.width / 2 + 0.08 + i * 0.14, 1.0, 0.02]} s={[0.09, 1.5, 0.03]} m={M.larchWarm} />
        ))}
        <B at={[g.width / 2 + 1.7, 0.1, 0]} s={[3.4, 0.05, 0.1]} m={M.steel} cast={false} />
        <B at={[-g.width / 2 - 0.1, 2.28, 0]} s={[0.14, 0.18, 0.14]} m={M.lamp} cast={false} />
      </group>
      {/* pedestrian gate */}
      <group position={[pp.x, terrainY(pp.x, pp.z), pp.z]} rotation={[0, pp.ang, 0]}>
        <B at={[-0.55, 0.95, 0]} s={[0.1, 1.9, 0.1]} m={M.steel} />
        <B at={[0.55, 0.95, 0]} s={[0.1, 1.9, 0.1]} m={M.steel} />
        <B at={[0, 1.75, 0]} s={[1.1, 0.05, 0.05]} m={M.steel} />
        {Array.from({ length: 6 }, (_, i) => <B key={i} at={[-0.4 + i * 0.16, 0.9, 0.02]} s={[0.1, 1.45, 0.03]} m={M.larchWarm} />)}
        <B at={[0.4, 0.95, 0.06]} s={[0.03, 0.2, 0.04]} m={M.steelLight} cast={false} />
        <B at={[0.7, 1.6, 0.05]} s={[0.08, 0.2, 0.08]} m={M.lamp} cast={false} />
      </group>
      {/* service wicket (south) */}
      <group position={[sp.x, terrainY(sp.x, sp.z), sp.z]} rotation={[0, sp.ang, 0]}>
        <B at={[-0.6, 0.65, 0]} s={[0.1, 1.5, 0.1]} m={M.steel} />
        <B at={[0.6, 0.65, 0]} s={[0.1, 1.5, 0.1]} m={M.steel} />
        <B at={[0, 1.0, 0]} s={[1.1, 0.05, 0.04]} m={M.larchWarm} />
        <B at={[0, 0.55, 0]} s={[1.1, 0.05, 0.04]} m={M.larchWarm} />
        <B at={[0, 0.78, 0]} s={[0.03, 0.5, 0.03]} m={M.steel} />
      </group>
      <WasteStore />
      {/* house number / mailbox */}
      <group position={[pp.x + 1.1, terrainY(pp.x, pp.z), pp.z + 0.1]} rotation={[0, pp.ang, 0]}>
        <B at={[0, 0.6, 0]} s={[0.05, 1.2, 0.05]} m={M.steel} />
        <B at={[0, 1.15, 0]} s={[0.3, 0.2, 0.1]} m={M.steel} />
      </group>
    </group>
  )
}

function WasteStore() {
  const w = ENTRANCE.waste
  const y = terrainY(w.x, w.z)
  return (
    <group position={[w.x, y, w.z]}>
      <B at={[0, 0.03, 0]} s={[w.w, 0.06, w.d]} m={M.concrete} />
      {Array.from({ length: Math.floor(w.w / 0.13) }, (_, i) => <B key={i} at={[-w.w / 2 + 0.07 + i * 0.13, 0.7, w.d / 2 - 0.02]} s={[0.1, 1.3, 0.03]} m={M.larchWarm} />)}
      {Array.from({ length: Math.floor(w.d / 0.13) }, (_, i) => <B key={'s' + i} at={[w.w / 2 - 0.02, 0.7, -w.d / 2 + 0.07 + i * 0.13]} s={[0.03, 1.3, 0.1]} m={M.larchWarm} />)}
      {Array.from({ length: Math.floor(w.d / 0.13) }, (_, i) => <B key={'n' + i} at={[-w.w / 2 + 0.02, 0.7, -w.d / 2 + 0.07 + i * 0.13]} s={[0.03, 1.3, 0.1]} m={M.larchWarm} />)}
      <B at={[0, 1.37, 0]} s={[w.w + 0.05, 0.05, w.d + 0.05]} m={M.steel} />
      {[-0.55, 0.1, 0.75].map((x, i) => <B key={i} at={[x, 0.5, -0.1]} s={[0.55, 0.95, 0.6]} m={M.bin} />)}
    </group>
  )
}

export { Cyl, boxGeo }
