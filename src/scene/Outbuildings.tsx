import { useMemo } from 'react'
import * as THREE from 'three'
import type { Structure } from '../data/layouts'
import { rectCorners, terrainY } from '../lib/geometry'
import { B, Cyl, Wall, Glazing, MonoRoof, type Opening } from './prims'
import { M, flatMat } from './materials'
import { Inst } from './Inst'
import { usePick, useSunState } from './env'
import { Piles, SideWall } from './Pavilions'
import { useStore } from '../store'

const ox = (x0: number, x1: number, y0: number, y1: number, extra: Partial<Opening> = {}): Opening => ({ x0, x1, y0, y1, ...extra })
const logGeo = (() => {
  const g = new THREE.CylinderGeometry(0.085, 0.085, 0.6, 8)
  g.rotateX(Math.PI / 2)
  return g
})()

/** Ground-based floor level: highest corner of the footprint + a small plinth. */
function useGroundFloor(s: Structure, lift: number) {
  return useMemo(() => {
    const t = [...rectCorners(s), [s.x, s.z] as [number, number]].map(([x, z]) => terrainY(x, z))
    return { floor: Math.max(...t) + lift, minT: Math.min(...t) }
  }, [s.x, s.z, s.w, s.d, s.rot, lift])
}

/* ---------------------------------------------------------------- WORKSHOP */
export function Workshop({ s }: { s: Structure }) {
  const { floor } = useGroundFloor(s, 0.3)
  const pick = usePick(s.id)
  const interiors = useStore((st) => st.layers.interiors)
  const { glow: night } = useSunState()
  const w = s.w, d = s.d
  const low = 2.3, high = 2.9
  const front: Opening[] = [ox(-0.85, 0.85, 0, 2.05)]
  const back: Opening[] = [ox(-w / 2 + 0.55, w / 2 - 1.0, 0.95, 1.85, { mullions: 2 })]
  const logs = useMemo(() => {
    const a: { x: number; y: number; z: number }[] = []
    for (let row = 0; row < 5; row++) for (let i = 0; i < 6 - (row > 3 ? 2 : 0); i++) a.push({ x: -0.34 + (i + (row % 2) * 0.5) * 0.18, y: 0.12 + row * 0.16, z: (Math.sin(row * 7 + i * 3) * 0.04) })
    return a
  }, [])
  return (
    <group position={[s.x, floor, s.z]} rotation={[0, (s.rot * Math.PI) / 180, 0]} {...pick}>
      <Piles s={s} floor={floor} />
      <B at={[0, 0.04, 0]} s={[w, 0.08, d]} m={M.light} cast={false} />
      {/* walls: entrance (-z) with barn-door opening, window on the +z side over the workbench */}
      <Wall L={w} H={low} t={0.07} m={M.charred} at={[0, 0, -d / 2 + 0.035]} openings={front} />
      <Wall L={w} H={low} t={0.2} m={M.plaster} at={[0, 0, -d / 2 + 0.17]} openings={front} />
      <Wall L={w} H={high} t={0.07} m={M.charred} at={[0, 0, d / 2 - 0.035]} openings={back} />
      <Wall L={w} H={high} t={0.2} m={M.plaster} at={[0, 0, d / 2 - 0.17]} openings={back} />
      {back.map((o, i) => <Glazing key={i} o={o} wallT={0.3} at={[0, 0, d / 2 - 0.1]} />)}
      <SideWall D={d} low={low} high={high} x={w / 2} m={M.charred} inner={M.plaster} />
      <SideWall D={d} low={low} high={high} x={-w / 2} m={M.charred} inner={M.plaster} />
      <group visible={!interiors}>
        <MonoRoof W={w} D={d} low={low} high={high} ov={0.45} ovFront={0.55} />
      </group>
      {/* barn doors, ajar, on black strap hinges */}
      {[-1, 1].map((sg) => (
        <group key={sg} position={[sg * 0.86, 0, -d / 2 - 0.02]} rotation={[0, -sg * 1.15, 0]}>
          <B at={[-sg * 0.43, 1.02, 0]} s={[0.84, 2.04, 0.05]} m={M.larchWarm} />
          <B at={[-sg * 0.43, 0.4, -0.03]} s={[0.84, 0.07, 0.02]} m={M.steel} cast={false} />
          <B at={[-sg * 0.43, 1.6, -0.03]} s={[0.84, 0.07, 0.02]} m={M.steel} cast={false} />
          <B at={[-sg * 0.43, 1.02, -0.03]} s={[0.84, 0.04, 0.02]} m={M.steel} cast={false} rot={[0, 0, sg * 0.7]} />
          <B at={[-sg * 0.8, 1.0, -0.04]} s={[0.03, 0.28, 0.03]} m={M.steelLight} cast={false} />
        </group>
      ))}
      {/* interior — workbench with vise under the window */}
      <B at={[-0.35, 0.9, d / 2 - 0.5]} s={[2.5, 0.06, 0.62]} m={M.oak} cast />
      {[-1.45, -0.35, 0.75].map((x, i) => <B key={i} at={[x, 0.45, d / 2 - 0.5]} s={[0.07, 0.9, 0.56]} m={M.steel} />)}
      <B at={[0.75, 0.45, d / 2 - 0.5]} s={[0.55, 0.86, 0.56]} m={M.light} />
      {[0.25, 0.5, 0.75].map((y, i) => <B key={i} at={[0.75, y, d / 2 - 0.21]} s={[0.4, 0.02, 0.01]} m={M.steel} cast={false} />)}
      <B at={[-1.2, 1.0, d / 2 - 0.45]} s={[0.14, 0.16, 0.2]} m={M.steel} cast={false} />
      <B at={[-1.2, 0.97, d / 2 - 0.62]} s={[0.04, 0.1, 0.09]} m={M.steelLight} cast={false} />
      <B at={[0.2, 0.95, d / 2 - 0.45]} s={[0.35, 0.04, 0.2]} m={M.light} cast={false} />
      <Cyl at={[0.2, 0.93, d / 2 - 0.45]} r={0.03} h={0.05} m={M.steelLight} seg={8} cast={false} />
      {/* pegboard tool wall (west side) with tools */}
      <B at={[-w / 2 + 0.18, 1.45, -0.1]} s={[0.03, 1.15, d - 1.1]} m={M.light} cast={false} />
      {Array.from({ length: 9 }, (_, i) => {
        const z = -0.65 + i * 0.16
        const tool = i % 3
        return (
          <group key={i} position={[-w / 2 + 0.22, 1.45, z]}>
            {tool === 0 && (<><B at={[0, -0.1, 0]} s={[0.02, 0.5, 0.04]} m={M.larchWarm} cast={false} /><B at={[0, 0.17, 0]} s={[0.03, 0.08, 0.12]} m={M.steel} cast={false} /></>)}
            {tool === 1 && <B at={[0, 0, 0]} s={[0.01, 0.55, 0.1]} m={M.steelLight} cast={false} rot={[0.12, 0, 0]} />}
            {tool === 2 && (<><B at={[0, -0.05, 0]} s={[0.02, 0.4, 0.03]} m={M.tubWood} cast={false} /><B at={[0, 0.17, 0.0]} s={[0.025, 0.05, 0.1]} m={M.fabricMustard} cast={false} /></>)}
          </group>
        )
      })}
      {/* shelves with jars, crates and a lamp */}
      <B at={[0.55, 1.75, d / 2 - 0.25]} s={[1.5, 0.03, 0.26]} m={M.light} cast={false} />
      {[0, 1, 2, 3].map((i) => <Cyl key={i} at={[0.05 + i * 0.3, 1.85, d / 2 - 0.25]} r={0.06} h={0.14} m={i % 2 ? M.ceramic : M.pot} seg={10} cast={false} />)}
      <B at={[w / 2 - 0.4, 0.2, -0.2]} s={[0.55, 0.4, 0.7]} m={M.larchWarm} cast={false} />
      <B at={[w / 2 - 0.4, 0.6, -0.2]} s={[0.5, 0.35, 0.6]} m={M.larchWarm} cast={false} />
      <mesh position={[0.4, 2.05, -0.3]} material={M.paper}><sphereGeometry args={[0.13, 12, 8]} /></mesh>
      <Cyl at={[0.4, 2.55, -0.3]} r={0.005} h={0.8} m={M.steel} seg={4} cast={false} />
      {/* exterior: lean-to firewood store on the east gable */}
      <group position={[w / 2 + 0.6, 0, 0]}>
        {[-d / 2 + 0.2, d / 2 - 0.2].map((z, i) => <B key={i} at={[0.5, 0.95, z]} s={[0.08, 1.9, 0.08]} m={M.steel} />)}
        <B at={[0.02, 1.55, 0]} s={[1.3, 0.05, d - 0.2]} m={M.roof} rot={[0, 0, 0.18]} />
        <B at={[0.5, 0.06, 0]} s={[1.0, 0.1, d - 0.3]} m={M.deck} />
        <Inst
          count={logs.length * 4}
          geometry={logGeo}
          material={M.mulch}
          deps={[logs]}
          fill={(i, o, c) => {
            const l = logs[i % logs.length]
            const zi = Math.floor(i / logs.length) - 1.5
            o.position.set(0.35 + l.x * 1.3, 0.2 + l.y, zi * 0.55 * (d / 2.8) + l.z)
            o.rotation.set(0, 0.05 * zi, 0)
            const v = 0.7 + ((i * 37) % 10) / 25
            c.setRGB(v, v * 0.85, v * 0.7)
          }}
        />
      </group>
      {/* exterior: stone step, wheelbarrow, chopping block with axe, bench & lantern */}
      <B at={[0, 0.0, -d / 2 - 0.65]} s={[1.9, 0.16, 0.9]} m={M.stone} />
      <group position={[w / 2 + 0.3, 0, -d / 2 - 1.1]} rotation={[0, -0.5, 0]}>
        <B at={[0, 0.42, 0]} s={[0.7, 0.04, 0.55]} m={M.steel} rot={[0, 0, 0.25]} />
        <Cyl at={[-0.3, 0.2, 0]} r={0.2} h={0.08} m={M.rubber} rot={[Math.PI / 2, 0, 0]} seg={14} cast={false} />
        <B at={[0.3, 0.3, 0.2]} s={[0.04, 0.45, 0.04]} m={M.steel} cast={false} />
        <B at={[0.3, 0.3, -0.2]} s={[0.04, 0.45, 0.04]} m={M.steel} cast={false} />
      </group>
      <Cyl at={[-w / 2 - 0.5, 0.22, -d / 2 - 0.5]} r={0.2} h={0.44} m={M.mulch} seg={12} />
      <B at={[-w / 2 - 0.5, 0.5, -d / 2 - 0.5]} s={[0.03, 0.4, 0.05]} m={M.larchWarm} rot={[0.3, 0, 0.25]} cast={false} />
      <B at={[-w / 2 - 0.45, 0.6, -d / 2 - 0.4]} s={[0.12, 0.08, 0.03]} m={M.steelLight} rot={[0.3, 0, 0.25]} cast={false} />
      <B at={[-1.2, 0.3, -d / 2 - 0.35]} s={[0.9, 0.05, 0.3]} m={M.light} />
      <B at={[-1.2, 0.15, -d / 2 - 0.35]} s={[0.8, 0.3, 0.22]} m={M.steel} cast={false} />
      <Cyl at={[-1.0, 0.5, -d / 2 - 0.35]} r={0.1} h={0.2} m={M.steelLight} seg={10} cast={false} />
      <B at={[0.95, 2.0, -d / 2 - 0.08]} s={[0.1, 0.24, 0.1]} m={M.lamp} cast={false} />
      {night > 0.2 && <pointLight position={[0, 1.9, 0]} intensity={2.4 * night} distance={5} color="#ffbb70" decay={1.6} />}
      <pointLight position={[0, 1.8, 0.2]} intensity={1.6} distance={4} color="#ffe2b8" decay={1.6} />
    </group>
  )
}

