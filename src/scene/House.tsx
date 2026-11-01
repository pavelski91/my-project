import { useMemo } from 'react'
import * as THREE from 'three'
import { useStore } from '../store'
import { HOUSE_EXISTING, HOUSE_EXTENSION, TERRACE, SHED_EXISTING, TERRAIN_Y0, GROUND_FLOOR_LEFT } from '../data/site'
import { terrainY, TERRACE_DECK_Y } from '../lib/geometry'
import { B, Cyl, Wall, Glazing, Gable, GableRoof, type Opening } from './prims'
import { M, flatMat } from './materials'
import { usePick, useSunState } from './env'

const W = 4.2
const T = 0.3
const EAVE = 2.9
const PITCH = (40 * Math.PI) / 180
export const HOUSE_Y0 = GROUND_FLOOR_LEFT - TERRAIN_Y0 // 3.10
export const HOUSE_RIDGE = EAVE + (W / 2) * Math.tan(PITCH)

const o = (z0: number, z1: number, y0: number, y1: number, extra: Partial<Opening> = {}): Opening => ({ x0: -z1, x1: -z0, y0, y1, ...extra })
/** opening on a wall that runs along x: x measured west→east */
const ox = (x0: number, x1: number, y0: number, y1: number, extra: Partial<Opening> = {}): Opening => ({ x0, x1, y0, y1, ...extra })

function LongWall({ side, len, ops, mat, y0 }: { side: 1 | -1; len: number; ops: Opening[]; mat: THREE.Material; y0: number }) {
  // outer cladding + inner plaster, both with same openings; wall runs along local z (rot y = +/-90deg)
  const rot: [number, number, number] = [0, Math.PI / 2, 0]
  return (
    <group>
      <Wall L={len} H={EAVE} t={0.07} m={mat} at={[side * (W / 2 - 0.035), 0, 0]} rot={rot} openings={ops} />
      <Wall L={len} H={EAVE} t={0.2} m={M.plaster} at={[side * (W / 2 - 0.17), 0, 0]} rot={rot} openings={ops} />
      {ops.map((op, i) => (
        <Glazing key={i} o={op} wallT={T} at={[side * (W / 2 - 0.1), 0, 0]} rot={rot} glass={M.glass} />
      ))}
      <B at={[side * (W / 2 + 0.002), EAVE - 0.05, 0]} s={[0.02, 0.1, len]} m={M.steel} cast={false} />
      <B at={[side * (W / 2 + 0.002), 0.05, 0]} s={[0.02, 0.1, len]} m={M.steel} cast={false} />
      <group position={[0, y0 * 0, 0]} />
    </group>
  )
}

function EndWall({ z, ops, mat, gableMat, withGable = true, face }: { z: number; ops: Opening[]; mat: THREE.Material; gableMat: THREE.Material; withGable?: boolean; face: 1 | -1 }) {
  return (
    <group position={[0, 0, z]}>
      <Wall L={W} H={EAVE} t={0.07} m={mat} at={[0, 0, face * 0.035]} openings={ops} />
      <Wall L={W} H={EAVE} t={0.2} m={M.plaster} at={[0, 0, -face * 0.1]} openings={ops} />
      {ops.map((op, i) => (
        <Glazing key={i} o={op} wallT={T} at={[0, 0, face * 0.0]} glass={M.glass} />
      ))}
      {withGable && (
        <Gable W={W} R={(W / 2) * Math.tan(PITCH)} D={0.12} m={gableMat} at={[0, EAVE, face > 0 ? -0.03 : -0.09]} />
      )}
    </group>
  )
}

