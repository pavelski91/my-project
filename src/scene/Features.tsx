import { useMemo } from 'react'
import * as THREE from 'three'
import type { Feature } from '../data/layouts'
import { useStore } from '../store'
import { terrainY, TERRACE_DECK_Y, rng } from '../lib/geometry'
import { tankCount } from '../lib/analysis'
import { B, Cyl } from './prims'
import { M, flatMat, rakeTexture } from './materials'
import { Inst } from './Inst'
import { usePick, useSunState } from './env'

const stoneGeo = new THREE.IcosahedronGeometry(1, 1)
const coneGeo = new THREE.ConeGeometry(1, 1, 5)

function Boulder({ at, s, c = '#8a8780' }: { at: [number, number, number]; s: [number, number, number]; c?: string }) {
  const m = useMemo(() => flatMat(c, 0.95), [c])
  return <mesh position={at} scale={s} geometry={stoneGeo} material={m} castShadow receiveShadow rotation={[0.3, at[0] * 3, 0.2]} />
}

function FirePit({ f }: { f: Feature }) {
  const { glow: night } = useSunState()
  const stones = useMemo(() => Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2), [])
  return (
    <group>
      <Cyl at={[0, 0.03, 0]} r={0.55} h={0.06} m={M.soil} seg={20} />
      {stones.map((a, i) => <Boulder key={i} at={[Math.cos(a) * 0.55, 0.12, Math.sin(a) * 0.55]} s={[0.13, 0.11, 0.13]} c={i % 2 ? '#77746d' : '#8c8981'} />)}
      {[0, 1, 2, 3].map((i) => (
        <Cyl key={i} at={[Math.cos(i * 1.57 + 0.4) * 1.25, 0.2, Math.sin(i * 1.57 + 0.4) * 1.25]} r={0.2} h={0.5} m={M.tubWood} rot={[Math.PI / 2, 0, i * 1.57 + 0.4 + Math.PI / 2]} seg={10} />
      ))}
      <mesh position={[0, 0.34, 0]} geometry={coneGeo} scale={[0.22, 0.55, 0.22]} visible={night > 0.15}>
        <meshBasicMaterial color="#ff9b45" transparent opacity={0.85} />
      </mesh>
      {night > 0.15 && <pointLight position={[0, 0.7, 0]} color="#ff8a3a" intensity={7 * night} distance={9} decay={1.7} />}
    </group>
  )
}

function Hammock({ f }: { f: Feature }) {
  const geo = useMemo(() => {
    const pts = Array.from({ length: 13 }, (_, i) => {
      const t = i / 12
      const x = (t - 0.5) * (f.w - 0.4)
      const y = 1.35 - Math.sin(Math.PI * t) * 0.55
      return new THREE.Vector3(x, y, 0)
    })
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.4, 8)
  }, [f.w])
  return (
    <group>
      {[-1, 1].map((s) => <B key={s} at={[(s * f.w) / 2, 1.2, 0]} s={[0.18, 2.4, 0.18]} m={M.tubWood} />)}
      <mesh geometry={geo} material={M.fabricSage} scale={[1, 0.25, 1]} position={[0, 0.55, 0]} castShadow />
      {[-1, 1].map((s) => <Cyl key={s} at={[s * (f.w / 2 - 0.25), 2.0, 0]} r={0.012} h={1.0} m={M.rope} rot={[0, 0, s * 0.5]} seg={4} />)}
    </group>
  )
}

