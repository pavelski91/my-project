import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Structure } from '../data/layouts'
import { useStore } from '../store'
import { rectCorners, terrainY } from '../lib/geometry'
import { B, Cyl, Wall, Glazing, Gable, GableRoof, MonoRoof, type Opening } from './prims'
import { M, flatMat, steamTexture } from './materials'
import { usePick, useSunState } from './env'
import { useWalk } from './useWalk'

/** Floor level of a pavilion: matches the boardwalk where it docks, never below the highest corner of the footprint. */
export function useFloorY(s: Structure) {
  const { samples } = useWalk()
  return useMemo(() => {
    let best = Infinity
    let by = 0
    for (const p of samples) {
      const d = Math.hypot(p.x - s.x, p.z - s.z)
      if (d < best) { best = d; by = p.y }
    }
    const corners = rectCorners(s)
    const hi = Math.max(...corners.map(([x, z]) => terrainY(x, z)), terrainY(s.x, s.z))
    const floor = best < 6 && samples.length ? by : hi + 0.3
    return Math.max(floor, hi + 0.2)
  }, [samples, s.x, s.z, s.w, s.d, s.rot])
}

export function Piles({ s, floor }: { s: Structure; floor: number }) {
  const pts = useMemo(() => {
    const a: [number, number, number, number][] = []
    const nx = Math.max(2, Math.round(s.w / 2.2) + 1)
    const nz = Math.max(2, Math.round(s.d / 2.2) + 1)
    const c = Math.cos((s.rot * Math.PI) / 180), sn = Math.sin((s.rot * Math.PI) / 180)
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < nz; j++) {
        if (i > 0 && i < nx - 1 && j > 0 && j < nz - 1) continue
        const lx = -s.w / 2 + 0.2 + (i * (s.w - 0.4)) / (nx - 1)
        const lz = -s.d / 2 + 0.2 + (j * (s.d - 0.4)) / (nz - 1)
        const wx = s.x + lx * c + lz * sn
        const wz = s.z - lx * sn + lz * c
        a.push([lx, lz, terrainY(wx, wz), 0])
      }
    return a
  }, [s.x, s.z, s.w, s.d, s.rot])
  return (
    <group>
      {pts.map(([lx, lz, gy], i) => {
        const h = Math.max(0.1, floor - gy + 0.1)
        return <B key={i} at={[lx, gy - floor + h / 2 - 0.1, lz]} s={[0.15, h, 0.15]} m={M.concrete} />
      })}
      {/* dark skirt board between piles */}
      <B at={[0, -0.2, 0]} s={[s.w + 0.04, 0.36, s.d + 0.04]} m={M.steel} cast={false} />
    </group>
  )
}

const plantGeo = new THREE.IcosahedronGeometry(1, 1)
/** Row of terracotta pots with perennials along a deck edge (local coordinates). */
function Pots({ xs, z, y = 0 }: { xs: number[]; z: number; y?: number }) {
  return (
    <>
      {xs.map((x, i) => (
        <group key={i} position={[x, y, z]}>
          <Cyl at={[0, 0.17, 0]} r={0.17} h={0.34} m={M.pot} seg={10} />
          <mesh position={[0, 0.52, 0]} scale={[0.27, 0.3 + (i % 3) * 0.06, 0.27]} geometry={plantGeo} material={M.green} castShadow />
          {i % 2 === 0 && <mesh position={[0.05, 0.78, 0]} scale={[0.09, 0.06, 0.09]} geometry={plantGeo} material={M.fabricMustard} />}
        </group>
      ))}
    </>
  )
}

/** Rising steam above the bathing tub. */
function Steam() {
  const refs = useRef<(THREE.Sprite | null)[]>([])
  useFrame(({ clock }) => {
    refs.current.forEach((s, i) => {
      if (!s) return
      const t = (clock.elapsedTime * 0.22 + i / 8) % 1
      s.position.set(Math.sin(i * 2.1 + t * 3) * 0.3, t * 1.9, Math.cos(i * 3.3 + t * 2) * 0.3)
      const k = 0.55 + t * 1.2
      s.scale.set(k, k, 1)
      ;(s.material as THREE.SpriteMaterial).opacity = 0.42 * Math.sin(Math.PI * t)
    })
  })
  return (
    <group position={[0, 1.0, 0]}>
      {Array.from({ length: 8 }, (_, i) => (
        <sprite key={i} ref={(el) => { refs.current[i] = el }}>
          <spriteMaterial map={steamTexture} transparent depthWrite={false} color="#ffffff" opacity={0.3} />
        </sprite>
      ))}
    </group>
  )
}

