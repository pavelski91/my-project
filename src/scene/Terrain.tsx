import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import { useStore, type Season } from '../store'
import { PLOT, ENTRANCE, PLOT_LABELS, SECOND_DWELLING } from '../data/site'
import { terrainY, rng, PLOT_CENTER, boxToRect, rectCorners, type V2 } from '../lib/geometry'
import { noise } from './materials'
import { useSunState } from './env'
import { B } from './prims'
import { M, flatMat } from './materials'
import { apronRect } from '../lib/validate'
import { Html } from '@react-three/drei'

export const TERRAIN_SIZE = 150
const HALF = TERRAIN_SIZE / 2
export const TERRAIN_MIN: V2 = [PLOT_CENTER[0] - HALF, PLOT_CENTER[1] - HALF]
const EDGE_Y = 1.2

const edgeTaper = (x: number, z: number) => {
  const d = Math.hypot(x - PLOT_CENTER[0], z - PLOT_CENTER[1])
  const t = Math.min(1, Math.max(0, (d - 52) / 20))
  return t * t * (3 - 2 * t)
}
interface Carve { x: number; z: number; rx: number; rz: number; rot: number; depth: number }
let CARVES: Carve[] = []
export const setCarves = (c: Carve[]) => { CARVES = c }
const carveDepth = (x: number, z: number) => {
  let d = 0
  for (const c of CARVES) {
    const a = (-c.rot * Math.PI) / 180
    const dx = x - c.x, dz = z - c.z
    const lx = dx * Math.cos(a) + dz * Math.sin(a)
    const lz = -dx * Math.sin(a) + dz * Math.cos(a)
    const r = Math.hypot(lx / c.rx, lz / c.rz)
    if (r < 1.5) {
      const t = Math.min(1, Math.max(0, (r - 0.62) / 0.8))
      d = Math.max(d, c.depth * (1 - t * t * (3 - 2 * t)))
    }
  }
  return d
}
export const groundY = (x: number, z: number) => terrainY(x, z) * (1 - edgeTaper(x, z)) + EDGE_Y * edgeTaper(x, z) - carveDepth(x, z)

const PAL: Record<Season, { grass: string; grass2: string; meadow: string; wood: string; field: string; field2: string; leafLitter: string }> = {
  spring: { grass: '#86a24b', grass2: '#97b05a', meadow: '#a3b25a', wood: '#6b7a45', field: '#7f9a3f', field2: '#6e8a39', leafLitter: '#7a6f48' },
  summer: { grass: '#6c8b3b', grass2: '#7b9a46', meadow: '#a6a64a', wood: '#58693a', field: '#c6b052', field2: '#b79f48', leafLitter: '#6d6240' },
  autumn: { grass: '#9a8a42', grass2: '#8a7d3a', meadow: '#b99c55', wood: '#7a6b3b', field: '#8a6a3a', field2: '#7b5c33', leafLitter: '#8a5f2c' },
  winter: { grass: '#d9e0e0', grass2: '#cdd6d6', meadow: '#d2d3cc', wood: '#cdd4d0', field: '#e1e7ea', field2: '#d8dfe3', leafLitter: '#c3c7c2' },
}