function Meditation({ f }: { f: Feature }) {
  const r = f.w / 2
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]} receiveShadow>
        <circleGeometry args={[r, 40]} />
        <meshStandardMaterial map={rakeTexture} roughness={1} />
      </mesh>
      <Boulder at={[-0.5, 0.25, 0.1]} s={[0.55, 0.45, 0.4]} c="#6f7471" />
      <Boulder at={[0.25, 0.18, -0.35]} s={[0.35, 0.3, 0.3]} c="#8d8a80" />
      <Boulder at={[0.1, 0.12, 0.45]} s={[0.22, 0.18, 0.2]} c="#7e8480" />
      <B at={[r - 0.15, 0.2, 0.0]} s={[0.4, 0.07, 1.4]} m={M.light} />
      <B at={[r - 0.15, 0.1, 0.5]} s={[0.3, 0.2, 0.08]} m={M.steel} cast={false} />
      <B at={[r - 0.15, 0.1, -0.5]} s={[0.3, 0.2, 0.08]} m={M.steel} cast={false} />
      {/* niwaki pine: cloud-pruned Scots pine */}
      <group position={[-r + 0.35, 0, -r + 0.45]}>
        <Cyl at={[0, 0.7, 0]} r={0.07} h={1.4} m={M.tubWood} rot={[0.1, 0, 0.15]} seg={8} />
        {[[0, 1.45, 0, 0.55], [-0.35, 1.05, 0.15, 0.4], [0.3, 0.8, -0.1, 0.34]].map(([x, y, z, s], i) => (
          <mesh key={i} position={[x, y, z]} scale={[s * 1.2, s * 0.45, s * 1.2]} geometry={stoneGeo} castShadow>
            <meshStandardMaterial color="#35502e" roughness={0.95} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Dining() {
  return (
    <group position={[0, 0, 0]}>
      <B at={[0, 0.74, 0]} s={[1.7, 0.05, 0.85]} m={M.light} />
      {[[-0.75, -0.35], [0.75, -0.35], [-0.75, 0.35], [0.75, 0.35]].map(([x, z], i) => <B key={i} at={[x, 0.36, z]} s={[0.05, 0.72, 0.05]} m={M.steel} cast={false} />)}
      {[[-0.4, -0.65, 0], [0.4, -0.65, 0], [-0.4, 0.65, Math.PI], [0.4, 0.65, Math.PI]].map(([x, z, a], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, a, 0]}>
          <B at={[0, 0.44, 0]} s={[0.42, 0.04, 0.4]} m={M.light} />
          <B at={[0, 0.72, 0.18]} s={[0.42, 0.5, 0.03]} m={M.light} />
          {[[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]].map(([a1, b1], k) => <B key={k} at={[a1, 0.22, b1]} s={[0.03, 0.44, 0.03]} m={M.steel} cast={false} />)}
        </group>
      ))}
      <Cyl at={[0, 0.82, 0]} r={0.09} h={0.18} m={M.pot} seg={8} />
    </group>
  )
}

function ToolShed({ f }: { f: Feature }) {
  return (
    <group>
      <B at={[0, 0.9, 0]} s={[f.w, 1.8, f.d]} m={M.charred} />
      <B at={[0, 1.88, 0]} s={[f.w + 0.3, 0.07, f.d + 0.3]} m={M.roof} rot={[0.12, 0, 0]} />
      <B at={[0, 0.85, f.d / 2 + 0.01]} s={[f.w - 0.5, 1.5, 0.04]} m={M.larchWarm} />
      <B at={[f.w / 2 - 0.4, 0.8, f.d / 2 + 0.04]} s={[0.04, 0.5, 0.03]} m={M.steelLight} cast={false} />
    </group>
  )
}

function Tanks({ f }: { f: Feature }) {
  const n = tankCount(f.w, f.d)
  const along = f.d >= f.w
  const L = along ? f.d : f.w
  const step = L / n
  return (
    <group>
      <B at={[0, 0.04, 0]} s={[f.w + 0.2, 0.08, f.d + 0.2]} m={M.concrete} />
      {Array.from({ length: n }, (_, i) => {
        const o = -L / 2 + step * (i + 0.5)
        const p: [number, number, number] = along ? [0, 0, o] : [o, 0, 0]
        const r = Math.min(0.55, step / 2 - 0.05, (along ? f.w : f.d) / 2 - 0.02)
        return (
          <group key={i} position={p}>
            <Cyl at={[0, 0.7, 0]} r={r} h={1.25} m={M.tankBlue} seg={20} />
            {Array.from({ length: 16 }, (_, k) => {
              const a = (k / 16) * Math.PI * 2
              return <B key={k} at={[Math.cos(a) * (r + 0.03), 0.72, Math.sin(a) * (r + 0.03)]} s={[0.07, 1.3, 0.025]} m={M.larchWarm} rot={[0, -a + Math.PI / 2, 0]} cast={false} />
            })}
            <Cyl at={[0, 1.36, 0]} r={r + 0.02} h={0.05} m={M.steel} seg={20} />
          </group>
        )
      })}
      <Cyl at={[0, 0.25, along ? -L / 2 - 0.04 : f.d / 2]} r={0.03} h={0.5} m={M.steel} seg={8} rot={[Math.PI / 2, 0, 0]} />
    </group>
  )
}

function Bikes({ f }: { f: Feature }) {
  return (
    <group>
      {[-1, 1].map((s) => <B key={s} at={[(s * (f.w - 0.2)) / 2, 1.1, 0]} s={[0.08, 2.2, 0.08]} m={M.steel} />)}
      <B at={[0, 2.25, 0]} s={[f.w + 0.4, 0.07, f.d + 0.5]} m={M.roof} rot={[0.1, 0, 0]} />
      <B at={[0, 0.06, 0]} s={[f.w, 0.04, f.d]} m={M.concrete} />
      {[-0.4, 0.4].map((x, i) => (
        <group key={i} position={[x, 0.33, 0]} rotation={[0, Math.PI / 2, 0]}>
          {[-0.45, 0.45].map((z, k) => (
            <mesh key={k} position={[0, 0, z]} rotation={[0, Math.PI / 2, 0]} castShadow>
              <torusGeometry args={[0.32, 0.018, 6, 20]} />
              <meshStandardMaterial color="#1c1c1c" />
            </mesh>
          ))}
          <B at={[0, 0.2, 0]} s={[0.025, 0.025, 0.9]} m={M.steelLight} cast={false} />
        </group>
      ))}
    </group>
  )
}

function Compost({ f }: { f: Feature }) {
  const bw = f.w / 3
  return (
    <group>
      {[0, 1, 2].map((i) => {
        const x = -f.w / 2 + bw * (i + 0.5)
        return (
          <group key={i} position={[x, 0, 0]}>
            {[0.2, 0.45, 0.7, 0.95].map((y, k) => <B key={k} at={[0, y, f.d / 2 - 0.02]} s={[bw - 0.04, 0.2, 0.03]} m={M.larchWarm} cast={false} />)}
            {[0.2, 0.45, 0.7, 0.95].map((y, k) => <B key={'b' + k} at={[0, y, -f.d / 2 + 0.02]} s={[bw - 0.04, 0.2, 0.03]} m={M.larchWarm} cast={false} />)}
            <mesh position={[0, 0.3, 0]} scale={[bw * 0.4, 0.28 + i * 0.12, f.d * 0.38]} geometry={stoneGeo} material={M.mulch} castShadow />
          </group>
        )
      })}
      {[-f.w / 2, -f.w / 6, f.w / 6, f.w / 2].map((x, i) => <B key={i} at={[x, 0.55, 0]} s={[0.06, 1.1, f.d]} m={M.larchWarm} />)}
    </group>
  )
}

function Pond({ f }: { f: Feature }) {
  const y = -0.12
  const rx = f.w / 2, rz = f.d / 2
  const r = useMemo(() => rng(Math.round(f.x * 7 + f.z)), [f.x, f.z])
  const rim = useMemo(() => Array.from({ length: 26 }, (_, i) => ({ a: (i / 26) * Math.PI * 2 + r() * 0.15, s: 0.16 + r() * 0.16 })), [r])
  const reeds = useMemo(() => Array.from({ length: 70 }, () => ({ a: r() * 6.28, k: 0.8 + r() * 0.25, h: 0.7 + r() * 0.8 })), [r])
  return (
    <group>
      <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[rx, rz, 1]} receiveShadow>
        <circleGeometry args={[1, 40]} />
        <primitive object={M.water} attach="material" />
      </mesh>
      {rim.map((s, i) => <Boulder key={i} at={[Math.cos(s.a) * (rx + 0.1), y + 0.04, Math.sin(s.a) * (rz + 0.1)]} s={[s.s, s.s * 0.6, s.s]} c={i % 3 ? '#7d7b73' : '#6c6f6b'} />)}
      <Inst
        count={reeds.length}
        geometry={coneGeo}
        material={M.green}
        cast={false}
        deps={[reeds, rx, rz]}
        fill={(i, o, c) => {
          const e = reeds[i]
          o.position.set(Math.cos(e.a) * rx * e.k, y + e.h / 2, Math.sin(e.a) * rz * e.k)
          o.scale.set(0.03, e.h, 0.03)
          c.setRGB(0.5, 0.7, 0.35)
        }}
      />
      {[[-0.4, 0.2], [0.3, -0.3], [0.6, 0.35], [-0.7, -0.2], [0.0, 0.5], [0.45, 0.05], [-0.15, -0.55], [0.75, -0.25]].map(([x, z], i) => (
        <mesh key={i} position={[x * rx, y + 0.01, z * rz]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.16, 10]} />
          <meshStandardMaterial color="#4f7a3a" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* timber jetty with posts, a bench and stepping stones across the shallow end */}
      <B at={[0, y + 0.2, rz + 0.5]} s={[1.7, 0.07, 1.2]} m={M.deck} />
      {[-0.75, 0.75].map((x, i) => <B key={i} at={[x, y + 0.0, rz + 1.0]} s={[0.1, 0.5, 0.1]} m={M.steel} cast={false} />)}
      <B at={[0, y + 0.45, rz + 1.0]} s={[1.5, 0.05, 0.28]} m={M.light} />
      {[-0.9, -0.45, 0, 0.45, 0.9].map((k, i) => <Boulder key={'st' + i} at={[k * rx * 0.85, y + 0.02, -rz * 0.55 + (i % 2) * 0.12]} s={[0.26, 0.07, 0.22]} c="#9a978d" />)}
    </group>
  )
}

function RainGarden({ f }: { f: Feature }) {
  const r = useMemo(() => rng(Math.round(f.x * 11 + f.z * 3)), [f.x, f.z])
  const stones = useMemo(() => Array.from({ length: 22 }, () => ({ a: r() * 6.28, k: r() * 0.8, s: 0.06 + r() * 0.1 })), [r])
  const sedges = useMemo(() => Array.from({ length: 46 }, () => ({ a: r() * 6.28, k: Math.sqrt(r()) * 0.85, h: 0.5 + r() * 0.7 })), [r])
  return (
    <group>
      {stones.map((s, i) => <Boulder key={i} at={[Math.cos(s.a) * f.w * 0.5 * s.k, -0.1, Math.sin(s.a) * f.d * 0.5 * s.k]} s={[s.s, s.s * 0.6, s.s]} c="#85827a" />)}
      <Inst
        count={sedges.length}
        geometry={coneGeo}
        material={M.green}
        cast={false}
        deps={[sedges, f.w, f.d]}
        fill={(i, o, c) => {
          const e = sedges[i]
          o.position.set(Math.cos(e.a) * f.w * 0.5 * e.k, -0.1 + e.h / 2, Math.sin(e.a) * f.d * 0.5 * e.k)
          o.scale.set(0.07, e.h, 0.07)
          c.setRGB(0.55 + r() * 0.15, 0.72, 0.38)
        }}
      />
      {/* inlet swale stones from the downpipe */}
      <B at={[0, -0.12, -f.d / 2 - 0.6]} s={[0.35, 0.05, 1.2]} m={M.stone} cast={false} />
    </group>
  )
}

function Beds({ f }: { f: Feature }) {
  const n = 3
  const bw = (f.w - 0.2 * (n - 1)) / n
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const x = -f.w / 2 + bw / 2 + i * (bw + 0.2)
        return (
          <group key={i} position={[x, 0, 0]}>
            <B at={[0, 0.2, 0]} s={[bw, 0.4, f.d]} m={M.larchWarm} />
            <B at={[0, 0.39, 0]} s={[bw - 0.1, 0.04, f.d - 0.1]} m={M.soil} cast={false} />
            {Array.from({ length: Math.floor(f.d / 0.3) }, (_, k) => (
              <mesh key={k} position={[(k % 2 ? -1 : 1) * bw * 0.18, 0.52, -f.d / 2 + 0.2 + k * 0.3]} scale={[0.17, 0.12, 0.17]} geometry={stoneGeo} material={i === 1 ? M.fabricSage : M.green} />
            ))}
          </group>
        )
      })}
    </group>
  )
}

