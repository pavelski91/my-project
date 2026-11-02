import { useMemo } from 'react'
import * as THREE from 'three'
import { B as BoxFull, Cyl } from './prims'
import { M } from './materials'

/**
 * Japandi interior of the existing house (4.2 × 7.4 m) — follows the supplied section:
 * sleeping loft (antresola) over bathroom + wardrobe at the north end, steep oak stair behind a tall black slat screen,
 * dining in the middle, living with stove at the south end behind the big glazing.
 * Group origin = floor level at the house centre. Local x: −1.83 … 1.83, local z: −3.55 (north) … 3.55 (south).
 */
type V3 = [number, number, number]
const Bi = (p: { at: V3; s: V3; m: THREE.Material; rot?: V3; cast?: boolean }) => <BoxFull {...p} cast={p.cast ?? false} />
const ball = new THREE.IcosahedronGeometry(1, 2)
const LOFT_Y = 2.35

function Plant({ at, h = 1.0, pot = 0.2 }: { at: V3; h?: number; pot?: number }) {
  return (
    <group position={at}>
      <Cyl at={[0, pot * 0.9, 0]} r={pot} h={pot * 1.8} m={M.pot} seg={12} cast={false} />
      <mesh position={[0, pot * 1.8 + h * 0.35, 0]} scale={[h * 0.32, h * 0.38, h * 0.32]} geometry={ball} material={M.green} />
      <mesh position={[0.08 * h, pot * 1.8 + h * 0.62, 0.04]} scale={[h * 0.22, h * 0.26, h * 0.22]} geometry={ball} material={M.green} />
    </group>
  )
}

