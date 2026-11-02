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
export const Bi = (p: { at: V3; s: V3; m: THREE.Material; rot?: V3; cast?: boolean }) => <BoxFull {...p} cast={p.cast ?? false} />
export const ball = new THREE.IcosahedronGeometry(1, 2)
export const LOFT_Y = 2.35

export function Plant({ at, h = 1.0, pot = 0.2 }: { at: V3; h?: number; pot?: number }) {
  return (
    <group position={at}>
      <Cyl at={[0, pot * 0.9, 0]} r={pot} h={pot * 1.8} m={M.pot} seg={12} cast={false} />
      <mesh position={[0, pot * 1.8 + h * 0.35, 0]} scale={[h * 0.32, h * 0.38, h * 0.32]} geometry={ball} material={M.green} />
      <mesh position={[0.08 * h, pot * 1.8 + h * 0.62, 0.04]} scale={[h * 0.22, h * 0.26, h * 0.22]} geometry={ball} material={M.green} />
    </group>
  )
}

export function HouseInterior() {
  const balust = useMemo(() => Array.from({ length: 11 }, (_, i) => -1.7 + i * 0.17), [])
  const steps = useMemo(() => Array.from({ length: 11 }, (_, i) => i), [])
  const screen = useMemo(() => Array.from({ length: 14 }, (_, i) => -1.12 + i * 0.145), [])
  return (
    <group>
      {/* floor: wide-plank oak */}
      <Bi at={[0, 0.03, 0]} s={[3.66, 0.06, 7.1]} m={M.oak} />

      {/* ---------- LOFT over the bathroom: reading nook (continues as the 2nd bedroom over the extension) ---------- */}
      <Bi at={[0, LOFT_Y - 0.1, -2.375]} s={[3.66, 0.2, 2.35]} m={M.oak} cast />
      <Bi at={[0, LOFT_Y - 0.22, -2.375]} s={[3.66, 0.04, 2.35]} m={M.plaster} />
      {/* reading nook: rug, deep armchair, floor lamp, low table and a wall of books */}
      <Bi at={[-0.2, LOFT_Y + 0.02, -2.4]} s={[2.2, 0.02, 1.6]} m={M.rug} />
      <Bi at={[0.7, LOFT_Y + 0.24, -2.6]} s={[0.9, 0.44, 0.85]} m={M.fabricSage} cast />
      <Bi at={[0.7, LOFT_Y + 0.62, -2.98]} s={[0.9, 0.5, 0.14]} m={M.fabricSage} rot={[-0.12, 0, 0]} />
      <Bi at={[0.62, LOFT_Y + 0.55, -2.45]} s={[0.4, 0.3, 0.1]} m={M.fabricMustard} rot={[0.4, 0.3, 0]} />
      <Cyl at={[-0.35, LOFT_Y + 0.2, -2.3]} r={0.28} h={0.4} m={M.tubWood} seg={20} cast />
      <Bi at={[-0.35, LOFT_Y + 0.43, -2.3]} s={[0.26, 0.05, 0.19]} m={M.fabricLinen} />
      <Cyl at={[1.5, LOFT_Y + 0.8, -2.1]} r={0.012} h={1.6} m={M.steel} seg={6} cast={false} />
      <mesh position={[1.5, LOFT_Y + 1.55, -2.1]} scale={[0.16, 0.14, 0.16]} geometry={ball} material={M.paper} />
      <Bi at={[-1.6, LOFT_Y + 0.9, -2.5]} s={[0.3, 1.8, 2.0]} m={M.light} />
      {Array.from({ length: 12 }, (_, i) => <Bi key={i} at={[-1.43, LOFT_Y + 0.55 + (i % 4) * 0.4, -3.2 + Math.floor(i / 4) * 0.62]} s={[0.12, 0.3, 0.45]} m={[M.fabricMustard, M.fabricGrey, M.fabricSage, M.fabricLinen][i % 4]} />)}
      <Plant at={[1.55, LOFT_Y, -3.2]} h={0.7} pot={0.14} />
      {balust.map((x, i) => <Bi key={i} at={[x, LOFT_Y + 0.5, -1.22]} s={[0.025, 1.0, 0.025]} m={M.steel} />)}
      <Bi at={[-0.8, LOFT_Y + 1.0, -1.22]} s={[1.95, 0.04, 0.06]} m={M.steel} />
      <Bi at={[-0.8, LOFT_Y + 0.04, -1.22]} s={[1.95, 0.04, 0.06]} m={M.steel} />

      {/* ---------- STAIR along the east wall, behind a tall black slat screen ---------- */}
      {steps.map((i) => (
        <Bi key={i} at={[1.42, 0.19 * (i + 1) - 0.03, 0.8 - i * 0.18]} s={[0.8, 0.06, 0.3]} m={M.oak} cast />
      ))}
      {screen.map((z, i) => <Bi key={i} at={[0.97, 1.15, z + 1.0]} s={[0.03, 2.3, 0.05]} m={M.steel} />)}
      <Bi at={[0.97, 2.28, 0.0]} s={[0.04, 0.05, 2.1]} m={M.steel} />

      {/* wall between bathroom and bedroom, door at x −1.7…−0.9 */}
      <Bi at={[0.5, 1.08, -3.58]} s={[2.8, 2.16, 0.08]} m={M.plaster} />
      <Bi at={[-1.77, 1.08, -3.58]} s={[0.12, 2.16, 0.08]} m={M.plaster} />
      {/* ---------- BATHROOM (z −3.55…−2.0, x −0.76…1.83): WC, vanity, walk-in shower ---------- */}
      <Bi at={[-0.76, 1.08, -2.775]} s={[0.08, 2.16, 1.55]} m={M.plaster} />
      <Bi at={[0.54, 1.08, -2.0]} s={[2.6, 2.16, 0.08]} m={M.plaster} />
      <Bi at={[0.54, 0.07, -2.77]} s={[2.55, 0.02, 1.5]} m={M.stone} />
      <Bi at={[-0.4, 0.2, -3.2]} s={[0.55, 0.4, 0.4]} m={M.ceramic} />
      <Bi at={[-0.4, 0.6, -3.42]} s={[0.15, 0.4, 0.4]} m={M.ceramic} />
      <Bi at={[0.5, 0.42, -3.3]} s={[0.46, 0.84, 0.8]} m={M.light} />
      <Cyl at={[0.5, 0.9, -3.3]} r={0.2} h={0.12} m={M.ceramic} seg={20} cast={false} />
      <Cyl at={[0.3, 1.55, -3.3]} r={0.3} h={0.03} m={M.steelLight} rot={[0, 0, Math.PI / 2]} seg={28} cast={false} />
      <Bi at={[1.3, 0.04, -2.55]} s={[1.0, 0.06, 0.9]} m={M.slate} />
      <Bi at={[1.3, 1.0, -2.07]} s={[1.0, 2.0, 0.015]} m={M.glass} />
      <Cyl at={[1.4, 2.0, -2.8]} r={0.1} h={0.03} m={M.steelLight} seg={14} cast={false} />
      {/* bathroom door in the west partition (z −2.96…−2.16) */}
      <group position={[-0.76, 0, -2.16]} rotation={[0, -1.1, 0]}>
        <Bi at={[0, 1.0, -0.4]} s={[0.04, 2.0, 0.8]} m={M.light} />
      </group>

      {/* ---------- ENTRANCE (west wall z −1.95…−1.05) with coat hooks ---------- */}
      <Bi at={[-1.75, 1.6, -0.5]} s={[0.06, 0.06, 1.0]} m={M.steel} />
      {[0, 1, 2].map((i) => <Bi key={i} at={[-1.72, 1.2, -0.85 + i * 0.35]} s={[0.05, 0.75, 0.2]} m={[M.fabricGrey, M.fabricSage, M.fabricLinen][i]} />)}
      <Bi at={[-1.5, 0.22, -1.25]} s={[0.4, 0.05, 0.9]} m={M.light} />

      {/* ---------- KITCHEN: L-shaped cook zone + island (z −2.0…0.5), sofa stays in the living area ---------- */}
      {/* north run along the bathroom wall: fridge-freezer, tall pantry, 4-ring hob with hood, sink */}
      <Bi at={[-1.35, 1.0, -1.62]} s={[0.6, 2.0, 0.62]} m={M.steelLight} />
      <Bi at={[-0.78, 1.0, -1.62]} s={[0.5, 2.0, 0.62]} m={M.light} />
      <Bi at={[0.22, 0.45, -1.62]} s={[1.5, 0.9, 0.62]} m={M.light} />
      <Bi at={[0.22, 0.92, -1.62]} s={[1.54, 0.04, 0.66]} m={M.counter} />
      <Bi at={[-0.25, 0.935, -1.62]} s={[0.5, 0.02, 0.44]} m={M.steelLight} />
      <Cyl at={[-0.25, 1.1, -1.84]} r={0.015} h={0.35} m={M.steelLight} seg={6} cast={false} />
      {[[0.5, -1.7], [0.85, -1.7], [0.5, -1.5], [0.85, -1.5]].map(([x, z], i) => <Cyl key={i} at={[x, 0.945, z]} r={0.09} h={0.01} m={M.steel} seg={16} cast={false} />)}
      <Bi at={[0.68, 1.95, -1.78]} s={[0.7, 0.5, 0.4]} m={M.steel} />
      <Bi at={[0.68, 2.5, -1.9]} s={[0.2, 0.7, 0.2]} m={M.steel} />
      {/* west run from the entrance: worktop with window-side herbs and open shelf */}
      <Bi at={[-1.52, 0.45, -0.2]} s={[0.62, 0.9, 1.5]} m={M.light} />
      <Bi at={[-1.5, 0.92, -0.2]} s={[0.66, 0.04, 1.54]} m={M.counter} />
      <Bi at={[-1.72, 1.65, -0.2]} s={[0.2, 0.035, 1.3]} m={M.light} />
      {[0, 1, 2, 3, 4].map((i) => <Cyl key={i} at={[-1.72, 1.72, -0.7 + i * 0.27]} r={0.06} h={0.12} m={i % 2 ? M.ceramic : M.pot} seg={12} cast={false} />)}
      {[0, 1, 2].map((i) => <Cyl key={'h' + i} at={[-1.5, 1.02, -0.6 + i * 0.3]} r={0.07} h={0.14} m={M.pot} seg={10} cast={false} />)}
      {/* island with prep top, second sink, 3 stools — walkway 0.9 m on each side */}
      <Bi at={[-0.1, 0.45, -0.45]} s={[1.7, 0.9, 0.8]} m={M.light} cast />
      <Bi at={[-0.1, 0.92, -0.45]} s={[1.78, 0.05, 0.88]} m={M.oak} cast />
      <Bi at={[-0.5, 0.95, -0.45]} s={[0.4, 0.02, 0.4]} m={M.steelLight} />
      <Cyl at={[-0.5, 1.12, -0.6]} r={0.014} h={0.38} m={M.steelLight} seg={6} cast={false} />
      <Bi at={[0.3, 0.97, -0.45]} s={[0.5, 0.03, 0.3]} m={M.fabricLinen} />
      {[-0.55, -0.1, 0.35].map((x, i) => (
        <group key={i} position={[x, 0, 0.25]}>
          <Cyl at={[0, 0.62, 0]} r={0.17} h={0.04} m={M.light} seg={14} />
          <Cyl at={[0, 0.3, 0]} r={0.025} h={0.6} m={M.steel} seg={6} cast={false} />
          <Cyl at={[0, 0.03, 0]} r={0.16} h={0.04} m={M.steel} seg={14} cast={false} />
        </group>
      ))}
      {[-0.4, 0.2].map((x, i) => (
        <group key={'p' + i} position={[x, 2.45, -0.45]}>
          <Cyl at={[0, 0.3, 0]} r={0.005} h={1.2} m={M.steel} seg={4} cast={false} />
          <mesh position={[0, -0.1, 0]} scale={[0.15, 0.13, 0.15]} geometry={ball} material={M.paper} />
        </group>
      ))}
      {/* pots on the hob, board and bowl on the island */}
      <Cyl at={[0.5, 1.02, -1.7]} r={0.11} h={0.14} m={M.steelLight} seg={14} cast={false} />
      <Cyl at={[0.85, 0.99, -1.5]} r={0.09} h={0.08} m={M.steel} seg={14} cast={false} />
      <Cyl at={[0.0, 1.0, -0.4]} r={0.13} h={0.08} m={M.ceramic} seg={16} cast={false} />

      {/* ---------- DINING ---------- */}
      <Cyl at={[0.2, 0.045, 1.35]} r={1.1} h={0.02} m={M.rug} seg={32} cast={false} />
      <Cyl at={[0.2, 0.73, 1.35]} r={0.55} h={0.04} m={M.light} seg={32} cast />
      <Cyl at={[0.2, 0.37, 1.35]} r={0.05} h={0.72} m={M.steel} seg={10} cast={false} />
      {[0.4, 2.0, 3.6, 5.2].map((a, i) => {
        const x = 0.2 + Math.cos(a) * 0.8, z = 1.35 + Math.sin(a) * 0.8
        return (
          <group key={i} position={[x, 0, z]} rotation={[0, -a - Math.PI / 2, 0]}>
            <Bi at={[0, 0.44, 0]} s={[0.42, 0.04, 0.4]} m={M.light} />
            <Bi at={[0, 0.76, -0.19]} s={[0.4, 0.5, 0.03]} m={M.light} rot={[-0.12, 0, 0]} />
            {[[-0.17, -0.16], [0.17, -0.16], [-0.17, 0.16], [0.17, 0.16]].map(([a1, b1], k) => <Bi key={k} at={[a1, 0.22, b1]} s={[0.03, 0.44, 0.03]} m={M.steel} />)}
          </group>
        )
      })}
      <Cyl at={[0.2, 0.9, 1.35]} r={0.07} h={0.16} m={M.pot} seg={10} cast={false} />
      <Cyl at={[0.2, 3.0, 1.35]} r={0.006} h={1.8} m={M.steel} seg={4} cast={false} />
      <mesh position={[0.2, 2.05, 1.35]} scale={[0.24, 0.21, 0.24]} geometry={ball} material={M.paper} />

      {/* ---------- LIVING: corner sofa along the west wall, side table, stove by the terrace door ---------- */}
      <Bi at={[-0.3, 0.045, 2.45]} s={[2.5, 0.02, 2.0]} m={M.rug} />
      <Bi at={[-1.38, 0.24, 2.4]} s={[0.9, 0.46, 2.2]} m={M.fabricGrey} cast />
      <Bi at={[-1.74, 0.6, 2.4]} s={[0.2, 0.36, 2.2]} m={M.fabricGrey} />
      <Bi at={[-0.45, 0.24, 3.1]} s={[1.0, 0.46, 0.8]} m={M.fabricGrey} cast />
      <Bi at={[-0.45, 0.6, 3.5]} s={[1.0, 0.36, 0.14]} m={M.fabricGrey} />
      <Bi at={[-1.35, 0.6, 1.6]} s={[0.12, 0.34, 0.38]} m={M.fabricMustard} rot={[0, 0.2, 0.3]} />
      <Bi at={[-1.35, 0.58, 2.2]} s={[0.12, 0.34, 0.4]} m={M.fabricSage} rot={[0, -0.1, 0.3]} />
      <Cyl at={[-0.45, 0.2, 2.6]} r={0.3} h={0.4} m={M.tubWood} seg={24} cast />
      <Bi at={[1.2, 0.2, 2.6]} s={[0.5, 0.4, 0.8]} m={M.light} />
      <Bi at={[1.4, 0.04, 3.3]} s={[0.8, 0.08, 0.8]} m={M.slate} />
      <Bi at={[1.4, 0.55, 3.3]} s={[0.46, 0.9, 0.46]} m={M.steel} cast />
      <Bi at={[1.17, 0.5, 3.3]} s={[0.02, 0.4, 0.3]} m={M.glassDark} />
      <Cyl at={[1.4, 2.6, 3.3]} r={0.075} h={3.4} m={M.steel} seg={10} cast={false} />
      <Cyl at={[1.4, 4.4, 3.3]} r={0.11} h={0.12} m={M.steel} seg={10} cast={false} />
      <Plant at={[1.5, 0, 1.0]} h={1.2} pot={0.2} />

      {/* ---------- CEILING: timber tie beams, track light ---------- */}
      {[-0.4, 1.9].map((z, i) => <Bi key={i} at={[0, 3.12, z]} s={[3.5, 0.13, 0.13]} m={M.tubWood} cast />)}
      <Bi at={[0, 3.75, 0.9]} s={[0.05, 0.05, 4.6]} m={M.steel} />
      {[-0.3, 1.5, 3.0].map((z, i) => (
        <group key={i} position={[0, 3.75, z]}>
          <Cyl at={[0, -0.12, 0]} r={0.012} h={0.24} m={M.steel} seg={6} cast={false} />
          <Cyl at={[0, -0.3, 0]} r={0.07} h={0.14} m={M.lamp} seg={12} cast={false} />
        </group>
      ))}
    </group>
  )
}

