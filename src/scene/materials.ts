import * as THREE from 'three'
import { makeBoards, makeNoise, makeSeamRoof, makeStone, makeTuft, makeRake, makeWater } from './textures'

const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p)

const charred = makeBoards({ base: '#6d4a34', boards: 8, vary: 0.2, gap: 3, char: true, vertical: true, seed: 3 })
const larchWarm = makeBoards({ base: '#a67647', boards: 8, vary: 0.2, gap: 3, vertical: true, seed: 8 })
const larchNew = makeBoards({ base: '#7a5638', boards: 8, vary: 0.16, gap: 3, vertical: true, seed: 13 })
const lightBoards = makeBoards({ base: '#d2b389', boards: 8, vary: 0.14, gap: 2, vertical: true, seed: 5 })
const deckBoards = makeBoards({ base: '#a9855a', boards: 7, vary: 0.2, gap: 4, vertical: false, seed: 17 })
const walkBoards = makeBoards({ base: '#a47c52', boards: 7, vary: 0.2, gap: 4, vertical: false, seed: 19 })
const saunaBoards = makeBoards({ base: '#d9a468', boards: 10, vary: 0.12, gap: 2, vertical: false, seed: 23 })
const oakFloor = makeBoards({ base: '#e6d2ae', boards: 6, vary: 0.1, gap: 2, vertical: false, seed: 41 })
const whiteBoards = makeBoards({ base: '#f1e9d8', boards: 8, vary: 0.05, gap: 2, vertical: true, seed: 61 })
const roof = makeSeamRoof()
export const noise = makeNoise(256, 9, 1.3)
export const noiseSoft = makeNoise(256, 4, 0.8)
const stoneTex = makeStone('#807d76', 4)
const slateTex = makeStone('#585a58', 6)

export const steamTexture = (() => {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 62)
  grd.addColorStop(0, 'rgba(255,255,255,0.9)')
  grd.addColorStop(0.5, 'rgba(255,255,255,0.35)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
})()
export const tuftTexture = makeTuft()
export const rakeTexture = makeRake()
export const waterTexture = makeWater()

const rotTex = (t: THREE.Texture) => {
  const c = t.clone()
  c.rotation = Math.PI / 2
  c.center.set(0.5, 0.5)
  c.needsUpdate = true
  return c
}

const withBump = (t: { map: THREE.Texture; bump: THREE.Texture }, extra: THREE.MeshStandardMaterialParameters = {}) =>
  std({ map: t.map, bumpMap: t.bump, bumpScale: 1.2, roughness: 0.82, metalness: 0, ...extra })