function paintGround(c: HTMLCanvasElement, season: Season, phase: number, layout: ReturnType<typeof useStore.getState>['layout'], second: boolean) {
  const g = c.getContext('2d')!
  const S = c.width
  const k = S / TERRAIN_SIZE
  const X = (x: number) => (x - TERRAIN_MIN[0]) * k
  const Y = (z: number) => (z - TERRAIN_MIN[1]) * k
  const P = PAL[season]
  const r = rng(77)
  const winter = season === 'winter'
  g.fillStyle = P.grass
  g.fillRect(0, 0, S, S)
  // large-scale tonal variation
  for (let i = 0; i < 700; i++) {
    g.fillStyle = r() < 0.5 ? P.grass2 : P.grass
    g.globalAlpha = 0.25
    g.beginPath()
    g.ellipse(r() * S, r() * S, 40 + r() * 160, 30 + r() * 120, r() * 3, 0, 7)
    g.fill()
  }
  g.globalAlpha = 1

  // arable fields north of the road (RV) and east, as on the survey base map
  const dir = new THREE.Vector2(PLOT[1][0] - PLOT[0][0], PLOT[1][1] - PLOT[0][1]).normalize()
  const nrm = new THREE.Vector2(dir.y, -dir.x) // north-ish
  const quad = (pts: V2[], fill: string) => {
    g.fillStyle = fill
    g.beginPath()
    pts.forEach(([x, z], i) => (i ? g.lineTo(X(x), Y(z)) : g.moveTo(X(x), Y(z))))
    g.closePath()
    g.fill()
  }
  const band = (d0: number, d1: number, along0: number, along1: number): V2[] => {
    const p = (a: number, d: number): V2 => [PLOT[0][0] + dir.x * a + nrm.x * d, PLOT[0][1] + dir.y * a + nrm.y * d]
    return [p(along0, d0), p(along1, d0), p(along1, d1), p(along0, d1)]
  }
  // field north of road
  const field = band(15, 70, -60, 110)
  quad(field, P.field)
  g.save()
  g.beginPath()
  field.forEach(([x, z], i) => (i ? g.lineTo(X(x), Y(z)) : g.moveTo(X(x), Y(z))))
  g.clip()
  g.strokeStyle = P.field2
  g.lineWidth = 6
  for (let i = -80; i < 140; i += 1.8) {
    const a: V2 = [PLOT[0][0] + dir.x * i + nrm.x * 14, PLOT[0][1] + dir.y * i + nrm.y * 14]
    const b: V2 = [a[0] + nrm.x * 60, a[1] + nrm.y * 60]
    g.globalAlpha = 0.55
    g.beginPath(); g.moveTo(X(a[0]), Y(a[1])); g.lineTo(X(b[0]), Y(b[1])); g.stroke()
  }
  g.restore()
  // east field
  quad([[48, -30], [110, -30], [110, 60], [44, 60], [40, 30]], P.field)
  g.save()
  g.strokeStyle = P.field2; g.lineWidth = 5; g.globalAlpha = 0.5
  for (let z = -30; z < 60; z += 1.8) { g.beginPath(); g.moveTo(X(46), Y(z)); g.lineTo(X(110), Y(z)); g.stroke() }
  g.restore()

  // road (asphalt) 8–14 m north of the boundary line AB, with verge
  const road = band(7.2, 14.8, -70, 120)
  quad(band(5.5, 16.5, -70, 120), winter ? '#cfd3d2' : '#8a8f6b')
  quad(road, winter ? '#8c9092' : '#4b4e51')
  g.save()
  g.strokeStyle = winter ? '#d5d9da' : '#c9c9c0'
  g.lineWidth = 3; g.setLineDash([60, 80])
  const cl = band(11, 11, -70, 120)
  g.beginPath(); g.moveTo(X(cl[0][0]), Y(cl[0][1])); g.lineTo(X(cl[1][0]), Y(cl[1][1])); g.stroke()
  g.restore()
  // driveway from gate to the road (by others — "wg odrębnego opracowania")
  const gx = ENTRANCE.gate.x
  const gz = -0.1185 * gx
  const dw = 2.2
  quad([[gx - dw, gz + 1], [gx + dw, gz + 1], [gx + dw + dir.x * 0 + nrm.x * 9, gz + nrm.y * 9 + 1], [gx - dw + nrm.x * 9, gz + nrm.y * 9 + 1]], winter ? '#b9bdbc' : '#8d8a80')

  // neighbour plots: bare soil yards / lawn west
  quad([[-45, -40], [-0.4, -40], [-0.4, 60], [-45, 60]], P.grass)
  quad([[-24, -2], [-3, -2], [-3, 12], [-24, 12]], winter ? '#d5dadb' : '#7e8f4a')

  // dab texture across the whole sheet
  for (let i = 0; i < 26000; i++) {
    const x = r() * S, y = r() * S
    g.strokeStyle = r() < 0.5 ? 'rgba(255,255,230,0.07)' : 'rgba(30,50,10,0.09)'
    g.lineWidth = 1 + r() * 2
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 6, y - 3 - r() * 8); g.stroke()
  }

  // plot interior: zones
  const polyPath = (pts: V2[]) => {
    g.beginPath()
    pts.forEach(([x, z], i) => (i ? g.lineTo(X(x), Y(z)) : g.moveTo(X(x), Y(z))))
    g.closePath()
  }
  // pasture inside the plot is slightly managed
  g.save()
  polyPath(PLOT)
  g.fillStyle = P.grass2
  g.globalAlpha = 0.35
  g.fill()
  g.restore()
  const colours: Record<string, [string, string]> = {
    woodland: [P.wood, P.leafLitter],
    screen: [winter ? '#d0d4d0' : '#6b5a3e', '#4d3f2c'],
    meadow: [P.meadow, season === 'summer' ? '#d9c25a' : P.grass2],
    foodforest: [winter ? '#d6dbd8' : '#7e8d46', '#5d4a34'],
    berries: [winter ? '#d6dbd8' : '#7a8744', '#5a4430'],
    kitchen: [winter ? '#dfe4e4' : '#5b4630', '#3f3223'],
    shade: [winter ? '#cdd6d2' : '#4f6638', '#3d5130'],
    wetland: [winter ? '#c7d1d0' : '#4f6b3a', '#364d2b'],
  }
  for (const z of layout.zones) {
    if (z.phase > phase) continue
    const [c1, c2] = colours[z.type]
    g.save()
    polyPath(z.poly)
    g.fillStyle = c1
    g.globalAlpha = 0.92
    g.fill()
    g.clip()
    const xs = z.poly.map((p) => p[0]), zs = z.poly.map((p) => p[1])
    const bx0 = Math.min(...xs), bx1 = Math.max(...xs), bz0 = Math.min(...zs), bz1 = Math.max(...zs)
    const n = Math.round(((bx1 - bx0) * (bz1 - bz0)) * 5)
    for (let i = 0; i < n; i++) {
      const x = bx0 + r() * (bx1 - bx0), zz = bz0 + r() * (bz1 - bz0)
      g.globalAlpha = 0.18 + r() * 0.3
      g.fillStyle = r() < 0.5 ? c2 : c1
      g.beginPath()
      g.ellipse(X(x), Y(zz), (4 + r() * 12) * (k / 7), (3 + r() * 9) * (k / 7), r() * 3, 0, 7)
      g.fill()
    }
    if (z.type === 'meadow' && !winter) {
      const fl = season === 'summer' ? ['#f6f4ec', '#e6c52e', '#7a63c2', '#c9609a', '#5d7fc4'] : season === 'spring' ? ['#f6f4ec', '#f3e27a'] : ['#c6a25a']
      for (let i = 0; i < n * 0.9; i++) {
        const x = bx0 + r() * (bx1 - bx0), zz = bz0 + r() * (bz1 - bz0)
        g.globalAlpha = 0.85
        g.fillStyle = fl[Math.floor(r() * fl.length)]
        g.beginPath(); g.arc(X(x), Y(zz), 1.4 + r() * 2.2, 0, 7); g.fill()
      }
    }
    g.restore()
  }
  g.globalAlpha = 1

  // entrance apron: pavers
  if (phase >= 2) {
    const a = apronRect()
    g.save()
    g.fillStyle = winter ? '#b8bcbe' : '#8f8d86'
    const c = rectCorners(a)
    polyPath(c)
    g.fill()
    g.clip()
    g.strokeStyle = 'rgba(40,40,40,0.35)'
    g.lineWidth = 1.2
    for (let x = a.x - a.w / 2; x <= a.x + a.w / 2; x += 0.6) { g.beginPath(); g.moveTo(X(x), Y(a.z - a.d / 2)); g.lineTo(X(x), Y(a.z + a.d / 2)); g.stroke() }
    for (let z = a.z - a.d / 2; z <= a.z + a.d / 2; z += 0.6) { g.beginPath(); g.moveTo(X(a.x - a.w / 2), Y(z)); g.lineTo(X(a.x + a.w / 2), Y(z)); g.stroke() }
    g.restore()
    // waste pad
    const w = ENTRANCE.waste
    g.fillStyle = '#7f7d77'
    g.fillRect(X(w.x - w.w / 2), Y(w.z - w.d / 2), w.w * k, w.d * k)
  }
  // worn track along the stone path
  if (phase >= 2) {
    g.save()
    g.strokeStyle = winter ? '#cdd2d0' : '#a39a6e'
    g.lineWidth = 0.9 * k
    g.globalAlpha = 0.5
    g.lineCap = 'round'
    g.beginPath()
    layout.stonePath.forEach(([x, z], i) => (i ? g.lineTo(X(x), Y(z)) : g.moveTo(X(x), Y(z))))
    g.stroke()
    g.restore()
  }
  // features painted on the ground
  for (const f of layout.features) {
    if (!f.enabled || f.phase > phase) continue
    g.save()
    g.translate(X(f.x), Y(f.z))
    g.rotate((-f.rot * Math.PI) / 180)
    if (f.kind === 'raingarden') {
      g.fillStyle = winter ? '#c9d1d0' : '#6c6b5f'
      g.beginPath(); g.ellipse(0, 0, (f.w / 2) * k, (f.d / 2) * k, 0, 0, 7); g.fill()
      g.fillStyle = '#4e4d44'
      for (let i = 0; i < 60; i++) { g.globalAlpha = 0.4; g.beginPath(); g.arc((r() - 0.5) * f.w * k * 0.9, (r() - 0.5) * f.d * k * 0.9, 2 + r() * 3, 0, 7); g.fill() }
    } else if (f.kind === 'pond') {
      g.fillStyle = '#2f4a40'
      g.beginPath(); g.ellipse(0, 0, (f.w / 2 + 0.35) * k, (f.d / 2 + 0.35) * k, 0, 0, 7); g.fill()
    } else if (f.kind === 'firepit') {
      g.fillStyle = winter ? '#cfd3d2' : '#74705f'
      g.beginPath(); g.ellipse(0, 0, (f.w / 2) * k, (f.d / 2) * k, 0, 0, 7); g.fill()
    } else if (f.kind === 'compost' || f.kind === 'beds') {
      g.fillStyle = '#4b3a2a'
      g.fillRect((-f.w / 2 - 0.3) * k, (-f.d / 2 - 0.3) * k, (f.w + 0.6) * k, (f.d + 0.6) * k)
    } else if (f.kind === 'habitat' || f.kind === 'hammock') {
      g.fillStyle = 'rgba(70,55,35,0.5)'
      g.beginPath(); g.ellipse(0, 0, (f.w / 2) * k, (f.d / 2 + 0.2) * k, 0, 0, 7); g.fill()
    }
    g.restore()
  }
  if (!second) {
    // reserved second dwelling pad: faint
    const b = boxToRect(SECOND_DWELLING)
    g.fillStyle = 'rgba(120,120,110,0.18)'
    polyPath(rectCorners(b))
    g.fill()
  }
}

