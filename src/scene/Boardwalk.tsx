import { useMemo } from 'react'
import * as THREE from 'three'
import { useStore } from '../store'
import { terrainY, type PathSample } from '../lib/geometry'
import { Inst } from './Inst'
import { M } from './materials'
import { useWalk } from './useWalk'
import { usePick, useSunState } from './env'

const plankGeo = new THREE.BoxGeometry(1, 0.045, 0.135)
// UVs in metres: top face width follows the boardwalk width
const bearerGeo = new THREE.BoxGeometry(0.08, 0.14, 1)
const pileGeo = new THREE.BoxGeometry(0.1, 1, 0.1)
const footGeo = new THREE.BoxGeometry(0.22, 0.08, 0.22)
const lampGeo = new THREE.BoxGeometry(0.07, 0.07, 0.22)
const railPostGeo = new THREE.BoxGeometry(0.045, 0.95, 0.045)
const railGeo = new THREE.BoxGeometry(0.04, 0.04, 1)

function at(samples: PathSample[], s: number): PathSample {
  const ds = samples[1].s - samples[0].s
  const i = Math.min(samples.length - 2, Math.max(0, Math.floor(s / ds)))
  const t = (s - samples[i].s) / ds
  const a = samples[i], b = samples[i + 1]
  const l = (p: number, q: number) => p + (q - p) * t
  return { x: l(a.x, b.x), z: l(a.z, b.z), y: l(a.y, b.y), tx: l(a.tx, b.tx), tz: l(a.tz, b.tz), s }
}

