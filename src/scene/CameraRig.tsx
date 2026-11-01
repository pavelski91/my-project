import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, OrthographicCamera } from '@react-three/drei'
import type { OrbitControls as OrbitImpl } from 'three-stdlib'
import { useStore, VIEWPOINTS } from '../store'
import { PLOT_CENTER, terrainY, clamp, PLOT_BBOX } from '../lib/geometry'
import { useWalk } from './useWalk'
import { PLOT } from '../data/site'
import { pointInPoly } from '../lib/geometry'

const CX = PLOT_CENTER[0]
const CZ = PLOT_CENTER[1]

const EYE = 1.65

export function CameraRig() {
  const cam = useStore((s) => s.cam)
  const nonce = useStore((s) => s.camNonce)
  const viewpoint = useStore((s) => s.viewpoint)
  const dragging = useStore((s) => s.dragging)
  const editMode = useStore((s) => s.editMode)
  const { camera, size, gl } = useThree()
  const controls = useRef<OrbitImpl>(null)
  const goal = useRef<{ pos: THREE.Vector3; target: THREE.Vector3; zoom: number } | null>(null)
  const ortho = cam === 'iso' || cam === 'plan'
  const walk = useRef({ yaw: 0, pitch: -0.05, x: 0, z: 0, keys: new Set<string>(), drag: false, lx: 0, ly: 0 })
  const { samples, length } = useWalk()
  const tourRef = useRef({ s: 0, hold: 0, stops: [] as number[], done: new Set<number>(), tick: 0 })
  const tour = useStore((s) => s.tour)
  const layout = useStore((s) => s.layout)

  const frame = Math.min(size.width, size.height)
  const orthoZoom = cam === 'plan' ? Math.min(size.width / 58, (size.height - 130) / 50) : Math.min(size.width / 68, (size.height - 150) / 48)

  // goal poses for the orbit modes
  useEffect(() => {
    if (cam === 'aerial') {
      // fit the whole property for the current viewport: distance from the narrower of the horizontal / vertical fov
      const aspect = size.width / Math.max(1, size.height)
      const vf = (36 * Math.PI) / 180
      const hf = 2 * Math.atan(Math.tan(vf / 2) * aspect)
      const dist = Math.max(62 / (2 * Math.tan(Math.min(vf, hf) / 2)), 70)
      const dir = new THREE.Vector3(0.05, 0.66, 0.75).normalize()
      goal.current = { pos: new THREE.Vector3(CX, 1, CZ - 1).add(dir.multiplyScalar(dist)), target: new THREE.Vector3(CX, 1, CZ - 1), zoom: 1 }
    } else if (cam === 'iso') {
      goal.current = { pos: new THREE.Vector3(CX + 70, 70, CZ + 70), target: new THREE.Vector3(CX, 1, CZ + 3), zoom: orthoZoom }
    } else if (cam === 'plan') {
      goal.current = { pos: new THREE.Vector3(CX, 120, CZ + 3.5), target: new THREE.Vector3(CX, 0, CZ + 3.5), zoom: orthoZoom }
    } else if (cam === 'human') {
      const vp = VIEWPOINTS.find((v) => v.id === viewpoint) ?? VIEWPOINTS[0]
      const w = walk.current
      let pos = vp.pos, look = vp.look
      const st = layout.structures.find((q) => q.kind === vp.id)
      if (st) {
        // stand in front of the pavilion on whichever side is inside the plot, looking at it
        const a = (st.rot * Math.PI) / 180
        const dirs: [number, number][] = [[-Math.sin(a), -Math.cos(a)], [Math.sin(a), Math.cos(a)], [Math.cos(a), -Math.sin(a)], [-Math.cos(a), Math.sin(a)]]
        const dist = Math.max(st.w, st.d) / 2 + 7.5
        for (const [ex, ez] of dirs) {
          const px = st.x + ex * dist, pz = st.z + ez * dist
          if (pointInPoly(px, pz, PLOT) && Math.hypot(px - 7.3, pz - 17) > 5) { pos = [px, pz]; break }
        }
        look = [st.x, st.z]
      }
      w.x = pos[0]
      w.z = pos[1]
      w.yaw = Math.atan2(-(look[0] - pos[0]), -(look[1] - pos[1]))
      w.pitch = -0.04
      goal.current = null
    } else if (cam === 'tour') {
      goal.current = null
      const t = tourRef.current
      t.s = clamp(useStore.getState().tour.t, 0, 1) * length
      t.hold = 0
      t.done = new Set()
      // stations at the pavilions (nearest sample to each structure, in order along the path)
      const stops: number[] = []
      for (const st of layout.structures.filter((q) => q.kind !== 'greenhouse')) {
        let best = 0, bd = Infinity
        samples.forEach((p, i) => {
          const d = Math.hypot(p.x - st.x, p.z - st.z)
          if (d < bd) { bd = d; best = i }
        })
        stops.push(samples[best].s)
      }
      t.stops = stops.sort((a, b) => a - b)
    }
    if (goal.current && controls.current) {
      // snap when the camera type changed, otherwise glide
      if (ortho) {
        camera.position.copy(goal.current.pos)
        if ((camera as THREE.OrthographicCamera).isOrthographicCamera) (camera as THREE.OrthographicCamera).zoom = goal.current.zoom
        controls.current.target.copy(goal.current.target)
        camera.updateProjectionMatrix()
        controls.current.update()
        goal.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cam, nonce, viewpoint, camera.uuid, orthoZoom])

  // keyboard / pointer for walking
  useEffect(() => {
    const dom = gl.domElement
    const w = walk.current
    const kd = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      w.keys.add(e.key.toLowerCase())
    }
    const ku = (e: KeyboardEvent) => w.keys.delete(e.key.toLowerCase())
    const pd = (e: PointerEvent) => {
      if (useStore.getState().cam !== 'human') return
      w.drag = true
      w.lx = e.clientX
      w.ly = e.clientY
      dom.setPointerCapture?.(e.pointerId)
    }
    const pm = (e: PointerEvent) => {
      if (!w.drag || useStore.getState().cam !== 'human') return
      w.yaw -= (e.clientX - w.lx) * 0.004
      w.pitch = clamp(w.pitch - (e.clientY - w.ly) * 0.003, -1.2, 1.2)
      w.lx = e.clientX
      w.ly = e.clientY
    }
    const pu = () => (w.drag = false)
    const wh = (e: WheelEvent) => {
      if (useStore.getState().cam !== 'human') return
      const f = -Math.sign(e.deltaY) * 0.9
      stepWalk(w, f, 0)
    }
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    dom.addEventListener('pointerdown', pd)
    window.addEventListener('pointermove', pm)
    window.addEventListener('pointerup', pu)
    dom.addEventListener('wheel', wh, { passive: true })
    return () => {
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      dom.removeEventListener('pointerdown', pd)
      window.removeEventListener('pointermove', pm)
      window.removeEventListener('pointerup', pu)
      dom.removeEventListener('wheel', wh)
    }
  }, [gl])

  const eyeY = (x: number, z: number) => {
    let y = terrainY(x, z)
    // standing on the boardwalk or the terrace
    let bd = Infinity, by = 0
    for (const p of samples) {
      const d = Math.hypot(p.x - x, p.z - z)
      if (d < bd) { bd = d; by = p.y }
    }
    if (bd < 0.65 && useStore.getState().phase >= 2) y = Math.max(y, by)
    if (x > 9.4 && x < 14.2 && z > 16.4 && z < 23.6 && useStore.getState().phase >= 1) y = Math.max(y, 3.06)
    return y + EYE
  }

  useFrame((_, dt) => {
    const st = useStore.getState()
    const c = camera
    if (cam === 'human') {
      const w = walk.current
      const run = w.keys.has('shift') ? 2.4 : 1
      const f = ((w.keys.has('w') || w.keys.has('arrowup')) ? 1 : 0) - ((w.keys.has('s') || w.keys.has('arrowdown')) ? 1 : 0)
      const r = (w.keys.has('d') ? 1 : 0) - (w.keys.has('a') ? 1 : 0)
      if (w.keys.has('arrowleft')) w.yaw += dt * 1.6
      if (w.keys.has('arrowright')) w.yaw -= dt * 1.6
      if (f || r) stepWalk(w, f * dt * 2.0 * run, r * dt * 2.0 * run)
      const y = eyeY(w.x, w.z)
      c.position.x += (w.x - c.position.x) * Math.min(1, dt * 14)
      c.position.z += (w.z - c.position.z) * Math.min(1, dt * 14)
      c.position.y += (y - c.position.y) * Math.min(1, dt * 8)
      c.rotation.order = 'YXZ'
      c.rotation.set(w.pitch, w.yaw, 0) // no roll — keep the horizon level
      return
    }
    if (cam === 'tour') {
      const t = tourRef.current
      if (st.tour.playing && length > 0) {
        if (t.hold > 0) t.hold -= dt
        else {
          t.s += dt * st.tour.speed
          for (const stop of t.stops) {
            if (!t.done.has(stop) && Math.abs(t.s - stop) < 0.5) {
              t.done.add(stop)
              t.hold = 2.4
            }
          }
          if (t.s >= length) {
            t.s = length
            useStore.getState().setTour({ playing: false })
          }
        }
      }
      const sample = (s: number) => {
        const i = clamp(s / (samples[1].s - samples[0].s), 0, samples.length - 1.001)
        const a = samples[Math.floor(i)], b = samples[Math.floor(i) + 1]
        const f = i - Math.floor(i)
        return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f }
      }
      const p = sample(t.s)
      const la = sample(Math.min(length, t.s + 5))
      const tgt = new THREE.Vector3(la.x, la.y + 1.35, la.z)
      // while holding at a station look toward the nearest pavilion
      if (t.hold > 0) {
        let near: { x: number; z: number } | null = null, nd = Infinity
        for (const s of st.layout.structures) {
          const d = Math.hypot(s.x - p.x, s.z - p.z)
          if (d < nd) { nd = d; near = s }
        }
        if (near && nd < 9) tgt.set(near.x, p.y + 1.4, near.z)
      }
      const eye = new THREE.Vector3(p.x, p.y + EYE, p.z)
      c.position.lerp(eye, Math.min(1, dt * 6))
      const m = new THREE.Matrix4().lookAt(c.position, tgt, new THREE.Vector3(0, 1, 0))
      const q = new THREE.Quaternion().setFromRotationMatrix(m)
      c.quaternion.slerp(q, Math.min(1, dt * 3.2))
      t.tick += dt
      if (t.tick > 0.1) {
        t.tick = 0
        const u = t.s / Math.max(1, length)
        if (Math.abs(u - st.tour.t) > 0.002) useStore.getState().setTour({ t: u })
      }
      return
    }
    // orbit modes: glide to goal
    const g = goal.current
    const ctl = controls.current
    if (g && ctl) {
      const k = Math.min(1, dt * 3.4)
      c.position.lerp(g.pos, k)
      ctl.target.lerp(g.target, k)
      if ((c as THREE.OrthographicCamera).isOrthographicCamera) {
        const oc = c as THREE.OrthographicCamera
        oc.zoom += (g.zoom - oc.zoom) * k
        oc.updateProjectionMatrix()
      }
      if (c.position.distanceTo(g.pos) < 0.05 && ctl.target.distanceTo(g.target) < 0.05) goal.current = null
    }
    if (ctl) {
      // keep the focus point over the property
      ctl.target.x = clamp(ctl.target.x, PLOT_BBOX.x0 - 20, PLOT_BBOX.x1 + 20)
      ctl.target.z = clamp(ctl.target.z, PLOT_BBOX.z0 - 20, PLOT_BBOX.z1 + 20)
      ctl.target.y = clamp(ctl.target.y, -1, 12)
    }
  })

  // sync tour scrubbing from the UI slider
  useEffect(() => {
    if (cam !== 'tour') return
    const t = tourRef.current
    const target = tour.t * length
    if (Math.abs(target - t.s) > 0.6) {
      t.s = target
      t.hold = 0
    }
  }, [tour.t, cam, length])

  const orbitOn = cam !== 'human' && cam !== 'tour' && !dragging
  return (
    <>
      {ortho ? (
        <OrthographicCamera makeDefault position={cam === 'plan' ? [CX, 120, CZ] : [CX + 70, 70, CZ + 70]} up={cam === 'plan' ? [0, 0, -1] : [0, 1, 0]} zoom={orthoZoom} near={-300} far={1200} key={'oc-' + cam} />
      ) : (
        <PerspectiveCamera makeDefault fov={cam === 'human' || cam === 'tour' ? 62 : 36} near={0.1} far={2200} position={cam === 'aerial' ? [CX + 4, 54, CZ + 62] : [CX + 4, 54, CZ + 62]} key={'pc-' + (cam === 'human' || cam === 'tour' ? 'walk' : 'persp')} />
      )}
      <OrbitControls
        ref={controls as never}
        key={'ctl-' + cam}
        makeDefault
        enabled={orbitOn}
        enableDamping
        dampingFactor={0.09}
        enableRotate={cam !== 'plan'}
        screenSpacePanning={cam === 'plan' || ortho}
        mouseButtons={{ LEFT: cam === 'plan' ? THREE.MOUSE.PAN : editMode ? THREE.MOUSE.ROTATE : THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
        minDistance={4}
        maxDistance={170}
        maxPolarAngle={ortho ? Math.PI / 2 : Math.PI / 2 - 0.04}
        minZoom={4}
        maxZoom={80}
        zoomToCursor={false}
      />
    </>
  )
}

function stepWalk(w: { yaw: number; x: number; z: number }, fwd: number, right: number) {
  const nx = w.x + -Math.sin(w.yaw) * fwd + Math.cos(w.yaw) * right
  const nz = w.z + -Math.cos(w.yaw) * fwd + -Math.sin(w.yaw) * right
  // stay near the property (±12 m beyond boundary) and out of the house
  if (nx < PLOT_BBOX.x0 - 14 || nx > PLOT_BBOX.x1 + 14 || nz < PLOT_BBOX.z0 - 14 || nz > PLOT_BBOX.z1 + 14) return
  if (nx > 5.0 && nx < 9.6 && nz > 12.5 && nz < 20.3 && !pointInPoly(0, 0, PLOT)) return
  if (nx > 5.0 && nx < 9.6 && nz > 12.5 && nz < 23.6) return // the house
  w.x = nx
  w.z = nz
}

void useMemo
