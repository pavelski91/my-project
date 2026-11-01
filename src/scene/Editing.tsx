import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { useStore } from '../store'
import { validateLayout, type Issue } from '../lib/validate'
import { rectCorners, rectInsidePlot, terrainY, boxToRect, clamp, pointInPoly, type Rect, type V2 } from '../lib/geometry'
import { HOUSE_EXISTING, HOUSE_EXTENSION, SECOND_DWELLING, SHED_EXISTING, TERRACE, PLOT } from '../data/site'

export function useIssues(): Issue[] {
  const layout = useStore((s) => s.layout)
  const phase = useStore((s) => s.phase)
  const second = useStore((s) => s.settings.releaseSecondDwelling)
  const fs = useStore((s) => s.settings.featureSetback)
  return useMemo(() => validateLayout(layout, { releaseSecondDwelling: second, featureSetback: fs }, phase), [layout, phase, second, fs])
}

export function rectOf(id: string, layout = useStore.getState().layout): Rect | null {
  const s = layout.structures.find((o) => o.id === id)
  if (s) return s
  const f = layout.features.find((o) => o.id === id)
  if (f) return f
  const fixed: Record<string, Rect> = {
    house: boxToRect(HOUSE_EXISTING),
    extension: boxToRect(HOUSE_EXTENSION),
    terrace: boxToRect(TERRACE),
    second: boxToRect(SECOND_DWELLING),
    shed: boxToRect(SHED_EXISTING),
  }
  return fixed[id] ?? null
}

/* ---------------- drag state (module-level; consumed in useFrame) ---------------- */
type Drag = { kind: 'item' | 'wp'; id: string; idx: number; dx: number; dz: number; planeY: number } | null
let drag: Drag = null

export function canDrag(id: string) {
  const { editMode, layout } = useStore.getState()
  if (!editMode) return false
  return layout.structures.some((s) => s.id === id) || layout.features.some((f) => f.id === id)
}

export function beginItemDrag(id: string, p: THREE.Vector3) {
  const r = rectOf(id)
  if (!r) return
  drag = { kind: 'item', id, idx: -1, dx: p.x - r.x, dz: p.z - r.z, planeY: p.y }
  useStore.getState().setDragging(true)
  useStore.getState().select(id)
}

export function beginWpDrag(idx: number, p: THREE.Vector3) {
  const pt = useStore.getState().layout.boardwalk[idx]
  drag = { kind: 'wp', id: 'boardwalk', idx, dx: p.x - pt[0], dz: p.z - pt[1], planeY: p.y }
  useStore.getState().setDragging(true)
  useStore.getState().selectWp(idx)
  useStore.getState().select('boardwalk')
}

const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const hit = new THREE.Vector3()