function Interior({ ext, y0 }: { ext: boolean; y0: number }) {
  // local z: north -5.35 .. south +5.35 (existing 7.4 + extension 3.3 = 10.7), group is centred on the whole house
  const L = ext ? 10.7 : 7.4
  const zN = -L / 2
  const loftY = 2.32
  return (
    <group>
      {/* floor */}
      <B at={[0, 0.03, 0]} s={[W - 0.3, 0.06, L - 0.2]} m={M.light} cast={false} />
      {/* loft at north end */}
      <B at={[0, loftY, zN + 1.55]} s={[W - 0.34, 0.18, 3.0]} m={M.light} />
      <B at={[0.3, loftY + 0.32, zN + 1.0]} s={[1.6, 0.34, 1.95]} m={M.fabricLinen} />
      <B at={[0.3, loftY + 0.5, zN + 0.95]} s={[1.5, 0.08, 1.8]} m={M.fabricGrey} />
      <B at={[0.3, loftY + 0.56, zN + 1.6]} s={[1.5, 0.08, 0.6]} m={M.fabricMustard} />
      {/* slat balustrade */}
      {Array.from({ length: 14 }, (_, i) => (
        <B key={i} at={[-1.75 + i * 0.27, loftY + 0.6, zN + 3.08]} s={[0.04, 0.95, 0.04]} m={M.steel} cast={false} />
      ))}
      <B at={[0, loftY + 1.08, zN + 3.08]} s={[W - 0.5, 0.04, 0.05]} m={M.steel} cast={false} />
      {/* bathroom core under loft */}
      <B at={[-0.1, 1.2, zN + 3.15]} s={[3.2, 2.4, 0.1]} m={M.plasterDark} />
      <B at={[0.35, 0.45, zN + 1.5]} s={[0.4, 0.4, 0.5]} m={M.plaster} />
      <B at={[0.7, 0.9, zN + 2.6]} s={[0.55, 0.12, 0.4]} m={M.plaster} />
      {/* stair along west wall, rising north */}
      {Array.from({ length: 11 }, (_, i) => (
        <B key={i} at={[-1.55, 0.1 + i * 0.205, zN + 6.0 - i * 0.2 - 1.2]} s={[0.8, 0.07, 0.4]} m={M.light} />
      ))}
      {/* kitchen run */}
      <B at={[-1.55, 0.45, zN + 6.45]} s={[0.62, 0.9, 2.0]} m={M.plasterDark} />
      <B at={[-1.55, 0.92, zN + 6.45]} s={[0.66, 0.04, 2.04]} m={M.light} cast={false} />
      <B at={[-1.8, 1.9, zN + 6.5]} s={[0.35, 0.7, 1.4]} m={M.plasterDark} />
      {/* dining */}
      <Cyl at={[0.35, 0.72, zN + 7.4]} r={0.5} h={0.04} m={M.light} />
      <Cyl at={[0.35, 0.36, zN + 7.4]} r={0.05} h={0.72} m={M.steel} />
      {[0, 1, 2].map((i) => (
        <B key={i} at={[0.35 + Math.cos(i * 2.1) * 0.78, 0.25, zN + 7.4 + Math.sin(i * 2.1) * 0.78]} s={[0.4, 0.5, 0.4]} m={M.light} />
      ))}
      {ext && (
        <group>
          {/* living: L-shaped sofa + low table */}
          <B at={[-0.2, 0.22, zN + 9.6]} s={[2.3, 0.44, 0.9]} m={M.fabricGrey} />
          <B at={[-0.2, 0.55, zN + 10.0]} s={[2.3, 0.35, 0.2]} m={M.fabricGrey} />
          <B at={[-1.2, 0.22, zN + 8.9]} s={[0.9, 0.44, 1.3]} m={M.fabricGrey} />
          <B at={[-0.4, 0.55, zN + 9.55]} s={[0.4, 0.22, 0.14]} m={M.fabricMustard} />
          <Cyl at={[0.1, 0.18, zN + 8.9]} r={0.38} h={0.36} m={M.light} />
          {/* wood stove + flue */}
          <B at={[1.45, 0.45, zN + 10.05]} s={[0.5, 0.9, 0.5]} m={M.steel} />
          <Cyl at={[1.45, 3.1, zN + 10.05]} r={0.07} h={4.2} m={M.steel} />
        </group>
      )}
      {/* plant on loft */}
      <Cyl at={[-1.2, loftY + 1.4, zN + 3.0]} r={0.22} h={0.5} m={M.green} seg={8} />
      {/* ceiling pendant track */}
      <B at={[0, 3.7, 0]} s={[0.05, 0.05, L - 1.2]} m={M.steel} cast={false} />
      {[-2.4, 0.4, 2.8].map((z, i) => (
        <mesh key={i} position={[0, 3.55, z]} material={M.lamp}>
          <sphereGeometry args={[0.1, 10, 8]} />
        </mesh>
      ))}
      <group position={[0, y0 * 0, 0]} />
    </group>
  )
}