export function HouseInterior() {
  const balust = useMemo(() => Array.from({ length: 16 }, (_, i) => -0.85 + i * 0.17), [])
  const steps = useMemo(() => Array.from({ length: 11 }, (_, i) => i), [])
  const screen = useMemo(() => Array.from({ length: 14 }, (_, i) => -0.92 + i * 0.145), [])
  return (
    <group>
      {/* floor: wide-plank pale oak */}
      <Bi at={[0, 0.03, 0]} s={[3.66, 0.06, 7.1]} m={M.oak} />

      {/* ---------- SLEEPING LOFT (antresola) ---------- */}
      <Bi at={[0, LOFT_Y - 0.1, -2.25]} s={[3.66, 0.2, 2.6]} m={M.oak} cast />
      <Bi at={[0, LOFT_Y - 0.22, -2.25]} s={[3.66, 0.04, 2.6]} m={M.plaster} />
      <Bi at={[0.2, LOFT_Y + 0.15, -2.6]} s={[1.75, 0.22, 2.0]} m={M.light} />
      <Bi at={[0.2, LOFT_Y + 0.38, -2.6]} s={[1.65, 0.22, 1.9]} m={M.fabricLinen} />
      <Bi at={[0.2, LOFT_Y + 0.52, -2.2]} s={[1.67, 0.1, 1.1]} m={M.fabricGrey} />
      <Bi at={[0.2, LOFT_Y + 0.5, -1.65]} s={[1.68, 0.08, 0.32]} m={M.fabricMustard} />
      <Bi at={[-0.22, LOFT_Y + 0.55, -3.35]} s={[0.6, 0.16, 0.38]} m={M.fabricLinen} rot={[0.15, 0, 0]} />
      <Bi at={[0.62, LOFT_Y + 0.55, -3.35]} s={[0.6, 0.16, 0.38]} m={M.fabricSage} rot={[0.15, 0, 0]} />
      {Array.from({ length: 16 }, (_, i) => (
        <Bi key={i} at={[-0.55 + i * 0.1, LOFT_Y + 0.75, -3.5]} s={[0.07, 1.2, 0.03]} m={M.tubWood} />
      ))}
      {[-0.95, 1.35].map((x, i) => (
        <group key={i} position={[x, LOFT_Y, -3.3]}>
          <Bi at={[0, 0.2, 0]} s={[0.4, 0.4, 0.4]} m={M.light} />
          <mesh position={[0, 0.58, 0]} scale={[0.1, 0.14, 0.1]} geometry={ball} material={M.paper} />
        </group>
      ))}
      <Plant at={[1.45, LOFT_Y, -1.2]} h={0.85} pot={0.16} />
      {balust.map((x, i) => <Bi key={i} at={[x + 0.15, LOFT_Y + 0.5, -0.97]} s={[0.025, 1.0, 0.025]} m={M.steel} />)}
      <Bi at={[0.35, LOFT_Y + 1.0, -0.97]} s={[2.6, 0.04, 0.06]} m={M.steel} />
      <Bi at={[0.35, LOFT_Y + 0.04, -0.97]} s={[2.6, 0.04, 0.06]} m={M.steel} />

      {/* ---------- STAIR: oak treads behind a tall black slat screen ---------- */}
      {steps.map((i) => (
        <Bi key={i} at={[-1.42, 0.19 * (i + 1) - 0.03, 0.95 - i * 0.17]} s={[0.8, 0.06, 0.28]} m={M.oak} cast />
      ))}
      {screen.map((z, i) => <Bi key={i} at={[-0.97, 1.15, z + 0.05]} s={[0.03, 2.3, 0.05]} m={M.steel} />)}
      <Bi at={[-0.97, 2.28, 0.05]} s={[0.04, 0.05, 2.0]} m={M.steel} />

      {/* ---------- UNDER THE LOFT: wardrobe, hall, bathroom ---------- */}
      <Bi at={[-0.95, 1.05, -3.27]} s={[1.74, 2.1, 0.55]} m={M.light} />
      {[-1.5, -0.95, -0.4].map((x, i) => <Bi key={i} at={[x, 1.05, -2.98]} s={[0.54, 2.04, 0.02]} m={M.sauna} />)}
      <Bi at={[-0.9, 0.06, -1.9]} s={[1.5, 0.02, 1.3]} m={M.rug} />
      {/* bathroom partition + pale tile floor */}
      <Bi at={[0.0, 1.08, -2.25]} s={[0.08, 2.16, 2.6]} m={M.plaster} />
      <Bi at={[1.3, 1.08, -0.97]} s={[1.0, 2.16, 0.08]} m={M.plaster} />
      <Bi at={[0.95, 0.07, -2.3]} s={[1.75, 0.02, 2.5]} m={M.stone} />
      <group position={[0.2, 0, -0.97]} rotation={[0, 1.0, 0]}>
        <Bi at={[0.35, 1.0, 0]} s={[0.7, 2.0, 0.04]} m={M.light} />
        <Bi at={[0.62, 1.0, 0.03]} s={[0.03, 0.14, 0.03]} m={M.steelLight} />
      </group>
      {/* WC, vanity with round mirror, walk-in shower */}
      <Bi at={[1.45, 0.2, -3.2]} s={[0.4, 0.4, 0.55]} m={M.ceramic} />
      <Bi at={[1.45, 0.6, -3.42]} s={[0.4, 0.4, 0.15]} m={M.ceramic} />
      <Bi at={[0.6, 0.42, -3.3]} s={[0.8, 0.84, 0.46]} m={M.light} />
      <Cyl at={[0.6, 0.9, -3.3]} r={0.2} h={0.12} m={M.ceramic} seg={20} cast={false} />
      <Cyl at={[0.6, 1.55, -3.52]} r={0.3} h={0.03} m={M.steelLight} rot={[Math.PI / 2, 0, 0]} seg={28} cast={false} />
      <Bi at={[1.35, 0.04, -1.8]} s={[0.9, 0.06, 1.0]} m={M.slate} />
      <Bi at={[0.9, 1.0, -1.8]} s={[0.015, 2.0, 1.0]} m={M.glass} />
      <Cyl at={[1.65, 2.0, -1.9]} r={0.1} h={0.03} m={M.steelLight} seg={14} cast={false} />
      <Cyl at={[1.74, 1.05, -1.9]} r={0.012} h={2.1} m={M.steelLight} seg={6} cast={false} />
      {/* framed prints on the partition (hall side) */}
      <Bi at={[-0.06, 1.45, -2.0]} s={[0.03, 0.8, 0.55]} m={M.plasterDark} />
      <Bi at={[-0.08, 1.48, -2.0]} s={[0.01, 0.55, 0.35]} m={M.fabricLinen} />
      <Bi at={[-0.08, 1.35, -1.95]} s={[0.01, 0.2, 0.18]} m={M.fabricMustard} />
      {/* hall: bench and coat hooks by the east entrance door (z −0.9…0) */}
      <Bi at={[1.55, 0.24, -0.45]} s={[0.36, 0.06, 0.8]} m={M.light} />
      <Bi at={[1.55, 0.12, -0.45]} s={[0.28, 0.22, 0.7]} m={M.steel} />

      {/* ---------- DINING (middle) ---------- */}
      <Cyl at={[0.55, 0.045, 0.75]} r={1.1} h={0.02} m={M.rug} seg={32} cast={false} />
      <Cyl at={[0.55, 0.73, 0.75]} r={0.5} h={0.04} m={M.light} seg={32} cast />
      <Cyl at={[0.55, 0.37, 0.75]} r={0.05} h={0.72} m={M.steel} seg={10} cast={false} />
      {[0.4, 2.0, 3.6, 5.2].map((a, i) => {
        const x = 0.55 + Math.cos(a) * 0.78, z = 0.75 + Math.sin(a) * 0.78
        return (
          <group key={i} position={[x, 0, z]} rotation={[0, -a - Math.PI / 2, 0]}>
            <Bi at={[0, 0.44, 0]} s={[0.42, 0.04, 0.4]} m={M.light} />
            <Bi at={[0, 0.76, -0.19]} s={[0.4, 0.5, 0.03]} m={M.light} rot={[-0.12, 0, 0]} />
            {[[-0.17, -0.16], [0.17, -0.16], [-0.17, 0.16], [0.17, 0.16]].map(([a1, b1], k) => <Bi key={k} at={[a1, 0.22, b1]} s={[0.03, 0.44, 0.03]} m={M.steel} />)}
          </group>
        )
      })}
      <Cyl at={[0.55, 0.9, 0.75]} r={0.07} h={0.16} m={M.pot} seg={10} cast={false} />
      <Cyl at={[0.55, 3.0, 0.75]} r={0.006} h={1.8} m={M.steel} seg={4} cast={false} />
      <mesh position={[0.55, 2.05, 0.75]} scale={[0.24, 0.21, 0.24]} geometry={ball} material={M.paper} />

      {/* ---------- KITCHEN along the west wall (south of the stair) ---------- */}
      <Bi at={[-1.52, 1.0, 1.45]} s={[0.62, 2.0, 0.6]} m={M.steelLight} />
      <Bi at={[-1.52, 0.45, 2.4]} s={[0.62, 0.9, 1.3]} m={M.light} />
      <Bi at={[-1.5, 0.92, 2.4]} s={[0.66, 0.04, 1.34]} m={M.counter} />
      <Bi at={[-1.5, 0.935, 2.15]} s={[0.44, 0.02, 0.45]} m={M.steelLight} />
      <Cyl at={[-1.72, 1.1, 2.15]} r={0.015} h={0.35} m={M.steelLight} seg={6} cast={false} />
      <Cyl at={[-1.45, 0.945, 2.75]} r={0.09} h={0.01} m={M.steel} seg={16} cast={false} />
      <Cyl at={[-1.45, 0.945, 2.52]} r={0.07} h={0.01} m={M.steel} seg={16} cast={false} />
      <Bi at={[-1.72, 1.6, 2.4]} s={[0.2, 0.035, 1.1]} m={M.light} />
      {[0, 1, 2, 3].map((i) => <Cyl key={i} at={[-1.72, 1.67, 1.95 + i * 0.27]} r={0.06} h={0.12} m={i % 2 ? M.ceramic : M.pot} seg={12} cast={false} />)}

      {/* ---------- LIVING (south end, facing the big gable glazing) ---------- */}
      <Bi at={[0.15, 0.045, 2.35]} s={[2.6, 0.02, 1.9]} m={M.rug} />
      <Bi at={[0.1, 0.24, 3.0]} s={[1.9, 0.46, 0.9]} m={M.fabricGrey} cast />
      <Bi at={[0.1, 0.6, 3.38]} s={[1.9, 0.36, 0.18]} m={M.fabricGrey} />
      <Bi at={[-0.82, 0.42, 3.0]} s={[0.14, 0.4, 0.9]} m={M.fabricGrey} />
      <Bi at={[1.02, 0.42, 3.0]} s={[0.14, 0.4, 0.9]} m={M.fabricGrey} />
      <Bi at={[-0.35, 0.6, 3.2]} s={[0.38, 0.34, 0.12]} m={M.fabricMustard} rot={[0.3, 0.2, 0]} />
      <Bi at={[0.55, 0.58, 3.2]} s={[0.4, 0.34, 0.12]} m={M.fabricSage} rot={[0.3, -0.2, 0]} />
      <Cyl at={[0.1, 0.2, 2.0]} r={0.34} h={0.4} m={M.tubWood} seg={24} cast />
      <Bi at={[0.1, 0.41, 2.0]} s={[0.3, 0.04, 0.22]} m={M.fabricLinen} />
      {/* wood stove on a slate hearth, flue to the roof */}
      <Bi at={[1.38, 0.04, 3.2]} s={[0.8, 0.08, 0.8]} m={M.slate} />
      <Bi at={[1.38, 0.55, 3.2]} s={[0.46, 0.9, 0.46]} m={M.steel} cast />
      <Bi at={[1.38, 0.5, 2.97]} s={[0.3, 0.4, 0.02]} m={M.glassDark} />
      <Cyl at={[1.38, 2.6, 3.2]} r={0.075} h={3.4} m={M.steel} seg={10} cast={false} />
      <Cyl at={[1.38, 4.4, 3.2]} r={0.11} h={0.12} m={M.steel} seg={10} cast={false} />
      <Plant at={[-1.55, 0, 3.2]} h={1.5} pot={0.24} />
      <Bi at={[-1.78, 1.35, 3.3]} s={[0.12, 2.7, 0.5]} m={M.fabricLinen} />

      {/* ---------- CEILING: timber tie beams, black track light ---------- */}
      {[-0.4, 1.9].map((z, i) => <Bi key={i} at={[0, 3.12, z]} s={[3.5, 0.13, 0.13]} m={M.tubWood} cast />)}
      <Bi at={[0, 3.75, 0.2]} s={[0.05, 0.05, 6.4]} m={M.steel} />
      {[-1.8, 0.2, 2.2].map((z, i) => (
        <group key={i} position={[0, 3.75, z]}>
          <Cyl at={[0, -0.12, 0]} r={0.012} h={0.24} m={M.steel} seg={6} cast={false} />
          <Cyl at={[0, -0.3, 0]} r={0.07} h={0.14} m={M.lamp} seg={12} cast={false} />
        </group>
      ))}
    </group>
  )
}
