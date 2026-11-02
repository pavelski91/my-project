import { Suspense, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { EffectComposer, N8AO, Bloom, Vignette } from '@react-three/postprocessing'
import { useStore } from '../store'
import { Lighting } from './Lighting'
import { Terrain, Boundary, Context } from './Terrain'
import { House } from './House'
import { Office, Wellness, Bania, Greenhouse } from './Pavilions'
import { Workshop, Carport } from './Outbuildings'
import { Features } from './Features'
import { Boardwalk } from './Boardwalk'
import { Fence } from './Fence'
import { Vegetation } from './Vegetation'
import { Annotations } from './Annotations'
import { CameraRig } from './CameraRig'
import { DragController, Selection, WaypointHandles } from './Editing'
import { useSunState } from './env'
import { M } from './materials'

/** Exposed to the UI for screenshot export. */
export const sceneApi: { screenshot: (scale?: number) => string | null; canvas: HTMLCanvasElement | null } = {
  screenshot: () => null,
  canvas: null,
}

function ApiBridge() {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    sceneApi.canvas = gl.domElement
    ;(window as unknown as { __three: unknown }).__three = { scene, camera }
    sceneApi.screenshot = (scale = 1) => {
      const pr = gl.getPixelRatio()
      if (scale !== 1) gl.setPixelRatio(pr * scale)
      gl.render(scene, camera)
      const url = gl.domElement.toDataURL('image/png')
      if (scale !== 1) gl.setPixelRatio(pr)
      return url
    }
  }, [gl, scene, camera])
  return null
}

function Structures() {
  const structures = useStore((s) => s.layout.structures)
  const phase = useStore((s) => s.phase)
  return (
    <>
      {structures.filter((s) => s.phase <= phase).map((s) => {
        switch (s.kind) {
          case 'office': return <Office key={s.id} s={s} />
          case 'wellness': return <Wellness key={s.id} s={s} />
          case 'bania': return <Bania key={s.id} s={s} />
          case 'greenhouse': return <Greenhouse key={s.id} s={s} />
          case 'workshop': return <Workshop key={s.id} s={s} />
          case 'carport': return <Carport key={s.id} s={s} />
        }
      })}
    </>
  )
}

function Post() {
  const q = useStore((s) => s.settings.quality)
  const { night } = useSunState()
  if (q !== 'high') return null
  return (
    <EffectComposer multisampling={4}>
      <N8AO aoRadius={1.6} distanceFalloff={1} intensity={2.4} quality="medium" />
      <Bloom intensity={0.25 + night * 0.9} luminanceThreshold={0.88} luminanceSmoothing={0.2} mipmapBlur />
      <Vignette offset={0.35} darkness={0.35} />
    </EffectComposer>
  )
}

export function SceneRoot() {
  const select = useStore((s) => s.select)
  const cam = useStore((s) => s.cam)
  const quality = useStore((s) => s.settings.quality)
  useMemo(() => M, [])
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, quality === 'high' ? 2 : 1.6]}
      gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
      onPointerMissed={(e) => {
        if (e.type === 'click') select(null)
      }}
      style={{ touchAction: 'none', cursor: cam === 'human' ? 'crosshair' : undefined }}
    >
      <Suspense fallback={null}>
        <Lighting />
        <Terrain />
        <Boundary />
        <Context />
        <Fence />
        <House />
        <Structures />
        <Features />
        <Boardwalk />
        <Vegetation />
        <Annotations />
        <Selection />
        <WaypointHandles />
        <DragController />
        <CameraRig />
        <ApiBridge />
        <Post />
      </Suspense>
    </Canvas>
  )
}