export const M = {
  charred: withBump(charred, { roughness: 0.92 }),
  larchWarm: withBump(larchWarm),
  larchNew: withBump(larchNew),
  light: withBump(lightBoards, { roughness: 0.75 }),
  deck: withBump(deckBoards, { roughness: 0.85 }),
  walk: withBump(walkBoards, { roughness: 0.9 }),
  sauna: withBump(saunaBoards, { roughness: 0.7 }),
  roof: std({ map: roof.map, bumpMap: roof.bump, bumpScale: 1.5, roughness: 0.42, metalness: 0.6, color: '#ffffff' }),
  roofSlope: std({ map: rotTex(roof.map), bumpMap: rotTex(roof.bump), bumpScale: 1.5, roughness: 0.42, metalness: 0.6, color: '#ffffff' }),
  whitewash: withBump(whiteBoards, { roughness: 0.85 }),
  oak: withBump(oakFloor, { roughness: 0.6 }),
  counter: std({ color: '#2b2d2e', roughness: 0.5, metalness: 0.1 }),
  ceramic: std({ color: '#efece4', roughness: 0.3 }),
  rug: std({ color: '#cdbb94', roughness: 1, bumpMap: noise, bumpScale: 2 }),
  paper: std({ color: '#f4e7c9', emissive: '#ffcf8a', emissiveIntensity: 0.2, roughness: 0.9 }),
  steel: std({ color: '#1d1f21', roughness: 0.42, metalness: 0.75 }),
  steelLight: std({ color: '#8b9094', roughness: 0.3, metalness: 0.9 }),
  glass: std({ color: '#a9c1cf', roughness: 0.04, metalness: 0.0, transparent: true, opacity: 0.2, envMapIntensity: 1.4, side: THREE.DoubleSide, depthWrite: false, emissive: '#ffb86b', emissiveIntensity: 0 }),
  glassDark: std({ color: '#2a363c', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.55, envMapIntensity: 1.4, depthWrite: false, emissive: '#ffb86b', emissiveIntensity: 0 }),
  concrete: std({ color: '#8d8b86', roughness: 0.95, map: stoneTex, bumpMap: noise, bumpScale: 0.6 }),
  stone: std({ color: '#ffffff', map: stoneTex, roughness: 0.95, bumpMap: noise, bumpScale: 1.5 }),
  slate: std({ color: '#ffffff', map: slateTex, roughness: 0.9, bumpMap: noise, bumpScale: 1.5 }),
  soil: std({ color: '#4a3a2c', roughness: 1, bumpMap: noise, bumpScale: 2 }),
  mulch: std({ color: '#5a4230', roughness: 1, bumpMap: noise, bumpScale: 3 }),
  plaster: std({ color: '#e7e2d6', roughness: 0.95 }),
  plasterDark: std({ color: '#3a3d3f', roughness: 0.9 }),
  fabricGrey: std({ color: '#6a6d70', roughness: 1 }),
  fabricSage: std({ color: '#7d8a74', roughness: 1 }),
  fabricMustard: std({ color: '#c0a03a', roughness: 1 }),
  fabricLinen: std({ color: '#d8d0bf', roughness: 1 }),
  rubber: std({ color: '#1c1c1c', roughness: 0.95 }),
  iron: std({ color: '#2d2f31', roughness: 0.6, metalness: 0.8 }),
  copper: std({ color: '#b87b52', roughness: 0.4, metalness: 0.9 }),
  water: std({ color: '#35564f', roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.88, envMapIntensity: 1.5 }),
  tubWood: std({ color: '#b98a55', roughness: 0.75, map: lightBoards.map, bumpMap: lightBoards.bump, bumpScale: 1 }),
  lamp: std({ color: '#3d3a35', emissive: '#ffb25c', emissiveIntensity: 0, roughness: 0.6, metalness: 0.4 }),
  fire: std({ color: '#ff9a3c', emissive: '#ff7a1c', emissiveIntensity: 0, transparent: true, opacity: 0.0 }),
  green: std({ color: '#5f7d44', roughness: 0.9 }),
  pot: std({ color: '#8c6a4c', roughness: 0.9 }),
  rope: std({ color: '#c9b690', roughness: 1 }),
  bin: std({ color: '#3a3f3b', roughness: 0.8 }),
  tankBlue: std({ color: '#cfd6d4', roughness: 0.6, transparent: true, opacity: 0.85 }),
  outline: new THREE.MeshBasicMaterial({ color: '#7c8f6b', transparent: true, opacity: 0.0, depthWrite: false }),
}

export const flatMat = (c: string, rough = 0.9, metal = 0) => std({ color: c, roughness: rough, metalness: metal })

/** Box geometry whose UVs are in metres (texture tile = 1 m) so timber boards stay correctly scaled on any size. */
const boxCache = new Map<string, THREE.BoxGeometry>()
export function boxGeo(w: number, h: number, d: number) {
  const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`
  let g = boxCache.get(key)
  if (g) return g
  g = new THREE.BoxGeometry(w, h, d)
  const uv = g.attributes.uv
  const dims: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]
  for (let f = 0; f < 6; f++)
    for (let i = 0; i < 4; i++) {
      const idx = f * 4 + i
      uv.setXY(idx, uv.getX(idx) * dims[f][0], uv.getY(idx) * dims[f][1])
    }
  uv.needsUpdate = true
  boxCache.set(key, g)
  return g
}