/* ----------------------------------------------------------------- CARPORT */
export function Carport({ s }: { s: Structure }) {
  const { floor, minT } = useGroundFloor(s, 0.05)
  const pick = usePick(s.id)
  const interiors = useStore((st) => st.layers.interiors)
  const { glow: night } = useSunState()
  const w = s.w, d = s.d // w = length (drive-in axis, local x), d = width (local z)
  const car = useMemo(() => ({ body: flatMat('#454b52', 0.32, 0.55), body2: flatMat('#b9bcc0', 0.3, 0.6), trim: flatMat('#16181a', 0.5, 0.4), tail: new THREE.MeshStandardMaterial({ color: '#8a1414', emissive: '#c01818', emissiveIntensity: 0.4 }) }), [])
  const slats = useMemo(() => Array.from({ length: Math.floor((w - 0.2) / 0.16) }, (_, i) => -w / 2 + 0.15 + i * 0.16), [w])
  const h = floor - minT + 0.02
  return (
    <group position={[s.x, floor, s.z]} rotation={[0, (s.rot * Math.PI) / 180, 0]} {...pick}>
      {/* plinth + permeable paver floor with wheel tracks */}
      <B at={[0, -h / 2 - 0.02, 0]} s={[w, h, d]} m={M.concrete} />
      <B at={[0, 0.0, 0]} s={[w, 0.06, d]} m={M.stone} cast={false} />
      {[-0.7, 0.7].map((z, i) => <B key={i} at={[0, 0.035, z]} s={[w - 0.4, 0.02, 0.5]} m={M.concrete} cast={false} />)}
      {/* slender black steel posts and beams */}
      {[-w / 2 + 0.15, 0, w / 2 - 0.15].flatMap((x) => [-d / 2 + 0.12, d / 2 - 0.12].map((z) => [x, z] as [number, number])).map(([x, z], i) => (
        <B key={i} at={[x, 1.28, z]} s={[0.1, 2.56, 0.1]} m={M.steel} />
      ))}
      {[-d / 2 + 0.12, d / 2 - 0.12].map((z, i) => <B key={'b' + i} at={[0, 2.58, z]} s={[w, 0.16, 0.1]} m={M.steel} />)}
      {/* low mono-pitch roof draining to the slatted back wall (+z) */}
      <group visible={!interiors}>
        <group rotation={[0, Math.PI, 0]}>
          <MonoRoof W={w} D={d} low={2.62} high={2.96} ov={0.45} ovFront={0.5} />
        </group>
      </group>
      <B at={[0, 2.55, d / 2 + 0.2]} s={[w + 0.4, 0.1, 0.1]} m={M.steel} cast={false} />
      <Cyl at={[w / 2 - 0.05, 1.3, d / 2 + 0.22]} r={0.04} h={2.5} m={M.steel} seg={8} cast={false} />
      {/* slatted timber back wall + storage + wall charger */}
      {slats.map((x, i) => <B key={i} at={[x, 1.15, d / 2 - 0.06]} s={[0.11, 2.3, 0.03]} m={M.larchWarm} />)}
      <B at={[0, 2.32, d / 2 - 0.06]} s={[w - 0.1, 0.05, 0.06]} m={M.steel} />
      <B at={[-w / 2 + 1.0, 0.95, d / 2 - 0.3]} s={[1.5, 1.9, 0.4]} m={M.light} />
      <B at={[-w / 2 + 1.0, 0.95, d / 2 - 0.09]} s={[1.46, 1.86, 0.02]} m={M.sauna} />
      <B at={[-w / 2 + 1.0, 0.95, d / 2 - 0.08]} s={[0.02, 1.86, 0.03]} m={M.steel} />
      <B at={[0.9, 1.25, d / 2 - 0.12]} s={[0.22, 0.34, 0.1]} m={M.steel} cast={false} />
      <B at={[0.9, 1.34, d / 2 - 0.065]} s={[0.12, 0.03, 0.01]} m={M.lamp} cast={false} />
      {/* bicycle hooks */}
      {[1.5, 1.95].map((x, i) => <B key={i} at={[x, 1.75, d / 2 - 0.1]} s={[0.04, 0.05, 0.12]} m={M.steelLight} cast={false} />)}
      {/* two parked cars side by side */}
      {[[-0.35, -1.2, '#454b52'], [-0.35, 0.75, '#b9bcc0']].map(([cx0, cz0, col], k) => (
        <group key={k} position={[cx0 as number, 0.06, cz0 as number]}>
          <B at={[0, 0.55, 0]} s={[4.35, 0.55, 1.78]} m={k ? car.body2 : car.body} cast />
          <B at={[-0.1, 1.05, 0]} s={[2.35, 0.5, 1.58]} m={k ? car.body2 : car.body} cast />
          <B at={[-0.1, 1.07, 0]} s={[2.2, 0.38, 1.6]} m={M.glassDark} cast={false} />
          <B at={[-2.17, 0.55, -0.6]} s={[0.04, 0.12, 0.3]} m={M.lamp} cast={false} />
          <B at={[-2.17, 0.55, 0.6]} s={[0.04, 0.12, 0.3]} m={M.lamp} cast={false} />
          <B at={[2.17, 0.62, -0.62]} s={[0.04, 0.1, 0.3]} m={car.tail} cast={false} />
          <B at={[0, 0.3, 0]} s={[4.2, 0.12, 1.7]} m={car.trim} cast={false} />
          {[[1.35, 0.85], [1.35, -0.85], [-1.35, 0.85], [-1.35, -0.85]].map(([x, z], i) => (
            <Cyl key={i} at={[x, 0.33, z]} r={0.33} h={0.22} m={M.rubber} rot={[Math.PI / 2, 0, 0]} seg={16} />
          ))}
          <mesh visible={false}><boxGeometry args={[0.01, 0.01, 0.01]} /><meshBasicMaterial color={col as string} /></mesh>
        </group>
      ))}
      {/* soft light strip under the roof */}
      <B at={[0, 2.46, -d / 2 + 0.3]} s={[w - 0.8, 0.04, 0.06]} m={M.lamp} cast={false} />
      {night > 0.2 && <pointLight position={[0, 2.2, 0]} intensity={3 * night} distance={7} color="#ffd8a0" decay={1.6} />}
    </group>
  )
}