function Habitat({ f }: { f: Feature }) {
  return (
    <group>
      {/* log pile */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Cyl key={i} at={[-0.6 + (i % 3) * 0.28, 0.12 + Math.floor(i / 3) * 0.2, 0.2]} r={0.13} h={1.2} m={M.mulch} rot={[Math.PI / 2, 0, 0.1 * i]} seg={8} />
      ))}
      {/* standing deadwood snag */}
      <Cyl at={[0.2, 1.1, -0.35]} r={0.12} h={2.2} m={M.mulch} rot={[0.03, 0, -0.04]} seg={8} />
      <B at={[0.2, 1.4, -0.22]} s={[0.07, 0.08, 0.04]} m={M.plasterDark} cast={false} />
      {/* insect hotel on post */}
      <B at={[0.9, 0.55, 0.1]} s={[0.07, 1.1, 0.07]} m={M.tubWood} />
      <group position={[0.9, 1.25, 0.1]}>
        <B at={[0, 0, 0]} s={[0.5, 0.45, 0.2]} m={M.larchWarm} />
        {Array.from({ length: 4 }, (_, i) => Array.from({ length: 3 }, (_, j) => (
          <Cyl key={i + '' + j} at={[-0.18 + i * 0.12, -0.14 + j * 0.14, 0.11]} r={0.04} h={0.04} m={[M.plasterDark, M.tubWood, M.stone][(i + j) % 3]} rot={[Math.PI / 2, 0, 0]} seg={8} cast={false} />
        )))}
        <B at={[0, 0.27, 0.05]} s={[0.6, 0.04, 0.34]} m={M.roof} rot={[0.15, 0, 0]} cast={false} />
      </group>
      {/* bird box */}
      <B at={[-0.9, 1.1, -0.4]} s={[0.05, 2.2, 0.05]} m={M.tubWood} />
      <B at={[-0.9, 2.1, -0.35]} s={[0.2, 0.28, 0.18]} m={M.larchWarm} />
      <B at={[-0.9, 2.28, -0.35]} s={[0.26, 0.03, 0.24]} m={M.roof} rot={[0.12, 0, 0]} cast={false} />
    </group>
  )
}

