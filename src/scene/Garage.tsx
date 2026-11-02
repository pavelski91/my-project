import { useMemo } from 'react'
import * as THREE from 'three'
import { HOUSE_EXTENSION, GROUND_FLOOR_LEFT, TERRAIN_Y0 } from '../data/site'
import { useStore } from '../store'
import { B, Cyl, Gable, GableRoof } from './prims'
import { M, flatMat } from './materials'
import { usePick, useSunState } from './env'

const Y0 = GROUND_FLOOR_LEFT - TERRAIN_Y0 // finished floor of the house, 3.10 m

function Car({ body }: { body: THREE.Material }) {
  const trim = useMemo(() => flatMat('#16181a', 0.5, 0.4), [])
  const tail = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8a1414', emissive: '#c01818', emissiveIntensity: 0.4 }), [])
  return (
    <group>
      <B at={[0, 0.55, 0]} s={[4.35, 0.55, 1.78]} m={body} cast />
      <B at={[-0.1, 1.05, 0]} s={[2.35, 0.5, 1.58]} m={body} cast />
      <B at={[-0.1, 1.07, 0]} s={[2.2, 0.38, 1.6]} m={M.glassDark} cast={false} />
      <B at={[2.17, 0.55, -0.6]} s={[0.04, 0.12, 0.3]} m={M.lamp} cast={false} />
      <B at={[2.17, 0.55, 0.6]} s={[0.04, 0.12, 0.3]} m={M.lamp} cast={false} />
      <B at={[-2.17, 0.62, -0.62]} s={[0.04, 0.1, 0.3]} m={tail} cast={false} />
      <B at={[-2.17, 0.62, 0.62]} s={[0.04, 0.1, 0.3]} m={tail} cast={false} />
      <B at={[0, 0.3, 0]} s={[4.2, 0.12, 1.7]} m={trim} cast={false} />
      {[[1.35, 0.85], [1.35, -0.85], [-1.35, 0.85], [-1.35, -0.85]].map(([x, z], i) => (
        <Cyl key={i} at={[x, 0.33, z]} r={0.33} h={0.22} m={M.rubber} rot={[Math.PI / 2, 0, 0]} seg={16} />
      ))}
    </group>
  )
}

/**
 * The planned extension: a roofed two-car garage attached to the NORTH gable of the house (behind the sleeping loft),
 * open towards the entrance drive, slatted timber wall on the west, open posts on the east.
 */