export function Terrain() {
  const season = useStore((s) => s.season)
  const phase = useStore((s) => s.phase)
  const layout = useStore((s) => s.layout)
  const dragging = useStore((s) => s.dragging)
  const second = useStore((s) => s.settings.releaseSecondDwelling)
  const quality = useStore((s) => s.settings.quality)

  const carveKey = useMemo(
    () => JSON.stringify(layout.features.filter((f) => f.enabled && f.phase <= phase && (f.kind === 'pond' || f.kind === 'raingarden')).map((f) => [f.kind, f.x, f.z, f.w, f.d, f.rot])),
    [layout.features, phase],
  )
  const geo = useMemo(() => {
    setCarves(
      layout.features
        .filter((f) => f.enabled && f.phase <= phase && (f.kind === 'pond' || f.kind === 'raingarden'))
        .map((f) => ({ x: f.x, z: f.z, rx: f.w / 2, rz: f.d / 2, rot: f.rot, depth: f.kind === 'pond' ? 0.6 : 0.22 })),
    )
    const N = 180
    const pos = new Float32Array((N + 1) * (N + 1) * 3)
    const uv = new Float32Array((N + 1) * (N + 1) * 2)
    const idx: number[] = []
    for (let j = 0; j <= N; j++)
      for (let i = 0; i <= N; i++) {
        const x = TERRAIN_MIN[0] + (i / N) * TERRAIN_SIZE
        const z = TERRAIN_MIN[1] + (j / N) * TERRAIN_SIZE
        const k = j * (N + 1) + i
        pos.set([x, groundY(x, z), z], k * 3)
        uv.set([i / N, j / N], k * 2)
      }
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) {
        const a = j * (N + 1) + i
        idx.push(a, a + N + 1, a + 1, a + 1, a + N + 1, a + N + 2)
      }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carveKey])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = quality === 'high' ? 4096 : 2560
    canvasRef.current = c
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 16
    return t
  }, [quality])
  const bump = useMemo(() => {
    const t = noise.clone()
    t.repeat.set(TERRAIN_SIZE / 0.7, TERRAIN_SIZE / 0.7)
    t.needsUpdate = true
    return t
  }, [])

  const key = useMemo(
    () => JSON.stringify([layout.zones, layout.stonePath, layout.features.map((f) => [f.kind, f.x, f.z, f.w, f.d, f.rot, f.enabled, f.phase])]),
    [layout.zones, layout.stonePath, layout.features],
  )
  useEffect(() => {
    if (dragging) return
    const id = setTimeout(() => {
      paintGround(tex.image as HTMLCanvasElement, season, phase, layout, second)
      tex.needsUpdate = true
    }, 60)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, season, phase, second, dragging, tex])

  return (
    <group>
      <mesh geometry={geo} receiveShadow>
        <meshStandardMaterial map={tex} bumpMap={bump} bumpScale={1.6} roughness={1} metalness={0} />
      </mesh>
      {/* far ground to hide the edge of the terrain tile */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[PLOT_CENTER[0], EDGE_Y - 0.03, PLOT_CENTER[1]]}>
        <circleGeometry args={[900, 48]} />
        <meshStandardMaterial color={season === 'winter' ? '#dfe5e6' : season === 'autumn' ? '#8a7c45' : '#6d8a45'} roughness={1} />
      </mesh>
    </group>
  )
}