const ox = (x0: number, x1: number, y0: number, y1: number, extra: Partial<Opening> = {}): Opening => ({ x0, x1, y0, y1, ...extra })

/** Trapezoid side wall for mono-pitch volumes: cladding outside, plaster inside. `side` = +1 east / -1 west. */
export function SideWall({ D, low, high, x, m, inner }: { D: number; low: number; high: number; x: number; m: THREE.Material; inner: THREE.Material }) {
  const side = x > 0 ? 1 : -1
  const mk = (depth: number, inset: number) => {
    const sh = new THREE.Shape()
    const k = side > 0 ? 1 : -1
    sh.moveTo(k * (-D / 2 + inset), 0)
    sh.lineTo(k * (D / 2 - inset), 0)
    sh.lineTo(k * (D / 2 - inset), high - inset * 0.2)
    sh.lineTo(k * (-D / 2 + inset), low)
    sh.closePath()
    return new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false })
  }
  const outer = useMemo(() => mk(0.07, 0), [D, low, high, side])
  const inn = useMemo(() => mk(0.2, 0.0), [D, low, high, side])
  const rot = side > 0 ? -Math.PI / 2 : Math.PI / 2
  return (
    <group position={[x, 0, 0]} rotation={[0, rot, 0]}>
      <mesh geometry={outer} material={m} castShadow receiveShadow />
      <mesh geometry={inn} material={inner} position={[0, 0, 0.07]} receiveShadow />
    </group>
  )
}