/** Bedroom of the extension (3.3 m, next to the bathroom) with the loft continuing above it. Group origin = extension centre. */
export function BedroomInterior() {
  return (
    <group>
      <Bi at={[0, 0.03, 0]} s={[3.66, 0.06, 3.2]} m={M.oak} />
      {/* bedroom: double bed head to the north wall, built-in wardrobe in the NW corner, door in the partition */}
      <Bi at={[0.5, 0.2, -0.55]} s={[1.65, 0.34, 2.05]} m={M.light} />
      <Bi at={[0.5, 0.42, -0.5]} s={[1.58, 0.2, 1.95]} m={M.fabricLinen} />
      <Bi at={[0.5, 0.55, 0.0]} s={[1.6, 0.08, 0.9]} m={M.fabricGrey} />
      <Bi at={[0.1, 0.6, -1.3]} s={[0.55, 0.16, 0.35]} m={M.fabricLinen} rot={[0.15, 0, 0]} />
      <Bi at={[0.9, 0.6, -1.3]} s={[0.55, 0.16, 0.35]} m={M.fabricSage} rot={[0.15, 0, 0]} />
      {Array.from({ length: 14 }, (_, i) => <Bi key={i} at={[-0.1 + i * 0.1, 1.0, -1.57]} s={[0.07, 1.1, 0.03]} m={M.tubWood} />)}
      {[-0.5, 1.5].map((x, i) => (
        <group key={i} position={[x, 0, -1.3]}>
          <Bi at={[0, 0.25, 0]} s={[0.4, 0.5, 0.4]} m={M.light} />
          <mesh position={[0, 0.68, 0]} scale={[0.1, 0.14, 0.1]} geometry={ball} material={M.paper} />
        </group>
      ))}
      <Bi at={[-1.53, 1.05, -0.95]} s={[0.6, 2.1, 1.2]} m={M.light} />
      <Bi at={[-1.23, 1.05, -0.95]} s={[0.02, 2.04, 1.15]} m={M.sauna} />
      <Bi at={[-0.9, 0.06, 0.4]} s={[1.3, 0.02, 1.6]} m={M.rug} />
      <Plant at={[1.5, 0, 1.2]} h={1.1} pot={0.2} />
      {/* LOFT continues over the bedroom */}
      <Bi at={[0, LOFT_Y - 0.1, 0]} s={[3.66, 0.2, 3.3]} m={M.oak} cast />
      <Bi at={[0, LOFT_Y - 0.22, 0]} s={[3.66, 0.04, 3.3]} m={M.plaster} />
      <Bi at={[0.2, LOFT_Y + 0.15, -0.35]} s={[1.75, 0.22, 2.0]} m={M.light} />
      <Bi at={[0.2, LOFT_Y + 0.38, -0.35]} s={[1.65, 0.22, 1.9]} m={M.fabricLinen} />
      <Bi at={[0.2, LOFT_Y + 0.52, 0.05]} s={[1.67, 0.1, 1.1]} m={M.fabricGrey} />
      <Bi at={[0.2, LOFT_Y + 0.5, 0.6]} s={[1.68, 0.08, 0.32]} m={M.fabricMustard} />
      {Array.from({ length: 16 }, (_, i) => <Bi key={i} at={[-0.55 + i * 0.1, LOFT_Y + 0.75, -1.57]} s={[0.07, 1.2, 0.03]} m={M.tubWood} />)}
      {[-0.95, 1.35].map((x, i) => (
        <group key={i} position={[x, LOFT_Y, -1.3]}>
          <Bi at={[0, 0.2, 0]} s={[0.4, 0.4, 0.4]} m={M.light} />
          <mesh position={[0, 0.58, 0]} scale={[0.1, 0.14, 0.1]} geometry={ball} material={M.paper} />
        </group>
      ))}
      <Plant at={[-1.4, LOFT_Y, 1.1]} h={0.9} pot={0.15} />
      <Bi at={[0, 3.12, -0.2]} s={[3.5, 0.13, 0.13]} m={M.tubWood} cast />
    </group>
  )
}