export function Terrace({ onPick }: { onPick: ReturnType<typeof usePick> }) {
  const t = TERRACE
  const w = t.x1 - t.x0
  const d = t.z1 - t.z0
  const cx = (t.x0 + t.x1) / 2
  const cz = (t.z0 + t.z1) / 2
  const top = TERRACE_DECK_Y
  const piles = useMemo(() => {
    const p: [number, number][] = []
    for (const x of [t.x0 + 0.3, t.x0 + w / 2, t.x1 - 0.2]) for (const z of [t.z0 + 0.2, cz, t.z1 - 0.2]) p.push([x, z])
    return p
  }, [])
  return (
    <group {...onPick}>
      <B at={[cx, top - 0.05, cz]} s={[w, 0.1, d]} m={M.deck} />
      <B at={[cx, top - 0.22, cz]} s={[w - 0.1, 0.22, d - 0.1]} m={M.steel} cast={false} />
      {piles.map(([x, z], i) => {
        const g = terrainY(x, z)
        const hgt = Math.max(0.2, top - 0.3 - g + 0.25)
        return <B key={i} at={[x, g - 0.25 + hgt / 2, z]} s={[0.16, hgt, 0.16]} m={M.concrete} />
      })}
      {/* two steps to garden on the east edge */}
      <B at={[t.x1 + 0.2, top - 0.22, cz]} s={[0.4, 0.06, 1.6]} m={M.deck} />
      {/* pergola — black steel, as in the reference renders */}
      {[[t.x1 - 0.1, t.z1 - 0.1], [t.x1 - 0.1, t.z1 - 3.3]].map(([x, z], i) => (
        <B key={i} at={[x, top + 1.3, z]} s={[0.1, 2.6, 0.1]} m={M.steel} />
      ))}
      <B at={[t.x1 - 0.1, top + 2.62, t.z1 - 1.7]} s={[0.1, 0.16, 3.4]} m={M.steel} />
      <B at={[t.x0 + 0.1, top + 2.62, t.z1 - 1.7]} s={[0.1, 0.16, 3.4]} m={M.steel} />
      {Array.from({ length: 6 }, (_, i) => (
        <B key={i} at={[(t.x0 + t.x1 - 0.2) / 2, top + 2.72, t.z1 - 3.25 + i * 0.62]} s={[t.x1 - t.x0 - 0.1, 0.08, 0.06]} m={M.steel} />
      ))}
      {/* outdoor lounge: two chairs + low table */}
      {[[-0.9, -0.6], [-0.9, 0.7]].map(([dx, dz], i) => (
        <group key={i} position={[cx + 0.9 + dx, top, cz + 2.4 + dz]} rotation={[0, i ? 2.7 : 3.5, 0]}>
          <B at={[0, 0.25, 0]} s={[0.55, 0.06, 0.55]} m={M.light} />
          <B at={[0, 0.55, -0.26]} s={[0.55, 0.5, 0.05]} m={M.light} />
          <B at={[0, 0.34, 0.0]} s={[0.5, 0.1, 0.5]} m={M.fabricSage} />
          {[[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]].map(([a, b], k) => (
            <B key={k} at={[a, 0.12, b]} s={[0.04, 0.24, 0.04]} m={M.steel} cast={false} />
          ))}
        </group>
      ))}
      <Cyl at={[cx + 1.15, top + 0.18, cz + 2.55]} r={0.32} h={0.36} m={M.concrete} />
    </group>
  )
}

export function ExistingShed({ onPick }: { onPick: ReturnType<typeof usePick> }) {
  const b = SHED_EXISTING
  const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2
  const w = b.x1 - b.x0, d = b.z1 - b.z0
  const g = terrainY(cx, cz)
  const m = useMemo(() => flatMat('#8f9a9d', 0.5, 0.5), [])
  return (
    <group position={[cx, g, cz]} {...onPick}>
      <B at={[0, 1.0, 0]} s={[w, 2.0, d]} m={m} />
      <B at={[0, 2.1, 0]} s={[w + 0.1, 0.1, d + 0.1]} m={flatMat('#6f787b', 0.5, 0.5)} rot={[0.06, 0, 0]} />
      <B at={[0, 0.8, d / 2 + 0.01]} s={[w - 0.5, 1.6, 0.03]} m={flatMat('#5f6769', 0.5, 0.4)} />
    </group>
  )
}