/* ---------------------------------------------------------------- OFFICE */
export function Office({ s }: { s: Structure }) {
  const floor = useFloorY(s)
  const pick = usePick(s.id)
  const interiors = useStore((st) => st.layers.interiors)
  const { glow: night } = useSunState()
  const w = s.w, d = s.d
  const low = 2.4, high = 3.05
  const front: Opening[] = [ox(-w / 2 + 0.45, w / 2 - 0.45, 0.4, 2.6, { mullions: 1 })]
  const back: Opening[] = [ox(0.35, 1.25, 0, 2.15, { door: true }), ox(-1.2, -0.7, 0.9, 2.1)]
  return (
    <group position={[s.x, floor, s.z]} rotation={[0, (s.rot * Math.PI) / 180, 0]} {...pick}>
      <Piles s={s} floor={floor} />
      <B at={[0, 0.04, 0]} s={[w, 0.08, d]} m={M.light} cast={false} />
      {/* front (+z) glazed, back (-z) entrance */}
      <Wall L={w} H={high} t={0.07} m={M.charred} at={[0, 0, d / 2 - 0.035]} openings={front} />
      <Wall L={w} H={high} t={0.2} m={M.plaster} at={[0, 0, d / 2 - 0.17]} openings={front} />
      {front.map((o, i) => <Glazing key={i} o={o} wallT={0.3} at={[0, 0, d / 2 - 0.1]} />)}
      <Wall L={w} H={low} t={0.07} m={M.charred} at={[0, 0, -d / 2 + 0.035]} openings={back} />
      <Wall L={w} H={low} t={0.2} m={M.plaster} at={[0, 0, -d / 2 + 0.17]} openings={back} />
      {back.map((o, i) => <Glazing key={i} o={o} wallT={0.3} at={[0, 0, -d / 2 + 0.1]} />)}
      <SideWall D={d} low={low} high={high} x={w / 2 - 0.0} m={M.charred} inner={M.plaster} />
      <SideWall D={d} low={low} high={high} x={-w / 2 + 0.0} m={M.charred} inner={M.plaster} />
      <group visible={!interiors}>
        <MonoRoof W={w} D={d} low={low} high={high} />
      </group>
      {/* deep-eave posts over the view side */}
      {[-w / 2 + 0.05, w / 2 - 0.05].map((x, i) => <B key={i} at={[x, 1.55, d / 2 + 0.78]} s={[0.07, 3.1, 0.07]} m={M.steel} />)}
      {/* interior */}
      <B at={[0, 1.35, -d / 2 + 0.5]} s={[w - 0.5, 2.3, 0.04]} m={M.light} cast={false} />
      <B at={[-0.2, 1.1, -d / 2 + 0.55]} s={[w - 1.0, 2.2, 0.45]} m={M.light} />
      {[0.5, 1.0, 1.5, 2.0].map((y, i) => <B key={i} at={[-0.2, y, -d / 2 + 0.78]} s={[w - 1.1, 0.03, 0.01]} m={M.plasterDark} cast={false} />)}
      {Array.from({ length: 9 }, (_, i) => <B key={i} at={[-1.0 + i * 0.22 - 0.2, 1.25, -d / 2 + 0.6]} s={[0.07, 0.3, 0.26]} m={i % 3 ? M.fabricMustard : M.fabricSage} cast={false} />)}
      <B at={[0.2, 0.74, d / 2 - 0.65]} s={[1.7, 0.04, 0.72]} m={M.light} />
      <B at={[-0.55, 0.37, d / 2 - 0.65]} s={[0.04, 0.74, 0.65]} m={M.steel} />
      <B at={[0.95, 0.37, d / 2 - 0.65]} s={[0.04, 0.74, 0.65]} m={M.steel} />
      <B at={[0.25, 0.86, d / 2 - 0.7]} s={[0.34, 0.02, 0.24]} m={M.steelLight} cast={false} />
      <B at={[0.25, 0.97, d / 2 - 0.58]} s={[0.34, 0.2, 0.01]} m={M.plasterDark} rot={[-0.2, 0, 0]} cast={false} />
      {/* ergonomic chair */}
      <Cyl at={[0.3, 0.48, d / 2 - 1.3]} r={0.23} h={0.08} m={M.fabricGrey} seg={14} />
      <B at={[0.3, 0.8, d / 2 - 1.5]} s={[0.4, 0.55, 0.06]} m={M.fabricGrey} rot={[0.12, 0, 0]} />
      <Cyl at={[0.3, 0.26, d / 2 - 1.3]} r={0.03} h={0.44} m={M.steel} seg={8} />
      <Cyl at={[0.3, 0.05, d / 2 - 1.3]} r={0.26} h={0.04} m={M.steel} seg={5} />
      <mesh position={[0.9, 2.2, d / 2 - 1.1]} material={M.lamp}>
        <sphereGeometry args={[0.13, 12, 8]} />
      </mesh>
      <Cyl at={[-0.8, 0.28, d / 2 - 0.5]} r={0.16} h={0.4} m={M.pot} seg={10} />
      <Cyl at={[-0.8, 0.7, d / 2 - 0.5]} r={0.24} h={0.5} m={M.green} seg={8} cast={false} />
      {/* view-side deck with pots */}
      <B at={[0, -0.02, d / 2 + 0.95]} s={[w + 0.7, 0.1, 1.6]} m={M.deck} />
      {[-w / 2 - 0.2, w / 2 + 0.2].map((x, i) => <B key={'dp' + i} at={[x, -0.25, d / 2 + 1.6]} s={[0.1, 0.4, 0.1]} m={M.steel} cast={false} />)}
      <Pots xs={[-w / 2 + 0.1, w / 2 - 0.1]} z={d / 2 + 1.55} />
      {/* entrance landing + lamp */}
      <B at={[0.8, 0.0, -d / 2 - 0.5]} s={[1.3, 0.1, 0.9]} m={M.deck} />
      <B at={[1.45, 2.15, -d / 2 - 0.08]} s={[0.1, 0.26, 0.1]} m={M.lamp} cast={false} />
      <B at={[-w / 2 - 0.06, 0.02, 0]} s={[0.02, 0.01, 0.01]} m={M.lamp} cast={false} />
      <Cyl at={[w / 2 + 0.02, 1.2, -d / 2 + 0.12]} r={0.04} h={2.4} m={M.steel} seg={8} />
      {night > 0.2 && <pointLight position={[0, 2.0, 0.3]} intensity={3 * night} distance={6} color="#ffb870" decay={1.6} />}
    </group>
  )
}