export function Boardwalk() {
  const phase = useStore((s) => s.phase)
  const on = useStore((s) => s.layers.boardwalk)
  const lights = useStore((s) => s.layers.lights)
  const width = useStore((s) => s.layout.boardwalkWidth)
  const { samples, length } = useWalk()
  const pick = usePick('boardwalk')
  const { night } = useSunState()

  const data = useMemo(() => {
    const planks: { p: PathSample; slope: number }[] = []
    for (let s = 0.08; s < length; s += 0.172) {
      const p = at(samples, s)
      const q = at(samples, Math.min(length, s + 0.2))
      const slope = (q.y - p.y) / Math.max(0.01, Math.hypot(q.x - p.x, q.z - p.z))
      planks.push({ p, slope })
    }
    const bearers: { p: PathSample; side: number; slope: number }[] = []
    for (let s = 0.17; s < length; s += 0.34) {
      const p = at(samples, s)
      const q = at(samples, Math.min(length, s + 0.3))
      const slope = (q.y - p.y) / Math.max(0.01, Math.hypot(q.x - p.x, q.z - p.z))
      bearers.push({ p, side: -1, slope }, { p, side: 1, slope })
    }
    const piles: { x: number; z: number; top: number; ground: number }[] = []
    for (let s = 0.4; s < length; s += 1.7) {
      const p = at(samples, s)
      const nx = -p.tz, nz = p.tx
      for (const sd of [-1, 1]) {
        const x = p.x + nx * sd * (width / 2 - 0.12)
        const z = p.z + nz * sd * (width / 2 - 0.12)
        piles.push({ x, z, top: p.y - 0.1, ground: terrainY(x, z) })
      }
    }
    const lamps: PathSample[] = []
    for (let s = 1.0; s < length; s += 2.4) lamps.push(at(samples, s))
    const rails: { p: PathSample; side: number }[] = []
    const railPosts: { x: number; z: number; y: number }[] = []
    for (let s = 0.2; s < length; s += 0.3) {
      const p = at(samples, s)
      if (p.y - terrainY(p.x, p.z) > 0.8) for (const sd of [-1, 1]) rails.push({ p, side: sd })
    }
    for (let s = 0.2; s < length; s += 1.5) {
      const p = at(samples, s)
      if (p.y - terrainY(p.x, p.z) > 0.8)
        for (const sd of [-1, 1]) railPosts.push({ x: p.x + -p.tz * sd * (width / 2 - 0.03), z: p.z + p.tx * sd * (width / 2 - 0.03), y: p.y })
    }
    return { planks, bearers, piles, lamps, rails, railPosts }
  }, [samples, length, width])

  if (phase < 2 || !on) return null
  const hash = (i: number) => {
    const s = Math.sin(i * 12.9898) * 43758.5453
    return s - Math.floor(s)
  }
  return (
    <group {...pick}>
      <Inst
        count={data.planks.length}
        geometry={plankGeo}
        material={M.walk}
        deps={[data, width]}
        fill={(i, o, c) => {
          const { p, slope } = data.planks[i]
          o.position.set(p.x, p.y, p.z)
          o.rotation.order = 'YXZ'
          o.rotation.set(-Math.atan(slope), Math.atan2(p.tx, p.tz), 0)
          o.scale.set(width, 1, 1)
          const v = 0.82 + hash(i) * 0.3
          c.setRGB(v, v * (0.97 + hash(i + 9) * 0.05), v * 0.96)
        }}
      />
      <Inst
        count={data.bearers.length}
        geometry={bearerGeo}
        material={M.steel}
        deps={[data, width]}
        fill={(i, o) => {
          const b = data.bearers[i]
          const nx = -b.p.tz, nz = b.p.tx
          o.position.set(b.p.x + nx * b.side * (width / 2 - 0.2), b.p.y - 0.1, b.p.z + nz * b.side * (width / 2 - 0.2))
          o.rotation.order = 'YXZ'
          o.rotation.set(-Math.atan(b.slope), Math.atan2(b.p.tx, b.p.tz), 0)
          o.scale.set(1, 1, 0.36)
        }}
      />
      <Inst
        count={data.piles.length}
        geometry={pileGeo}
        material={M.steel}
        deps={[data]}
        fill={(i, o) => {
          const p = data.piles[i]
          const h = Math.max(0.05, p.top - p.ground + 0.15)
          o.position.set(p.x, p.ground - 0.15 + h / 2, p.z)
          o.scale.set(1, h, 1)
        }}
      />
      <Inst
        count={data.piles.length}
        geometry={footGeo}
        material={M.concrete}
        deps={[data]}
        fill={(i, o) => {
          const p = data.piles[i]
          o.position.set(p.x, p.ground - 0.05, p.z)
        }}
      />
      <Inst
        count={data.rails.length}
        geometry={railGeo}
        material={M.steel}
        deps={[data, width]}
        fill={(i, o) => {
          const r = data.rails[i]
          o.position.set(r.p.x + -r.p.tz * r.side * (width / 2 - 0.03), r.p.y + 0.95, r.p.z + r.p.tx * r.side * (width / 2 - 0.03))
          o.rotation.set(0, Math.atan2(r.p.tx, r.p.tz), 0)
          o.scale.set(1, 1, 0.31)
        }}
      />
      <Inst
        count={data.railPosts.length}
        geometry={railPostGeo}
        material={M.steel}
        deps={[data]}
        fill={(i, o) => {
          const r = data.railPosts[i]
          o.position.set(r.x, r.y + 0.47, r.z)
        }}
      />
      {lights && (
        <Inst
          count={data.lamps.length}
          geometry={lampGeo}
          material={M.lamp}
          cast={false}
          deps={[data, width]}
          fill={(i, o) => {
            const p = data.lamps[i]
            const side = i % 2 ? 1 : -1
            o.position.set(p.x + -p.tz * side * (width / 2 + 0.0), p.y + 0.06, p.z + p.tx * side * (width / 2 + 0.0))
            o.rotation.set(0, Math.atan2(p.tx, p.tz), 0)
          }}
        />
      )}
      {lights && night > 0.3 &&
        data.lamps.filter((_, i) => i % 3 === 0).map((p, i) => (
          <pointLight key={i} position={[p.x, p.y + 0.5, p.z]} intensity={1.1 * night} distance={5} color="#ffb870" decay={1.8} />
        ))}
    </group>
  )
}
