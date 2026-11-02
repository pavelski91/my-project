import { useMemo } from 'react'
import * as THREE from 'three'
import { B as BoxFull, Cyl } from './prims'
import { M } from './materials'

/**
 * Japandi interior of the house with sleeping loft (antresola).
 * Group origin = floor level, centre of the finished house (existing 7.4 m + extension 3.3 m).
 * Local x: west −1.83 … east +1.83 (inner faces), local z: north −5.35 … south +5.35.
 * Phase 0 (no extension) renders only what lies inside the existing body (z < 2.05).
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

export function HouseInterior({ ext }: { ext: boolean }) {
  const L = ext ? 10.6 : 7.3
  const fz = ext ? 0 : -1.65 // floor centre
  const slats = useMemo(() => Array.from({ length: 26 }, (_, i) => -0.9 + i * 0.1), [])
  const balust = useMemo(() => Array.from({ length: 22 }, (_, i) => -0.82 + i * 0.12), [])
  const steps = useMemo(() => Array.from({ length: 12 }, (_, i) => i), [])
  return (
    <group>
      {/* ---------- floor: wide-plank pale oak ---------- */}
      <Bi at={[0, 0.03, fz]} s={[3.66, 0.06, L]} m={M.oak} />

      {/* ---------- LOFT (antresola) over the entrance/bath zone ---------- */}
      <Bi at={[0, LOFT_Y - 0.1, -3.75]} s={[3.66, 0.2, 3.0]} m={M.oak} cast />
      <Bi at={[0, LOFT_Y - 0.22, -3.75]} s={[3.66, 0.04, 3.0]} m={M.plaster} />
      {/* bed: low frame, linen, wool throw, pillows */}
      <Bi at={[0.15, LOFT_Y + 0.15, -4.2]} s={[1.75, 0.22, 2.1]} m={M.light} />
      <Bi at={[0.15, LOFT_Y + 0.38, -4.2]} s={[1.65, 0.22, 2.0]} m={M.fabricLinen} />
      <Bi at={[0.15, LOFT_Y + 0.52, -3.75]} s={[1.67, 0.1, 1.15]} m={M.fabricGrey} />
      <Bi at={[0.15, LOFT_Y + 0.5, -3.1]} s={[1.68, 0.08, 0.35]} m={M.fabricMustard} />
      <Bi at={[-0.28, LOFT_Y + 0.55, -5.0]} s={[0.6, 0.16, 0.38]} m={M.fabricLinen} rot={[0.15, 0, 0]} />
      <Bi at={[0.58, LOFT_Y + 0.55, -5.0]} s={[0.6, 0.16, 0.38]} m={M.fabricSage} rot={[0.15, 0, 0]} />
      {/* slatted timber headboard wall */}
      {Array.from({ length: 16 }, (_, i) => (
        <Bi key={i} at={[-0.6 + i * 0.1, LOFT_Y + 0.75, -5.28]} s={[0.07, 1.2, 0.03]} m={M.tubWood} />
      ))}
      {/* nightstands + paper lamps */}
      {[-0.95, 1.3].map((x, i) => (
        <group key={i} position={[x, LOFT_Y, -5.0]}>
          <Bi at={[0, 0.2, 0]} s={[0.4, 0.4, 0.4]} m={M.light} />
          <mesh position={[0, 0.58, 0]} scale={[0.1, 0.14, 0.1]} geometry={ball} material={M.paper} />
        </group>
      ))}
      <Plant at={[1.5, LOFT_Y, -2.7]} h={0.85} pot={0.16} />
      {/* linen balustrade of slim black steel slats */}
      {balust.map((x, i) => <Bi key={i} at={[x, LOFT_Y + 0.5, -2.32]} s={[0.025, 1.0, 0.025]} m={M.steel} />)}
      <Bi at={[0.2, LOFT_Y + 1.0, -2.32]} s={[2.66, 0.04, 0.06]} m={M.steel} />
      <Bi at={[0.2, LOFT_Y + 0.04, -2.32]} s={[2.66, 0.04, 0.06]} m={M.steel} />
      {/* clerestory above the headboard: a rectangle of light */}

      {/* ---------- STAIR: oak treads, slatted black screen (as in the reference section) ---------- */}
      {steps.map((i) => (
        <Bi key={i} at={[-1.4, 0.19 * (i + 1) - 0.03, 0.8 - i * 0.25]} s={[0.85, 0.06, 0.3]} m={M.oak} cast />
      ))}
      {slats.map((z, i) => (
        <Bi key={i} at={[-0.97, 1.2 + (i % 2) * 0.0, 0.8 - (i * 3.0) / 25 - 0.0]} s={[0.03, 2.35, 0.05]} m={M.steel} />
      ))}
      <Bi at={[-1.83 + 0.03, 1.0, -0.6]} s={[0.04, 0.05, 2.9]} m={M.tubWood} rot={[0, 0, 0]} />

      {/* ---------- GROUND-FLOOR UNDER LOFT ---------- */}
      {/* built-in oak wardrobe, west half */}
      <Bi at={[-0.95, 1.05, -4.95]} s={[1.74, 2.1, 0.55]} m={M.light} />
      {[-1.5, -0.95, -0.4].map((x, i) => <Bi key={i} at={[x, 1.05, -4.66]} s={[0.54, 2.04, 0.02]} m={M.sauna} />)}
      <Bi at={[-0.95, 0.06, -3.5]} s={[1.5, 0.02, 1.5]} m={M.rug} />
      {/* bathroom (east half): plaster walls, pale tile floor */}
      <Bi at={[0.02, 1.1, -3.75]} s={[0.08, 2.2, 3.0]} m={M.plaster} />
      <Bi at={[1.4, 1.1, -2.28]} s={[0.86, 2.2, 0.08]} m={M.plaster} />
      <Bi at={[0.95, 0.07, -3.75]} s={[1.75, 0.02, 2.9]} m={M.stone} />
      {/* oak door, ajar */}
      <group position={[0.52, 0, -2.28]} rotation={[0, -1.0, 0]}>
        <Bi at={[0.4, 1.0, 0]} s={[0.8, 2.0, 0.04]} m={M.light} />
        <Bi at={[0.7, 1.0, 0.03]} s={[0.03, 0.14, 0.03]} m={M.steelLight} />
      </group>
      {/* WC, vanity with round mirror, walk-in shower */}
      <Bi at={[1.45, 0.2, -5.0]} s={[0.4, 0.4, 0.55]} m={M.ceramic} />
      <Bi at={[1.45, 0.6, -5.2]} s={[0.4, 0.4, 0.15]} m={M.ceramic} />
      <Bi at={[0.55, 0.42, -5.05]} s={[0.8, 0.84, 0.46]} m={M.light} />
      <Cyl at={[0.55, 0.9, -5.05]} r={0.2} h={0.12} m={M.ceramic} seg={20} cast={false} />
      <Cyl at={[0.55, 1.55, -5.3]} r={0.32} h={0.03} m={M.steelLight} rot={[Math.PI / 2, 0, 0]} seg={28} cast={false} />
      <Bi at={[0.95, 0.04, -3.25]} s={[1.6, 0.06, 0.95]} m={M.slate} />
      <Bi at={[0.95, 1.0, -2.78]} s={[1.5, 2.0, 0.015]} m={M.glass} />
      <Cyl at={[1.55, 2.0, -3.6]} r={0.11} h={0.03} m={M.steelLight} seg={14} cast={false} />
      <Cyl at={[1.55, 1.05, -3.7]} r={0.012} h={2.1} m={M.steelLight} seg={6} cast={false} />
      {/* wall art on the bathroom's south wall */}
      <Bi at={[1.4, 1.45, -2.22]} s={[0.78, 1.15, 0.025]} m={M.plasterDark} />
      <Bi at={[1.38, 1.5, -2.2]} s={[0.5, 0.7, 0.01]} m={M.fabricLinen} />
      <Bi at={[1.52, 1.3, -2.2]} s={[0.22, 0.3, 0.01]} m={M.fabricMustard} />

      {/* ---------- HALL (east entrance door at z −2.55…−1.65) ---------- */}
      <Bi at={[1.55, 0.24, -1.05]} s={[0.38, 0.06, 1.1]} m={M.light} />
      <Bi at={[1.55, 0.12, -1.05]} s={[0.3, 0.22, 1.0]} m={M.steel} />
      <Bi at={[1.8, 1.55, -1.05]} s={[0.03, 0.06, 1.0]} m={M.steel} />
      {[0, 1, 2].map((i) => <Bi key={i} at={[1.76, 1.15, -1.4 + i * 0.35]} s={[0.05, 0.75, 0.2]} m={[M.fabricGrey, M.fabricSage, M.fabricLinen][i]} />)}

      {/* ---------- DINING (by the sliding door) ---------- */}
      <Cyl at={[0.55, 0.045, 0.45]} r={1.15} h={0.02} m={M.rug} seg={32} cast={false} />
      <Cyl at={[0.55, 0.73, 0.45]} r={0.55} h={0.04} m={M.light} seg={32} cast />
      <Cyl at={[0.55, 0.37, 0.45]} r={0.05} h={0.72} m={M.steel} seg={10} cast={false} />
      {[0.4, 2.0, 3.6, 5.2].map((a, i) => {
        const x = 0.55 + Math.cos(a) * 0.82, z = 0.45 + Math.sin(a) * 0.82
        return (
          <group key={i} position={[x, 0, z]} rotation={[0, -a - Math.PI / 2, 0]}>
            <Bi at={[0, 0.44, 0]} s={[0.42, 0.04, 0.4]} m={M.light} />
            <Bi at={[0, 0.76, -0.19]} s={[0.4, 0.5, 0.03]} m={M.light} rot={[-0.12, 0, 0]} />
            {[[-0.17, -0.16], [0.17, -0.16], [-0.17, 0.16], [0.17, 0.16]].map(([a1, b1], k) => <Bi key={k} at={[a1, 0.22, b1]} s={[0.03, 0.44, 0.03]} m={M.steel} />)}
          </group>
        )
      })}
      <Cyl at={[0.55, 0.9, 0.45]} r={0.07} h={0.16} m={M.pot} seg={10} cast={false} />
      {/* paper-lantern pendant */}
      <Cyl at={[0.55, 3.15, 0.45]} r={0.006} h={2.1} m={M.steel} seg={4} cast={false} />
      <mesh position={[0.55, 2.0, 0.45]} scale={[0.24, 0.21, 0.24]} geometry={ball} material={M.paper} />

      {/* ---------- KITCHEN along the west wall ---------- */}
      <Bi at={[-1.52, 1.0, 1.28]} s={[0.62, 2.0, 0.6]} m={M.steelLight} />
      <Bi at={[-1.52, 0.45, 2.55]} s={[0.62, 0.9, 1.9]} m={M.light} />
      <Bi at={[-1.5, 0.92, 2.55]} s={[0.66, 0.04, 1.94]} m={M.counter} />
      <Bi at={[-1.5, 0.935, 2.2]} s={[0.46, 0.02, 0.5]} m={M.steelLight} />
      <Cyl at={[-1.72, 1.1, 2.2]} r={0.015} h={0.35} m={M.steelLight} seg={6} cast={false} />
      <Cyl at={[-1.45, 0.945, 3.15]} r={0.1} h={0.01} m={M.steel} seg={16} cast={false} />
      <Cyl at={[-1.45, 0.945, 2.88]} r={0.075} h={0.01} m={M.steel} seg={16} cast={false} />
      {[0.45, 1.05, 1.65].map((z, i) => <Bi key={i} at={[-1.17, 0.45, 1.7 + i * 0.6 - 0.1]} s={[0.02, 0.01, 0.01]} m={M.steel} cast={false} />)}
      {/* open shelves with ceramics above the counter */}
      <Bi at={[-1.7, 1.55, 1.9]} s={[0.22, 0.035, 1.1]} m={M.light} />
      <Bi at={[-1.7, 1.95, 1.9]} s={[0.22, 0.035, 1.1]} m={M.light} />
      {[0, 1, 2, 3].map((i) => <Cyl key={i} at={[-1.7, 1.62, 1.45 + i * 0.27]} r={0.07} h={0.12} m={M.ceramic} seg={12} cast={false} />)}
      {[0, 1, 2].map((i) => <Cyl key={i} at={[-1.7, 2.04, 1.5 + i * 0.35]} r={0.06} h={0.14} m={M.pot} seg={12} cast={false} />)}
      <Bi at={[-1.2, 0.8, 1.28]} s={[0.04, 1.2, 0.02]} m={M.steelLight} />

      {/* ---------- LIVING (south, facing the gable glazing) ---------- */}
      {ext && (
        <group>
          <Bi at={[0.1, 0.045, 4.55]} s={[2.6, 0.02, 1.9]} m={M.rug} />
          {/* sofa: deep, low, linen & grey with mustard cushion */}
          <Bi at={[0.3, 0.24, 4.2]} s={[1.95, 0.46, 0.95]} m={M.fabricGrey} cast />
          <Bi at={[0.3, 0.6, 3.82]} s={[1.95, 0.36, 0.2]} m={M.fabricGrey} />
          <Bi at={[-0.62, 0.42, 4.2]} s={[0.14, 0.4, 0.95]} m={M.fabricGrey} />
          <Bi at={[1.22, 0.42, 4.2]} s={[0.14, 0.4, 0.95]} m={M.fabricGrey} />
          <Bi at={[-0.15, 0.6, 4.1]} s={[0.38, 0.34, 0.12]} m={M.fabricMustard} rot={[-0.3, 0.2, 0]} />
          <Bi at={[0.8, 0.58, 4.05]} s={[0.4, 0.34, 0.12]} m={M.fabricSage} rot={[-0.3, -0.2, 0]} />
          <Bi at={[0.5, 0.5, 4.0]} s={[0.9, 0.04, 0.55]} m={M.fabricLinen} rot={[0, 0, 0]} />
          {/* low round coffee table + books */}
          <Cyl at={[0.3, 0.2, 5.0]} r={0.36} h={0.4} m={M.tubWood} seg={24} cast />
          <Bi at={[0.3, 0.41, 5.0]} s={[0.3, 0.04, 0.22]} m={M.fabricLinen} />
          {/* wood-burning stove on a slate hearth, flue to the roof */}
          <Bi at={[-1.4, 0.04, 4.6]} s={[0.8, 0.08, 0.9]} m={M.slate} />
          <Bi at={[-1.4, 0.55, 4.6]} s={[0.46, 0.9, 0.46]} m={M.steel} cast />
          <Bi at={[-1.2, 0.5, 4.6]} s={[0.02, 0.4, 0.3]} m={M.glassDark} />
          <Cyl at={[-1.4, 2.65, 4.6]} r={0.075} h={3.4} m={M.steel} seg={10} cast={false} />
          <Bi at={[-1.62, 0.3, 5.1]} s={[0.3, 0.55, 0.4]} m={M.tubWood} />
          {/* armchair + large floor plant by the glazing */}
          <Cyl at={[1.3, 0.22, 5.0]} r={0.36} h={0.44} m={M.fabricSage} seg={18} cast={false} />
          <Bi at={[1.3, 0.55, 5.28]} s={[0.55, 0.5, 0.12]} m={M.fabricSage} />
          <Plant at={[-0.7, 0, 5.05]} h={1.5} pot={0.24} />
          <Plant at={[1.55, 0, 3.6]} h={1.1} pot={0.2} />
          {/* floor-to-ceiling linen curtain at the gable */}
          <Bi at={[-1.72, 1.35, 5.2]} s={[0.3, 2.7, 0.05]} m={M.fabricLinen} />
        </group>
      )}

      {/* ---------- CEILING: whitewashed lining, timber tie beams, track light ---------- */}
      {[-0.4, 2.6, 4.6].filter((z) => ext || z < 2.0).map((z, i) => <Bi key={i} at={[0, 3.12, z]} s={[3.5, 0.13, 0.13]} m={M.tubWood} cast />)}
      <Bi at={[0, 3.75, fz]} s={[0.05, 0.05, L - 0.8]} m={M.steel} />
      {[-3.6, -1.2, 1.2, 3.8].filter((z) => ext || z < 2.0).map((z, i) => (
        <group key={i} position={[0, 3.75, z]}>
          <Cyl at={[0, -0.12, 0]} r={0.012} h={0.24} m={M.steel} seg={6} cast={false} />
          <Cyl at={[0, -0.3, 0]} r={0.07} h={0.14} m={M.lamp} seg={12} cast={false} />
        </group>
      ))}
      {/* large abstract canvas on the east wall (living) */}
      {ext && <Bi at={[1.8, 1.7, 3.0]} s={[0.03, 1.3, 0.95]} m={M.plasterDark} />}
      {ext && <Bi at={[1.78, 1.75, 3.0]} s={[0.01, 0.9, 0.6]} m={M.fabricLinen} />}
    </group>
  )
}