export function GarageExtension() {
  const pick = usePick('extension')
  const interiors = useStore((s) => s.layers.interiors)
  const { glow: night } = useSunState()
  const e = HOUSE_EXTENSION
  const w = e.x1 - e.x0
  const d = e.z1 - e.z0
  const cx = (e.x0 + e.x1) / 2
  const cz = (e.z0 + e.z1) / 2
  const eave = 2.6
  const pitch = (30 * Math.PI) / 180
  const rise = (w / 2) * Math.tan(pitch)
  const carA = useMemo(() => flatMat('#454b52', 0.32, 0.55), [])
  const carB = useMemo(() => flatMat('#b9bcc0', 0.3, 0.6), [])
  const slatsW = useMemo(() => Array.from({ length: Math.floor((d - 0.2) / 0.15) }, (_, i) => -d / 2 + 0.15 + i * 0.15), [d])
  const slatsN = useMemo(() => Array.from({ length: Math.floor((w - 0.3) / 0.16) }, (_, i) => -w / 2 + 0.2 + i * 0.16), [w])
  return (
    <group position={[cx, Y0, cz]} {...pick}>
      {/* slab with permeable paver surface and wheel strips */}
      <B at={[0, -0.12, 0]} s={[w + 0.1, 0.24, d + 0.05]} m={M.concrete} />
      <B at={[0, 0.0, 0]} s={[w, 0.04, d]} m={M.stone} cast={false} />
      {[-1.45, 1.45].map((x, i) => <B key={i} at={[x, 0.03, 0]} s={[1.9, 0.02, d - 0.3]} m={M.concrete} cast={false} />)}
      {/* ramp to the drive */}
      <B at={[0, -0.1, -d / 2 - 0.5]} s={[w - 0.4, 0.08, 1.1]} m={M.stone} />
      {/* black steel posts: north portal + east side + south (house) side */}
      {[[-w / 2 + 0.12, -d / 2 + 0.12], [w / 2 - 0.12, -d / 2 + 0.12], [w / 2 - 0.12, 0.2], [-w / 2 + 0.12, 0.2]].map(([x, z], i) => (
        <B key={i} at={[x, eave / 2, z]} s={[0.12, eave, 0.12]} m={M.steel} />
      ))}
      <B at={[0, eave - 0.1, -d / 2 + 0.12]} s={[w, 0.2, 0.12]} m={M.steel} />
      <B at={[w / 2 - 0.12, eave - 0.1, 0]} s={[0.12, 0.2, d]} m={M.steel} />
      <B at={[-w / 2 + 0.12, eave - 0.1, 0]} s={[0.12, 0.2, d]} m={M.steel} />
      {/* west side: slatted timber wall (privacy toward the neighbour side) */}
      {slatsW.map((z, i) => <B key={i} at={[-w / 2 + 0.1, eave / 2 - 0.05, z]} s={[0.03, eave - 0.3, 0.1]} m={M.larchWarm} />)}
      {/* north gable infill: vertical timber slats above the portal */}
      <Gable W={w} R={rise} D={0.06} m={M.larchNew} at={[0, eave, -d / 2]} />
      {slatsN.map((x, i) => {
        const hh = Math.max(0.1, rise - Math.abs(x) * Math.tan(pitch) - 0.08)
        return <B key={'g' + i} at={[x, eave + hh / 2 + 0.02, -d / 2 - 0.05]} s={[0.07, hh, 0.04]} m={M.steel} cast={false} />
      })}
      <group visible={!interiors}>
        <GableRoof W={w} L={d} eave={eave} pitch={pitch} ov={0.4} endOv={[0.9, 0]} />
      </group>
      {/* south side: built-in storage along the house wall, EV wall box, bike hooks */}
      <B at={[-1.55, 1.0, d / 2 - 0.3]} s={[1.5, 2.0, 0.5]} m={M.light} />
      <B at={[-1.55, 1.0, d / 2 - 0.04]} s={[1.46, 1.96, 0.02]} m={M.sauna} />
      <B at={[0.9, 1.3, d / 2 - 0.08]} s={[0.22, 0.34, 0.1]} m={M.steel} cast={false} />
      <B at={[0.9, 1.4, d / 2 - 0.03]} s={[0.12, 0.03, 0.01]} m={M.lamp} cast={false} />
      {[1.65, 2.05].map((x, i) => <B key={i} at={[x, 1.75, d / 2 - 0.1]} s={[0.04, 0.05, 0.14]} m={M.steelLight} cast={false} />)}
      {/* door from the garage into the house hall is on the house's east side; here: a service door */}
      <B at={[2.4, 1.05, d / 2 - 0.02]} s={[0.8, 2.1, 0.04]} m={M.larchWarm} />
      {/* two cars, nose to the house (side by side) */}
      <group position={[-1.45, 0.05, -0.25]} rotation={[0, -Math.PI / 2, 0]}><Car body={carA} /></group>
      <group position={[1.15, 0.05, -0.25]} rotation={[0, -Math.PI / 2, 0]}><Car body={carB} /></group>
      {/* linear light under the roof */}
      <B at={[0, eave - 0.25, -0.2]} s={[w - 1.0, 0.04, 0.06]} m={M.lamp} cast={false} />
      <B at={[w / 2 + 0.05, 1.9, -d / 2 + 0.15]} s={[0.1, 0.24, 0.1]} m={M.lamp} cast={false} />
      <pointLight position={[0, 2.2, 0]} intensity={2 + 4 * night} distance={7} color="#ffd8a0" decay={1.6} />
    </group>
  )
}