/* ------------------------------------------------------------- WELLNESS */
export function Wellness({ s }: { s: Structure }) {
  const floor = useFloorY(s)
  const pick = usePick(s.id)
  const interiors = useStore((st) => st.layers.interiors)
  const { glow: night } = useSunState()
  const w = s.w, d = s.d
  const eave = 2.55
  const pitch = (24 * Math.PI) / 180
  const rise = (d / 2) * Math.tan(pitch)
  const doorX = w / 2 - 2.0
  const sx = w / 2 - 1.5 // sauna partition x
  const cx = w / 2 - 1.5 - 1.3 // changing partition (gym | changing)
  const south: Opening[] = [ox(-w / 2 + 0.3, cx - 0.5, 0.2, eave - 0.1, { mullions: 3 }), ox(sx + 0.45, sx + 1.05, 1.2, 1.9)]
  const north: Opening[] = [ox(doorX - 0.45, doorX + 0.45, 0, 2.15, { door: true }), ox(-w / 2 + 0.7, cx - 0.9, 1.65, 2.35)]
  const west: Opening[] = [ox(-d / 2 + 0.4, d / 2 - 0.4, 0.2, eave - 0.1, { mullions: 2 })]
  return (
    <group position={[s.x, floor, s.z]} rotation={[0, (s.rot * Math.PI) / 180, 0]} {...pick}>
      <Piles s={s} floor={floor} />
      <B at={[0, 0.04, 0]} s={[w, 0.08, d]} m={M.light} cast={false} />
      <B at={[-w / 2 + 1.7, 0.09, 0.3]} s={[2.6, 0.02, 1.9]} m={M.rubber} cast={false} />
      {/* long walls */}
      <Wall L={w} H={eave} t={0.07} m={M.charred} at={[0, 0, d / 2 - 0.035]} openings={south} />
      <Wall L={w} H={eave} t={0.2} m={M.plaster} at={[0, 0, d / 2 - 0.17]} openings={south} />
      {south.map((o, i) => <Glazing key={i} o={o} wallT={0.3} at={[0, 0, d / 2 - 0.1]} />)}
      <Wall L={w} H={eave} t={0.07} m={M.charred} at={[0, 0, -d / 2 + 0.035]} openings={north} />
      <Wall L={w} H={eave} t={0.2} m={M.plaster} at={[0, 0, -d / 2 + 0.17]} openings={north} />
      {north.map((o, i) => <Glazing key={i} o={o} wallT={0.3} at={[0, 0, -d / 2 + 0.1]} />)}
      {/* gable ends */}
      <group position={[-w / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Wall L={d} H={eave} t={0.07} m={M.larchWarm} at={[0, 0, -0.035]} openings={west} />
        <Wall L={d} H={eave} t={0.2} m={M.plaster} at={[0, 0, 0.1]} openings={west} />
        {west.map((o, i) => <Glazing key={i} o={o} wallT={0.3} at={[0, 0, 0.0]} />)}
        <Gable W={d} R={rise} D={0.1} m={M.larchWarm} at={[0, eave, -0.08]} />
      </group>
      <group position={[w / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <Wall L={d} H={eave} t={0.07} m={M.larchWarm} at={[0, 0, -0.035]} />
        <Wall L={d} H={eave} t={0.2} m={M.plaster} at={[0, 0, 0.1]} />
        <Gable W={d} R={rise} D={0.1} m={M.larchWarm} at={[0, eave, -0.08]} />
      </group>
      <group visible={!interiors}>
        <group rotation={[0, Math.PI / 2, 0]}>
          <GableRoof W={d} L={w} eave={eave} pitch={pitch} ov={0.55} endOv={[0.4, 0.4]} />
        </group>
      </group>
      {/* sauna chimney */}
      <Cyl at={[sx + 0.75, eave + rise + 0.6, -0.4]} r={0.07} h={1.8} m={M.steelLight} seg={10} />
      <Cyl at={[sx + 0.75, eave + rise + 1.55, -0.4]} r={0.11} h={0.12} m={M.steel} seg={10} />
      {/* partitions */}
      <B at={[cx, 1.25, -0.9]} s={[0.1, 2.5, d - 1.8]} m={M.plaster} />
      <B at={[cx, 1.25, d / 2 - 0.45]} s={[0.06, 2.5, 0.9]} m={M.glassDark} cast={false} />
      <B at={[sx, 1.25, -0.9]} s={[0.1, 2.5, d - 1.8]} m={M.sauna} />
      <B at={[sx, 1.1, 1.0]} s={[0.04, 2.2, 0.8]} m={M.glass} cast={false} />
      {/* sauna interior: benches, stove with stones, wood lining */}
      <B at={[w / 2 - 0.55, 0.45, 0.2]} s={[1.0, 0.08, d - 1.0]} m={M.sauna} />
      <B at={[w / 2 - 0.35, 0.95, 0.2]} s={[0.6, 0.08, d - 1.0]} m={M.sauna} />
      <B at={[sx + 0.3, 0.4, -d / 2 + 0.55]} s={[0.5, 0.8, 0.5]} m={M.steel} />
      <B at={[sx + 0.3, 0.88, -d / 2 + 0.55]} s={[0.4, 0.16, 0.4]} m={M.stone} />
      <B at={[w / 2 - 0.08, 1.25, 0.2]} s={[0.04, 2.4, d - 0.5]} m={M.sauna} cast={false} />
      {/* changing room: bench + hooks */}
      <B at={[(cx + sx) / 2, 0.45, d / 2 - 0.55]} s={[0.9, 0.06, 0.4]} m={M.light} />
      <B at={[(cx + sx) / 2, 1.7, -d / 2 + 0.3]} s={[0.9, 0.05, 0.08]} m={M.light} cast={false} />
      {/* gym: rack, bench, dumbbell stand, mirror, yoga mats */}
      <B at={[-w / 2 + 0.55, 1.1, -d / 2 + 0.55]} s={[0.08, 2.2, 0.08]} m={M.steel} />
      <B at={[-w / 2 + 1.75, 1.1, -d / 2 + 0.55]} s={[0.08, 2.2, 0.08]} m={M.steel} />
      <B at={[-w / 2 + 1.15, 1.9, -d / 2 + 0.55]} s={[1.3, 0.04, 0.04]} m={M.steelLight} />
      <Cyl at={[-w / 2 + 1.15, 1.4, -d / 2 + 0.7]} r={0.02} h={2.2} m={M.steelLight} rot={[0, 0, Math.PI / 2]} seg={8} />
      <B at={[-w / 2 + 1.15, 0.2, -d / 2 + 1.5]} s={[0.4, 0.4, 1.2]} m={M.fabricGrey} />
      <B at={[-w / 2 + 2.5, 0.35, -d / 2 + 0.45]} s={[0.9, 0.7, 0.4]} m={M.steel} />
      {[0, 1, 2].map((i) => <Cyl key={i} at={[-w / 2 + 2.2 + i * 0.28, 0.76, -d / 2 + 0.45]} r={0.08} h={0.18} m={M.rubber} rot={[0, 0, Math.PI / 2]} seg={8} />)}
      <B at={[-w / 2 + 0.05, 1.2, 0.0]} s={[0.04, 1.8, 1.6]} m={M.glass} cast={false} />
      <Cyl at={[-w / 2 + 1.7, 0.12, 0.6]} r={0.09} h={0.7} m={M.fabricSage} rot={[0, 0, Math.PI / 2]} seg={10} />
      <B at={[-w / 2 + 1.0, 0.12, 0.7]} s={[0.6, 0.04, 1.7]} m={M.fabricSage} cast={false} />
      {/* south deck along the glazing, with pots and lanterns */}
      <B at={[0, -0.02, d / 2 + 0.85]} s={[w + 0.3, 0.1, 1.5]} m={M.deck} />
      <B at={[0, -0.27, d / 2 + 0.85]} s={[w, 0.4, 1.4]} m={M.steel} cast={false} />
      <Pots xs={[-w / 2 + 0.3, -w / 2 + 2.2, 0.8, w / 2 - 0.9]} z={d / 2 + 1.45} />
      {[-w / 2 + 1.4, w / 2 - 1.5].map((x, i) => <B key={'ln' + i} at={[x, 0.2, d / 2 + 0.5]} s={[0.16, 0.34, 0.16]} m={M.lamp} cast={false} />)}
      {/* exterior: east relaxation deck + outdoor shower + lounger */}
      <group position={[w / 2 + 1.6, 0, 0]}>
        <B at={[0, 0.0, 0]} s={[3.2, 0.12, d]} m={M.deck} />
        <B at={[0, -0.25, 0]} s={[3.1, 0.3, d - 0.1]} m={M.steel} cast={false} />
        <B at={[0.8, 0.9, -d / 2 + 0.05]} s={[1.2, 1.85, 0.05]} m={M.larchWarm} />
        {Array.from({ length: 8 }, (_, i) => <B key={i} at={[0.25 + i * 0.15, 0.95, -d / 2 + 0.05]} s={[0.05, 1.8, 0.03]} m={M.steel} cast={false} />)}
        <Cyl at={[0.8, 2.1, -d / 2 + 0.25]} r={0.1} h={0.03} m={M.steelLight} seg={12} />
        <Cyl at={[0.8, 1.1, -d / 2 + 0.2]} r={0.015} h={2.1} m={M.steelLight} seg={6} />
        <B at={[0.2, 0.2, 0.8]} s={[0.7, 0.28, 1.6]} m={M.fabricLinen} />
        <B at={[0.2, 0.46, 0.45]} s={[0.7, 0.25, 0.5]} m={M.fabricLinen} rot={[-0.5, 0, 0]} cast={false} />
      </group>
      <B at={[doorX + 0.7, 2.0, -d / 2 - 0.08]} s={[0.1, 0.26, 0.1]} m={M.lamp} cast={false} />
      <B at={[-w / 2 - 0.08, 1.8, 0]} s={[0.1, 0.26, 0.1]} m={M.lamp} cast={false} />
      {night > 0.2 && <pointLight position={[-1, 1.8, 0]} intensity={4 * night} distance={7} color="#ffb870" decay={1.6} />}
      {night > 0.2 && <pointLight position={[w / 2 - 0.5, 1.6, 0]} intensity={2.4 * night} distance={4} color="#ff9a52" decay={1.6} />}
    </group>
  )
}

/* ----------------------------------------------------------------- BANIA */
export function Bania({ s }: { s: Structure }) {
  const floor = useFloorY(s)
  const pick = usePick(s.id)
  const { glow: night } = useSunState()
  const w = s.w, d = s.d
  const tubR = Math.min(0.98, Math.min(w, d) / 2 - 0.55)
  const tx = w / 2 - tubR - 0.55
  const staves = useMemo(() => Array.from({ length: 36 }, (_, i) => (i / 36) * Math.PI * 2), [])
  return (
    <group position={[s.x, floor - 0.12, s.z]} rotation={[0, (s.rot * Math.PI) / 180, 0]} {...pick}>
      <Piles s={s} floor={floor - 0.12} />
      <B at={[0, 0.0, 0]} s={[w, 0.12, d]} m={M.deck} />
      {/* tub: cedar staves + steel hoops + stove */}
      <group position={[tx, 0.06, 0]}>
        <Cyl at={[0, 0.5, 0]} r={tubR} h={1.0} m={M.tubWood} seg={36} />
        {staves.map((a, i) => (
          <B key={i} at={[Math.cos(a) * (tubR + 0.005), 0.5, Math.sin(a) * (tubR + 0.005)]} s={[0.035, 1.0, 0.02]} m={M.tubWood} rot={[0, -a + Math.PI / 2, 0]} cast={false} />
        ))}
        {[0.12, 0.5, 0.88].map((y, i) => <Cyl key={i} at={[0, y, 0]} r={tubR + 0.02} h={0.03} m={M.steel} seg={36} />)}
        <mesh position={[0, 0.9, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.water}>
          <circleGeometry args={[tubR - 0.04, 36]} />
        </mesh>
        <mesh position={[0, 0.94, 0]} material={M.fire} />
        <Steam />
        <B at={[-tubR - 0.28, 0.45, 0]} s={[0.4, 0.9, 0.4]} m={M.steel} />
        <Cyl at={[-tubR - 0.28, 1.9, 0]} r={0.06} h={2.1} m={M.steelLight} seg={10} />
        <Cyl at={[-tubR - 0.28, 2.98, 0]} r={0.1} h={0.1} m={M.steel} seg={10} />
        <B at={[0, 0.2, tubR + 0.35]} s={[0.5, 0.4, 0.4]} m={M.light} />
      </group>
      {/* privacy screen: vertical timber slats on dark frame (south & east) */}
      {Array.from({ length: Math.floor(w / 0.16) }, (_, i) => (
        <B key={'s' + i} at={[-w / 2 + 0.1 + i * 0.16, 1.0, d / 2 - 0.05]} s={[0.1, 1.9, 0.03]} m={M.larchWarm} />
      ))}
      <B at={[0, 1.95, d / 2 - 0.05]} s={[w, 0.05, 0.06]} m={M.steel} />
      {Array.from({ length: Math.floor((d - 1.0) / 0.16) }, (_, i) => (
        <B key={'e' + i} at={[w / 2 - 0.05, 1.0, d / 2 - 0.4 - i * 0.16]} s={[0.03, 1.9, 0.1]} m={M.larchWarm} />
      ))}
      <B at={[w / 2 - 0.05, 1.95, 0.0]} s={[0.06, 0.05, d - 0.9]} m={M.steel} />
      {/* bench + towel rail + lantern posts */}
      <B at={[-w / 2 + 0.5, 0.4, -d / 2 + 0.35]} s={[1.6, 0.06, 0.4]} m={M.light} />
      <B at={[-w / 2 + 0.5, 0.2, -d / 2 + 0.35]} s={[1.5, 0.35, 0.3]} m={M.steel} cast={false} />
      {[[-w / 2 + 0.1, -d / 2 + 0.1], [w / 2 - 0.1, -d / 2 + 0.1]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <B at={[0, 0.7, 0]} s={[0.07, 1.4, 0.07]} m={M.steel} />
          <mesh position={[0, 1.45, 0]} material={M.lamp}>
            <boxGeometry args={[0.16, 0.22, 0.16]} />
          </mesh>
        </group>
      ))}
      {night > 0.2 && <pointLight position={[0, 1.7, 0]} intensity={3.4 * night} distance={7} color="#ffa95a" decay={1.6} />}
    </group>
  )
}

/* ------------------------------------------------------------ GREENHOUSE */
export function Greenhouse({ s }: { s: Structure }) {
  const pick = usePick(s.id)
  const { glow: night } = useSunState()
  const w = s.w, d = s.d
  const g = terrainY(s.x, s.z)
  const wallH = 1.9
  const base = 0.45
  const pitch = (28 * Math.PI) / 180
  const rise = (d / 2) * Math.tan(pitch)
  const bays = Math.max(3, Math.round(w / 0.9))
  const roofGlass = useMemo(() => M.glass.clone(), [])
  const run = d / 2 / Math.cos(pitch)
  const frame = M.steel
  return (
    <group position={[s.x, g, s.z]} rotation={[0, (s.rot * Math.PI) / 180, 0]} {...pick}>
      {/* base: timber plinth */}
      <B at={[0, base / 2, d / 2 - 0.04]} s={[w, base, 0.08]} m={M.charred} />
      <B at={[0, base / 2, -d / 2 + 0.04]} s={[w, base, 0.08]} m={M.charred} />
      <B at={[w / 2 - 0.04, base / 2, 0]} s={[0.08, base, d]} m={M.charred} />
      <B at={[-w / 2 + 0.04, base / 2, 0]} s={[0.08, base, d]} m={M.charred} />
      <B at={[0, 0.03, 0]} s={[w - 0.2, 0.04, d - 0.2]} m={M.mulch} cast={false} />
      {/* walls: glass panes + posts */}
      {[1, -1].map((sg) => (
        <group key={sg}>
          <mesh position={[0, base + (wallH - base) / 2, sg * (d / 2 - 0.02)]} material={roofGlass} rotation={[0, sg > 0 ? 0 : Math.PI, 0]}>
            <planeGeometry args={[w - 0.1, wallH - base]} />
          </mesh>
          {Array.from({ length: bays + 1 }, (_, i) => (
            <B key={i} at={[-w / 2 + (i * w) / bays, (wallH + base) / 2, sg * (d / 2)]} s={[0.045, wallH - base, 0.045]} m={frame} cast={false} />
          ))}
          <B at={[0, wallH, sg * (d / 2)]} s={[w, 0.05, 0.05]} m={frame} cast={false} />
        </group>
      ))}
      {/* gable ends glazed */}
      {[1, -1].map((sg) => (
        <group key={'g' + sg} position={[sg * (w / 2 - 0.02), wallH, 0]} rotation={[0, (sg * Math.PI) / 2, 0]}>
          <mesh material={roofGlass} position={[0, -(wallH - base) / 2, 0]}>
            <planeGeometry args={[d - 0.1, wallH - base]} />
          </mesh>
          <Gable W={d} R={rise} D={0.01} m={roofGlass} at={[0, 0, 0]} />
          <B at={[0, rise / 2, 0]} s={[0.04, rise, 0.04]} m={frame} cast={false} />
          {sg < 0 && <B at={[0, -(wallH - base) / 2 - 0.1, 0.02]} s={[0.9, wallH - base - 0.2, 0.05]} m={M.glassDark} cast={false} />}
          {sg < 0 && <B at={[0.0, -(wallH - base) / 2 - 0.1, 0.05]} s={[1.0, wallH - base - 0.1, 0.03]} m={frame} cast={false} />}
        </group>
      ))}
      {/* roof glass + rafters + ridge + open vent */}
      {[1, -1].map((sg) => (
        <group key={'r' + sg}>
          <mesh position={[0, wallH + rise / 2 + 0.03, sg * (d / 4)]} rotation={[sg * pitch - Math.PI / 2, 0, 0]} material={roofGlass}>
            <planeGeometry args={[w, run]} />
          </mesh>
          {Array.from({ length: bays + 1 }, (_, i) => (
            <B key={i} at={[-w / 2 + (i * w) / bays, wallH + rise / 2 + 0.03, sg * (d / 4)]} s={[0.04, 0.045, run]} m={frame} rot={[sg * pitch, 0, 0]} cast={false} />
          ))}
        </group>
      ))}
      <B at={[0, wallH + rise + 0.05, 0]} s={[w, 0.07, 0.07]} m={frame} cast={false} />
      <group position={[w / 4, wallH + rise + 0.03, 0]} rotation={[0, 0, 0]}>
        <B at={[0, 0.25, d / 8]} s={[1.0, 0.03, 0.8]} m={frame} rot={[-0.9, 0, 0]} cast={false} />
      </group>
      {/* interior: raised beds both sides, bench, plants */}
      {[1, -1].map((sg) => (
        <group key={'b' + sg} position={[0, 0, sg * (d / 2 - 0.55)]}>
          <B at={[0, 0.4, 0]} s={[w - 1.1, 0.8, 0.7]} m={M.larchWarm} />
          <B at={[0, 0.81, 0]} s={[w - 1.2, 0.04, 0.6]} m={M.soil} cast={false} />
          {Array.from({ length: Math.floor((w - 1.4) / 0.38) }, (_, i) => (
            <mesh key={i} position={[-w / 2 + 0.85 + i * 0.38, 0.98, 0]} scale={[0.16, 0.2, 0.16]} geometry={plantGeo} material={M.green} />
          ))}
        </group>
      ))}
      <B at={[w / 2 - 0.5, 0.45, 0]} s={[0.5, 0.9, d - 1.8]} m={M.light} />
      {/* rain barrel + gutter: collects roof water for irrigation */}
      <Cyl at={[w / 2 + 0.45, 0.5, d / 2 - 0.1]} r={0.4} h={1.0} m={M.tankBlue} seg={16} />
      <Cyl at={[w / 2 + 0.1, 1.0, d / 2 - 0.05]} r={0.03} h={2.0} m={M.steel} seg={8} />
      {night > 0.2 && <pointLight position={[0, 1.6, 0]} intensity={2.4 * night} distance={5} color="#ffcf8a" decay={1.6} />}
    </group>
  )
}

export { flatMat }