/** Boundary line, corner markers and labels. */
export function Boundary() {
  const dims = useStore((s) => s.layers.dimensions)
  const labels = useStore((s) => s.layers.labels)
  const cam = useStore((s) => s.cam)
  const pts = useMemo(() => {
    const out: [number, number, number][] = []
    for (let i = 0; i < PLOT.length; i++) {
      const a = PLOT[i], b = PLOT[(i + 1) % PLOT.length]
      const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.8))
      for (let k = 0; k < n; k++) {
        const t = k / n
        const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t
        out.push([x, terrainY(x, z) + 0.08, z])
      }
    }
    out.push(out[0])
    return out
  }, [])
  return (
    <group>
      <Line points={pts} color="#b5483a" lineWidth={2.2} dashed dashSize={0.9} gapSize={0.35} />
      {PLOT.map(([x, z], i) => (
        <group key={i} position={[x, terrainY(x, z), z]}>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.7, 6]} />
            <meshStandardMaterial color="#b5483a" />
          </mesh>
          {(labels || dims) && (
            <Html position={[0, 1.0, 0]} center distanceFactor={cam === 'iso' || cam === 'plan' ? undefined : 26} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
              <div className="rounded-full bg-[#b5483a] px-1.5 text-[10px] font-semibold text-white">{PLOT_LABELS[i]}</div>
            </Html>
          )}
        </group>
      ))}
    </group>
  )
}