export function House() {
  const phase = useStore((s) => s.phase)
  const interiors = useStore((s) => s.layers.interiors)
  const { night, snow } = useSunState()
  const pickHouse = usePick('house')
  const pickExt = usePick('extension')
  const pickTerrace = usePick('terrace')
  const pickShed = usePick('shed')
  const extOn = phase >= 1
  const charredNew = useMemo(() => {
    const m = M.charred.clone()
    m.color = new THREE.Color('#ffe9da')
    return m
  }, [])
  void snow

  const e = HOUSE_EXISTING
  const x = (e.x0 + e.x1) / 2
  const zE = (e.z0 + e.z1) / 2 // existing centre
  const zX = (HOUSE_EXTENSION.z0 + HOUSE_EXTENSION.z1) / 2
  const y0 = HOUSE_Y0
  const Lx = 7.4
  const Lext = 3.3

  const eastEx: Opening[] = [
    o(-3.0, -1.4, 0.9, 2.3, { mullions: 1 }),
    o(-0.6, -0.05, 0.5, 2.55),
    o(1.0, 3.5, 0, 2.4, { mullions: 1, door: true }),
  ]
  const westEx: Opening[] = [o(-2.4, -1.4, 1.5, 2.4), o(1.1, 2.6, 1.0, 1.95)]
  const eastExt: Opening[] = [o(-1.3, 1.3, 0.5, 2.4, { mullions: 2 })]
  const westExt: Opening[] = [o(-0.4, 1.0, 1.0, 2.2)]
  const northOps: Opening[] = [ox(-0.45, 0.45, 1.9, 2.6)]
  const southOps: Opening[] = [ox(-1.5, 1.5, 0.15, 2.7, { mullions: 2 })]

  // house group for the whole footprint: local z origin at centre of full extension scheme
  return (
    <group>
      {/* plinth / foundation */}
      <group position={[x, y0, zE]} {...pickHouse}>
        <B at={[0, -0.18, 0]} s={[W + 0.1, 0.36, Lx + 0.1]} m={M.concrete} />
        <B at={[0, 0.0, 0]} s={[W - 0.1, 0.02, Lx]} m={M.light} cast={false} />
        <LongWall side={1} len={Lx} ops={eastEx} mat={M.charred} y0={y0} />
        <LongWall side={-1} len={Lx} ops={westEx} mat={M.charred} y0={y0} />
        <EndWall z={-Lx / 2} ops={northOps} mat={M.larchWarm} gableMat={M.larchWarm} face={-1} />
        {!extOn && <EndWall z={Lx / 2} ops={southOps} mat={M.larchWarm} gableMat={M.larchWarm} face={1} />}
        <GableRoof W={W} L={Lx} eave={EAVE} pitch={PITCH} endOv={[0.3, extOn ? 0 : 0.3]} />
        {/* skylight */}
        <group position={[-0.95, EAVE + 0.55, 0.4]} rotation={[0, 0, PITCH]}>
          <B at={[0, 0.06, 0]} s={[0.8, 0.06, 0.9]} m={M.steel} cast={false} />
          <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.glassDark}>
            <planeGeometry args={[0.65, 0.75]} />
          </mesh>
        </group>
        {/* wall lights beside the sliding door */}
        {[1.0, 3.6].map((z, i) => (
          <B key={i} at={[W / 2 + 0.09, 1.9, z]} s={[0.1, 0.28, 0.1]} m={i ? M.lamp : M.lamp} cast={false} />
        ))}
        {!interiors && <group />}
        <group visible={!interiors || true}>{extOn ? null : <Interior ext={false} y0={y0} />}</group>
        {/* drainage: downpipes to the rain tanks */}
        <Cyl at={[W / 2 + 0.06, 1.45, -Lx / 2 + 0.2]} r={0.045} h={2.9} m={M.steel} seg={8} />
        {night > 0.2 && <pointLight position={[0, 2.2, 0]} intensity={4.5 * night} distance={9} color="#ffb870" decay={1.6} />}
      </group>

      {extOn && (
        <group position={[x, y0, zX]} {...pickExt}>
          <B at={[0, -0.18, 0]} s={[W + 0.1, 0.36, Lext + 0.05]} m={M.concrete} />
          <B at={[0, 0.0, 0]} s={[W - 0.1, 0.02, Lext]} m={M.light} cast={false} />
          <LongWall side={1} len={Lext} ops={eastExt} mat={charredNew} y0={y0} />
          <LongWall side={-1} len={Lext} ops={westExt} mat={charredNew} y0={y0} />
          <EndWall z={Lext / 2} ops={southOps} mat={M.larchNew} gableMat={M.larchNew} face={1} />
          <GableRoof W={W} L={Lext} eave={EAVE} pitch={PITCH} endOv={[0, 0.35]} />
          <B at={[W / 2 + 0.09, 1.9, -1.4]} s={[0.1, 0.28, 0.1]} m={M.lamp} cast={false} />
          <B at={[W / 2 + 0.09, 1.9, 1.4]} s={[0.1, 0.28, 0.1]} m={M.lamp} cast={false} />
          <pointLight position={[0, 2.0, 0]} intensity={3.2 * night} distance={7} color="#ffb870" decay={1.6} />
        </group>
      )}
      {/* interior of the finished (phase ≥ 1) house, positioned about the full length */}
      {extOn && (
        <group position={[x, y0, (e.z0 + HOUSE_EXTENSION.z1) / 2]}>
          <Interior ext y0={y0} />
        </group>
      )}
      {extOn && <Terrace onPick={pickTerrace} />}
      {!extOn && <ExistingShed onPick={pickShed} />}
    </group>
  )
}

export { Cyl }
