import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Sky, Stars, Environment, Lightformer } from '@react-three/drei'
import { useStore } from '../store'
import { useSunState } from './env'
import { M } from './materials'
import { PLOT_CENTER, lerp } from '../lib/geometry'

const SKY_DAY = new THREE.Color('#bcd3dd')
const SKY_DUSK = new THREE.Color('#d9a98a')
const SKY_NIGHT = new THREE.Color('#0b1220')

/** Sun/moon, sky, fog, seasonal and night material updates. */
export function Lighting() {
  const { dir, sun, day, night, snow, season } = useSunState()
  const quality = useStore((s) => s.settings.quality)
  const { scene } = useThree()
  const light = useRef<THREE.DirectionalLight>(null)
  const target = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(PLOT_CENTER[0], 0, PLOT_CENTER[1])
    return o
  }, [])

  const alt = sun.alt
  const lowSun = THREE.MathUtils.smoothstep(0.45 - Math.sin(Math.max(alt, 0)), 0, 0.45) // 1 when near horizon
  const sunColor = useMemo(() => new THREE.Color('#fff4e0').lerp(new THREE.Color('#ffb072'), lowSun), [lowSun])
  const fogColor = useMemo(() => {
    const c = SKY_DAY.clone().lerp(SKY_DUSK, lowSun * day * 0.65)
    return c.lerp(SKY_NIGHT, night)
  }, [lowSun, day, night])

  // light direction: sun by day, moon (fixed, high) by night
  const lp = useMemo(() => {
    const d = dir.clone()
    if (night > 0.5) d.set(-0.4, 0.75, -0.3).normalize()
    return d.multiplyScalar(80)
  }, [dir, night])

  useEffect(() => {
    scene.fog = new THREE.Fog(fogColor, 110, 330)
    scene.background = fogColor
  }, [scene, fogColor])

  // material updates that depend on season / night
  useEffect(() => {
    M.glass.emissiveIntensity = night * 0.65
    M.glassDark.emissiveIntensity = night * 0.5
    M.lamp.emissiveIntensity = night * 2.6
    const snowCol = new THREE.Color('#eef3f4')
    for (const m of [M.roof, M.roofSlope]) {
      m.color.set('#ffffff').lerp(snowCol, snow * 0.35)
    }
    M.deck.color.set('#ffffff').lerp(snowCol, snow * 0.45)
    M.walk.color.set('#ffffff').lerp(snowCol, snow * 0.4)
    M.mulch.color.set('#5a4230').lerp(new THREE.Color('#d4dadc'), snow * 0.7)
    M.concrete.color.set('#8d8b86').lerp(snowCol, snow * 0.4)
  }, [night, snow])

  const shadowSize = quality === 'high' ? 4096 : 2048
  return (
    <>
      <Sky distance={4500} sunPosition={dir.clone().multiplyScalar(1000).toArray() as [number, number, number]} turbidity={season === 'winter' ? 6 : 4} rayleigh={lerp(0.6, 2.4, lowSun) * (night > 0.7 ? 0.1 : 1)} mieCoefficient={0.004} mieDirectionalG={0.8} />
      {night > 0.4 && <Stars radius={600} depth={60} count={3500} factor={5} saturation={0} fade speed={0.3} />}
      <hemisphereLight args={[night > 0.5 ? '#2b3a58' : '#cfe0ee', night > 0.5 ? '#14170f' : '#6d6a46', lerp(0.28, 0.65, day) + night * 0.42]} />
      <directionalLight
        ref={light}
        castShadow
        position={[PLOT_CENTER[0] + lp.x, lp.y, PLOT_CENTER[1] + lp.z]}
        target={target}
        intensity={day * 3.4 * (0.35 + 0.65 * (1 - lowSun * 0.45)) + night * 1.1}
        color={night > 0.5 ? '#9db4e6' : sunColor}
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.00025}
        shadow-normalBias={0.05}
        shadow-radius={3}
      >
        <orthographicCamera attach="shadow-camera" args={[-34, 34, 34, -34, 1, 260]} />
      </directionalLight>
      <primitive object={target} />
      <Environment resolution={256} environmentIntensity={lerp(0.06, 0.55, day)} background={false}>
        <Lightformer form="rect" intensity={2.2} color="#dbe9f4" position={[0, 30, 0]} rotation-x={Math.PI / 2} scale={[80, 80, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#fff0d8" position={[40, 14, 30]} scale={[30, 12, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#c8dcf0" position={[-40, 10, -20]} rotation-y={Math.PI / 2} scale={[40, 12, 1]} />
      </Environment>
    </>
  )
}