export function DragController() {
  const { camera, raycaster, pointer, gl } = useThree()
  useEffect(() => {
    const up = () => {
      if (drag) {
        drag = null
        useStore.getState().setDragging(false)
        document.body.style.cursor = ''
      }
    }
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const st = useStore.getState()
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      if (e.key === 'Escape') st.select(null)
      if (!st.editMode || !st.selected) return
      const r = rectOf(st.selected)
      if (!r || !canDrag(st.selected)) return
      if (e.key === 'r' || e.key === 'R') {
        const d = e.shiftKey ? -15 : 15
        rotateSelected(st.selected, d)
      }
      const nudge = e.shiftKey ? 0.5 : 0.1
      const mv: Record<string, [number, number]> = { ArrowLeft: [-nudge, 0], ArrowRight: [nudge, 0], ArrowUp: [0, -nudge], ArrowDown: [0, nudge] }
      if (mv[e.key] && (e.altKey || e.ctrlKey)) {
        e.preventDefault()
        tryMove(st.selected, r.x + mv[e.key][0], r.z + mv[e.key][1])
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  useFrame(() => {
    if (!drag) return
    gl.domElement.style.cursor = 'grabbing'
    raycaster.setFromCamera(pointer, camera)
    plane.constant = -drag.planeY
    if (!raycaster.ray.intersectPlane(plane, hit)) return
    const nx = Math.round((hit.x - drag.dx) * 20) / 20
    const nz = Math.round((hit.z - drag.dz) * 20) / 20
    if (drag.kind === 'item') tryMove(drag.id, nx, nz)
    else {
      const p: V2 = [nx, nz]
      if (pointInPoly(p[0], p[1], PLOT)) useStore.getState().moveWaypoint(drag.idx, p)
    }
  })
  return null
}

/** Move a structure/feature but never allow it outside the property boundary. */
export function tryMove(id: string, x: number, z: number) {
  const st = useStore.getState()
  const r = rectOf(id)
  if (!r) return
  const cand = (cx: number, cz: number): Rect => ({ ...r, x: cx, z: cz })
  let nx = x, nz = z
  if (!rectInsidePlot(cand(nx, nz), 0.15)) {
    if (rectInsidePlot(cand(nx, r.z), 0.15)) nz = r.z
    else if (rectInsidePlot(cand(r.x, nz), 0.15)) nx = r.x
    else return
  }
  if (st.layout.structures.some((s) => s.id === id)) st.patchStructure(id, { x: nx, z: nz })
  else st.patchFeature(id, { x: nx, z: nz })
}

export function rotateSelected(id: string, deltaDeg: number) {
  const st = useStore.getState()
  const r = rectOf(id)
  if (!r) return
  let rot = ((r.rot + deltaDeg + 540) % 360) - 180
  const test: Rect = { ...r, rot }
  if (!rectInsidePlot(test, 0.1)) {
    st.say('Rotation blocked — would cross the boundary')
    return
  }
  if (st.layout.structures.some((s) => s.id === id)) st.patchStructure(id, { rot })
  else st.patchFeature(id, { rot })
}

/* ---------------- visual feedback ---------------- */
function Outline({ r, color, y = 0.12, lw = 2.5, dashed = false }: { r: Rect; color: string; y?: number; lw?: number; dashed?: boolean }) {
  const pts = useMemo(() => {
    const c = rectCorners(r)
    const out: [number, number, number][] = []
    for (let i = 0; i < 4; i++) {
      const a = c[i], b = c[(i + 1) % 4]
      for (let k = 0; k < 8; k++) {
        const t = k / 8
        const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t
        out.push([x, terrainY(x, z) + y, z])
      }
    }
    out.push(out[0])
    return out
  }, [r.x, r.z, r.w, r.d, r.rot, y])
  return <Line points={pts} color={color} lineWidth={lw} dashed={dashed} dashSize={0.4} gapSize={0.2} depthTest={false} renderOrder={20} transparent />
}

export function Selection() {
  const selected = useStore((s) => s.selected)
  const edit = useStore((s) => s.editMode)
  const layout = useStore((s) => s.layout)
  const issues = useIssues()
  const hovered = useStore((s) => s.hovered)
  const phase = useStore((s) => s.phase)
  const bad = useMemo(() => {
    const m = new Map<string, 'error' | 'warn'>()
    for (const i of issues) for (const id of i.ids) if (i.severity !== 'info' && id !== 'boardwalk') m.set(id, i.severity === 'error' ? 'error' : m.get(id) === 'error' ? 'error' : 'warn')
    return m
  }, [issues])
  const items = [...layout.structures.filter((s) => s.phase <= phase), ...layout.features.filter((f) => f.enabled && f.phase <= phase)]
  return (
    <group>
      {edit && items.map((it) => (bad.has(it.id) ? <Outline key={it.id} r={it} color={bad.get(it.id) === 'error' ? '#c0392b' : '#d89a3a'} dashed lw={2.2} /> : null))}
      {selected && rectOf(selected) && selected !== 'boardwalk' && (
        <Outline r={inflate(rectOf(selected)!, 0.2)} color={bad.get(selected) === 'error' ? '#c0392b' : '#6f8a5f'} lw={3.2} />
      )}
      {hovered && hovered !== selected && rectOf(hovered) && <Outline r={inflate(rectOf(hovered)!, 0.1)} color="#8a8f8a" lw={1.6} />}
    </group>
  )
}
const inflate = (r: Rect, k: number): Rect => ({ ...r, w: r.w + 2 * k, d: r.d + 2 * k })

export function WaypointHandles() {
  const edit = useStore((s) => s.editMode)
  const sel = useStore((s) => s.selected)
  const pts = useStore((s) => s.layout.boardwalk)
  const selWp = useStore((s) => s.selectedWp)
  if (!edit || sel !== 'boardwalk') return null
  return (
    <group>
      {pts.map(([x, z], i) => (
        <mesh
          key={i}
          position={[x, terrainY(x, z) + 0.9, z]}
          onPointerDown={(e) => {
            e.stopPropagation()
            beginWpDrag(i, e.point)
          }}
          onPointerOver={() => (document.body.style.cursor = 'grab')}
          onPointerOut={() => (document.body.style.cursor = '')}
        >
          <sphereGeometry args={[selWp === i ? 0.34 : 0.26, 16, 12]} />
          <meshStandardMaterial color={selWp === i ? '#c0825a' : '#7c8f6b'} emissive={selWp === i ? '#6a3a20' : '#2b3a24'} depthTest={false} transparent opacity={0.92} />
        </mesh>
      ))}
    </group>
  )
}

export { clamp }