/** Neighbouring buildings visible on the survey (west). */
export function Context() {
  const show = useStore((s) => s.layers.context)
  const { snow } = useSunState()
  const metal = useMemo(() => flatMat(snow ? '#cfd6d8' : '#808b8e', 0.5, 0.6), [snow])
  if (!show) return null
  const items: { x: number; z: number; w: number; d: number; h: number; rot: number; kind: 'house' | 'shed' }[] = [
    { x: -27, z: 4, w: 9, d: 6.5, h: 2.6, rot: 0, kind: 'house' },
    { x: -13.4, z: 31.2, w: 4.2, d: 2.2, h: 2.0, rot: 0, kind: 'shed' },
    { x: -5.6, z: 32.6, w: 3.6, d: 2.2, h: 2.0, rot: 0, kind: 'shed' },
  ]
  return (
    <group>
      {items.map((b, i) => {
        const y = terrainY(b.x, b.z)
        return (
          <group key={i} position={[b.x, y, b.z]} rotation={[0, (b.rot * Math.PI) / 180, 0]}>
            <B at={[0, b.h / 2, 0]} s={[b.w, b.h, b.d]} m={b.kind === 'house' ? flatMat('#d9d2c2', 0.9) : metal} />
            {b.kind === 'house' ? (
              <mesh position={[0, b.h + 0.9, 0]} rotation={[Math.PI / 4, 0, 0]} castShadow>
                <boxGeometry args={[b.w + 0.6, b.d * 0.72, b.d * 0.72]} />
                <meshStandardMaterial color={snow ? '#e4e8ea' : '#7a4a3a'} roughness={0.8} />
              </mesh>
            ) : (
              <B at={[0, b.h + 0.06, 0]} s={[b.w + 0.1, 0.1, b.d + 0.1]} m={metal} rot={[0.06, 0, 0]} />
            )}
          </group>
        )
      })}
      <mesh visible={false} material={M.charred} />
    </group>
  )
}