function Platform({ f }: { f: Feature }) {
  return (
    <group>
      <B at={[0, 0.2, 0]} s={[f.w, 0.08, f.d]} m={M.deck} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <B key={i} at={[(a * (f.w - 0.2)) / 2, 0.08, (b * (f.d - 0.2)) / 2]} s={[0.1, 0.2, 0.1]} m={M.steel} cast={false} />)}
      <B at={[0, 0.45, -f.d / 2 + 0.3]} s={[f.w - 0.4, 0.07, 0.4]} m={M.light} />
      <B at={[0, 0.3, -f.d / 2 + 0.3]} s={[f.w - 0.5, 0.25, 0.3]} m={M.steel} cast={false} />
      <Cyl at={[0, 0.4, 0.3]} r={0.28} h={0.35} m={M.tubWood} seg={10} />
    </group>
  )
}

export function FeatureView({ f }: { f: Feature }) {
  const pick = usePick(f.id)
  const y = f.kind === 'dining' ? TERRACE_DECK_Y : terrainY(f.x, f.z)
  const rot = (f.rot * Math.PI) / 180
  let body = null
  switch (f.kind) {
    case 'firepit': body = <FirePit f={f} />; break
    case 'hammock': body = <Hammock f={f} />; break
    case 'meditation': body = <Meditation f={f} />; break
    case 'dining': body = <Dining />; break
    case 'toolshed': body = <ToolShed f={f} />; break
    case 'tanks': body = <Tanks f={f} />; break
    case 'bikes': body = <Bikes f={f} />; break
    case 'compost': body = <Compost f={f} />; break
    case 'pond': body = <Pond f={f} />; break
    case 'raingarden': body = <RainGarden f={f} />; break
    case 'beds': body = <Beds f={f} />; break
    case 'habitat': body = <Habitat f={f} />; break
    case 'platform': body = <Platform f={f} />; break
  }
  return (
    <group position={[f.x, y, f.z]} rotation={[0, rot, 0]} {...pick}>
      {body}
    </group>
  )
}

export function Features() {
  const feats = useStore((s) => s.layout.features)
  const phase = useStore((s) => s.phase)
  return (
    <group>
      {feats.filter((f) => f.enabled && f.phase <= phase).map((f) => (
        <FeatureView key={f.id} f={f} />
      ))}
    </group>
  )
}
