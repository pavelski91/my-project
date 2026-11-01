import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useFrame } from '@react-three/fiber'
import { useStore, SEASON_DATE, type Season } from '../store'
import type { Plant, Vegetation as Veg } from '../lib/vegetation'
import { fbm, rng } from '../lib/geometry'
import { MEADOW_FLOWERS, SPECIES, type Arch } from '../data/species'
import { Inst } from './Inst'
import { useVeg } from './useVeg'
import { tuftTexture } from './materials'

/* ------------------------------------------------------------------ */
/* Procedural geometry for the plant archetypes (unit height = 1)       */
/* ------------------------------------------------------------------ */
type Col = [number, number, number]
const hexRgb = (h: string): Col => {
  const c = new THREE.Color(h)
  return [c.r, c.g, c.b]
}

function colorize(g: THREE.BufferGeometry, fn: (x: number, y: number, z: number, i: number) => Col) {
  const pos = g.attributes.position
  const arr = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    const c = fn(pos.getX(i), pos.getY(i), pos.getZ(i), i)
    arr.set(c, i * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3))
  return g
}

function blob(rad0: number, sx: number, sy: number, sz: number, x: number, y: number, z: number, seed: number, detail = 2, jitter = 0.35, tone: [number, number] = [0.5, 1.0]) {
  const rad = rad0 * 0.82
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, detail)
  g.deleteAttribute('normal')
  g.deleteAttribute('uv')
  g = mergeVertices(g, 1e-4)
  const p = g.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    const n = fbm(v.x * 2.4 + seed * 7.3 + v.y * 1.3, v.z * 2.4 + seed * 3.1 - v.y * 0.7)
    const k = 1 + (n - 0.5) * jitter * 2
    v.multiplyScalar(k)
    p.setXYZ(i, v.x * rad * sx + x, v.y * rad * sy + y, v.z * rad * sz + z)
  }
  g.computeVertexNormals()
  const y0 = y - rad * sy, y1 = y + rad * sy
  colorize(g, (px, py, pz, i) => {
    const t = (py - y0) / Math.max(1e-4, y1 - y0)
    const d = Math.hypot(px - x, pz - z) / (rad * Math.max(sx, sz))
    const l = tone[0] + (tone[1] - tone[0]) * (0.25 + 0.75 * t) * (0.75 + 0.25 * (1 - d * 0.5)) + (fbm(px * 9, pz * 9 + py * 5) - 0.5) * 0.28
    return [l, l, l]
  })
  return g
}

function limb(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, r0: number, r1: number, col: Col) {
  const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0
  const len = Math.hypot(dx, dy, dz)
  const g = new THREE.CylinderGeometry(r1, r0, len, 5, 1)
  g.translate(0, len / 2, 0)
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize())
  g.applyQuaternion(q)
  g.translate(x0, y0, z0)
  g.deleteAttribute('uv')
  colorize(g, () => col)
  return g
}

const merge = (gs: THREE.BufferGeometry[]) => {
  const out = mergeGeometries(
    gs.map((g) => {
      const n = g.index ? g.toNonIndexed() : g
      n.deleteAttribute('uv')
      if (!n.attributes.normal) n.computeVertexNormals()
      return n
    }),
  )!
  gs.forEach((g) => g.dispose())
  return out
}

interface Arche {
  trunk: THREE.BufferGeometry | null
  crown: THREE.BufferGeometry
  deciduous: boolean
}

function bareBranches(x: number, y: number, z: number, spread: number, top: number, n: number, seed: number, col: Col) {
  const r = rng(seed)
  const out: THREE.BufferGeometry[] = []
  for (let i = 0; i < n; i++) {
    const a = r() * 6.28
    const h0 = y + r() * (top - y) * 0.6
    const reach = spread * (0.5 + r() * 0.8)
    const h1 = h0 + (top - h0) * (0.35 + r() * 0.5)
    out.push(limb(x, h0, z, x + Math.cos(a) * reach, h1, z + Math.sin(a) * reach, 0.006, 0.0025, col))
  }
  return out
}

function build(): Record<Arch, Arche> {
  const barkGrey = hexRgb('#4c3d33')
  const barkOrange = hexRgb('#9a5a37')
  const white = hexRgb('#e8e5da')
  const dark = hexRgb('#2b2622')
  // pine
  const pineTrunk = merge([
    colorize(new THREE.CylinderGeometry(0.006, 0.014, 0.88, 6, 4).translate(0.01, 0.44, 0), (x, y) => (y > 0.5 ? barkOrange : barkGrey)),
    limb(0, 0.6, 0, 0.12, 0.74, 0.05, 0.004, 0.002, barkOrange),
    limb(0, 0.7, 0, -0.1, 0.85, -0.04, 0.004, 0.002, barkOrange),
  ])
  pineTrunk.deleteAttribute('uv')
  const pineCrown = merge([
    blob(0.17, 1.15, 0.4, 1.1, 0.05, 0.64, 0.02, 1, 2, 0.45),
    blob(0.14, 1.1, 0.42, 1.2, -0.1, 0.76, 0.06, 2, 2, 0.45),
    blob(0.13, 1.2, 0.4, 1.0, 0.09, 0.85, -0.06, 3, 2, 0.45),
    blob(0.1, 1.1, 0.45, 1.1, -0.02, 0.95, 0.0, 4, 2, 0.4),
    blob(0.08, 1.2, 0.4, 1.0, 0.16, 0.7, 0.1, 5, 1, 0.4),
  ])
  // spruce
  const spruceTrunk = colorize(new THREE.CylinderGeometry(0.006, 0.014, 0.5, 5, 1).translate(0, 0.25, 0), () => barkGrey)
  spruceTrunk.deleteAttribute('uv')
  const cone = (y: number, r: number, h: number, seed: number) => {
    let g: THREE.BufferGeometry = new THREE.ConeGeometry(r, h, 9, 3)
    g.deleteAttribute('uv'); g.deleteAttribute('normal')
    g = mergeVertices(g, 1e-4)
    g.translate(0, y, 0)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const k = 1 + (fbm(p.getX(i) * 14 + seed, p.getZ(i) * 14) - 0.5) * 0.35
      p.setXYZ(i, p.getX(i) * k, p.getY(i) + (fbm(p.getX(i) * 9, p.getZ(i) * 9 + seed) - 0.5) * 0.02, p.getZ(i) * k)
    }
    g.computeVertexNormals()
    colorize(g, (px, py) => {
      const l = 0.55 + 0.5 * ((py - (y - h / 2)) / h) + (fbm(px * 20, py * 20) - 0.5) * 0.25
      return [l, l, l]
    })
    return g
  }
  const spruceCrown = merge([cone(0.28, 0.2, 0.34, 1), cone(0.46, 0.165, 0.3, 2), cone(0.63, 0.125, 0.27, 3), cone(0.8, 0.085, 0.24, 4), cone(0.93, 0.045, 0.16, 5)])
  // birch
  const birchBark = (y: number, i: number): Col => (Math.sin(y * 70 + i) > 0.82 ? dark : white)
  const birchTrunk = merge([
    colorize(new THREE.CylinderGeometry(0.005, 0.012, 0.8, 6, 12).translate(0.01, 0.4, 0), (x, y, z, i) => birchBark(y, Math.floor(x * 400))),
    ...bareBranches(0.02, 0.4, 0, 0.22, 0.95, 9, 31, white),
  ])
  birchTrunk.deleteAttribute('uv')
  const birchCrown = merge([
    blob(0.13, 0.95, 1.35, 0.95, 0.04, 0.55, 0.0, 1, 2, 0.5, [0.7, 1]),
    blob(0.11, 0.95, 1.3, 0.95, -0.08, 0.7, 0.07, 2, 2, 0.5, [0.7, 1]),
    blob(0.11, 0.95, 1.3, 0.95, 0.1, 0.78, -0.05, 3, 2, 0.5, [0.7, 1]),
    blob(0.1, 0.95, 1.3, 0.95, -0.03, 0.9, 0.0, 4, 2, 0.5, [0.7, 1]),
    blob(0.09, 0.9, 1.2, 0.9, 0.1, 0.6, 0.1, 5, 1, 0.5, [0.7, 1]),
  ])
  // rowan
  const rowanTrunk = merge([
    colorize(new THREE.CylinderGeometry(0.008, 0.016, 0.5, 6, 3).translate(0, 0.25, 0), () => hexRgb('#6b5b4f')),
    ...bareBranches(0, 0.35, 0, 0.25, 0.9, 10, 44, hexRgb('#6b5b4f')),
  ])
  rowanTrunk.deleteAttribute('uv')
  const rowanCrown = merge([
    blob(0.23, 1, 0.85, 1, 0, 0.7, 0, 1, 2, 0.45),
    blob(0.17, 1, 0.85, 1, 0.16, 0.6, 0.08, 2, 2, 0.45),
    blob(0.17, 1, 0.85, 1, -0.16, 0.62, -0.06, 3, 2, 0.45),
    blob(0.15, 1, 0.9, 1, 0.02, 0.88, 0.04, 4, 2, 0.45),
  ])
  // broad (aspen, alder)
  const broadTrunk = merge([
    colorize(new THREE.CylinderGeometry(0.01, 0.02, 0.55, 6, 3).translate(0, 0.27, 0), () => hexRgb('#6f6a5e')),
    ...bareBranches(0, 0.4, 0, 0.3, 0.95, 11, 52, hexRgb('#6f6a5e')),
  ])
  broadTrunk.deleteAttribute('uv')
  const broadCrown = merge([
    blob(0.27, 1, 0.85, 1, 0, 0.68, 0, 1, 2, 0.4),
    blob(0.2, 1, 0.85, 1, 0.2, 0.58, 0.1, 2, 2, 0.4),
    blob(0.2, 1, 0.85, 1, -0.2, 0.6, -0.08, 3, 2, 0.4),
    blob(0.19, 1, 0.9, 1, 0.05, 0.88, 0.08, 4, 2, 0.4),
    blob(0.17, 1, 0.85, 1, -0.1, 0.5, 0.2, 5, 1, 0.4),
  ])
  // fruit trees
  const fruitTrunk = merge([
    colorize(new THREE.CylinderGeometry(0.02, 0.032, 0.38, 6, 2).translate(0, 0.19, 0), () => hexRgb('#5c4d41')),
    ...bareBranches(0, 0.28, 0, 0.36, 0.72, 10, 63, hexRgb('#5c4d41')),
  ])
  fruitTrunk.deleteAttribute('uv')
  const fruitCrown = merge([
    blob(0.3, 1.1, 0.78, 1.1, 0, 0.6, 0, 1, 2, 0.4),
    blob(0.22, 1.1, 0.75, 1.1, 0.27, 0.5, 0.1, 2, 2, 0.4),
    blob(0.22, 1.1, 0.75, 1.1, -0.27, 0.5, -0.1, 3, 2, 0.4),
    blob(0.22, 1.1, 0.75, 1.1, 0.04, 0.55, 0.28, 4, 2, 0.4),
    blob(0.2, 1.1, 0.75, 1.1, -0.06, 0.52, -0.28, 5, 1, 0.4),
  ])
  // shrub: stems + lumpy mounds
  const shrubTrunk = merge(bareBranches(0, 0.0, 0, 0.3, 0.8, 16, 77, hexRgb('#70604f')))
  const shrubCrown = merge([
    blob(0.4, 1, 0.9, 1, 0, 0.5, 0, 1, 2, 0.45),
    blob(0.3, 1, 0.9, 1, 0.28, 0.4, 0.12, 2, 1, 0.45),
    blob(0.3, 1, 0.9, 1, -0.26, 0.42, -0.1, 3, 1, 0.45),
    blob(0.28, 1, 0.9, 1, 0.0, 0.72, 0.05, 4, 1, 0.45),
  ])
  // juniper
  const juniperCrown = merge([
    blob(0.2, 0.9, 2.1, 0.9, 0, 0.45, 0, 1, 2, 0.35),
    blob(0.15, 0.9, 1.9, 0.9, 0.17, 0.35, 0.05, 2, 1, 0.35),
    blob(0.15, 0.9, 1.9, 0.9, -0.15, 0.36, -0.07, 3, 1, 0.35),
  ])
  // fern/understorey (leaf blades)
  const blades: THREE.BufferGeometry[] = []
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    let g: THREE.BufferGeometry = new THREE.ConeGeometry(0.07, 0.9, 4, 2)
    g.deleteAttribute('uv')
    g.translate(0, 0.45, 0)
    g.rotateZ(0.9 + (i % 3) * 0.12)
    g.rotateY(a)
    colorize(g, (px, py) => {
      const l = 0.7 + (py / 0.9) * 0.4
      return [l, l, l]
    })
    blades.push(g)
  }
  const fernCrown = merge(blades)
  return {
    pine: { trunk: pineTrunk, crown: pineCrown, deciduous: false },
    spruce: { trunk: spruceTrunk, crown: spruceCrown, deciduous: false },
    birch: { trunk: birchTrunk, crown: birchCrown, deciduous: true },
    rowan: { trunk: rowanTrunk, crown: rowanCrown, deciduous: true },
    broad: { trunk: broadTrunk, crown: broadCrown, deciduous: true },
    fruit: { trunk: fruitTrunk, crown: fruitCrown, deciduous: true },
    shrub: { trunk: shrubTrunk, crown: shrubCrown, deciduous: true },
    juniper: { trunk: null, crown: juniperCrown, deciduous: false },
    fern: { trunk: null, crown: fernCrown, deciduous: true },
  }
}

let ARCH: Record<Arch, Arche> | null = null
const getArch = () => (ARCH ??= build())

const LEAF: Record<Arch, Record<Season, string>> = {
  pine: { spring: '#35523a', summer: '#2f4c36', autumn: '#2f4a35', winter: '#43604a' },
  spruce: { spring: '#2b4a3c', summer: '#254537', autumn: '#254537', winter: '#3b5a4b' },
  juniper: { spring: '#456a58', summer: '#3d6150', autumn: '#3d5f50', winter: '#51715f' },
  birch: { spring: '#a4cb62', summer: '#74a040', autumn: '#e6b83c', winter: '#8c8c6a' },
  rowan: { spring: '#cfe0b4', summer: '#5e9040', autumn: '#c8442b', winter: '#6a5a50' },
  broad: { spring: '#9bbd58', summer: '#5d8a3a', autumn: '#cd8c2e', winter: '#6a6a58' },
  fruit: { spring: '#f1dfe4', summer: '#64953f', autumn: '#bdb04a', winter: '#6a5a50' },
  shrub: { spring: '#a8c862', summer: '#5f8c3a', autumn: '#c99a36', winter: '#7a6a58' },
  fern: { spring: '#86b95d', summer: '#4f8e3e', autumn: '#b08a38', winter: '#9aa48d' },
}

const GRASS: Record<Season, string> = { spring: '#a4c264', summer: '#8fae58', autumn: '#bba45c', winter: '#f2f6f6' }

function useSeason() {
  return useStore((s) => s.season)
}

const growthFactor = (years: number) => 0.12 + 0.88 * (1 - Math.exp(-years / 11))
const hv = (i: number) => {
  const s = Math.sin(i * 91.7 + 3.3) * 43758.5
  return s - Math.floor(s)
}

function ArchInst({ arch, list, season, growth, snow }: { arch: Arch; list: Plant[]; season: Season; growth: number; snow: boolean }) {
  const a = getArch()[arch]
  const leaf = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0, side: THREE.FrontSide }), [])
  const bark = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }), [])
  useEffect(() => {
    leaf.color.set(LEAF[arch][season])
    bark.color.set(snow ? '#d8dcda' : '#ffffff')
    leaf.needsUpdate = true
  }, [leaf, bark, arch, season, snow])
  const hideLeaves = a.deciduous && season === 'winter' && arch !== 'fern'
  const fill = (i: number, o: THREE.Object3D, c: THREE.Color) => {
    const p = list[i]
    const s = p.h * growth
    o.position.set(p.x, p.y - 0.03, p.z)
    o.rotation.set(0, p.rot, 0)
    // pines & birches lean slightly
    o.scale.set(s * (0.85 + p.var * 0.3), s, s * (0.85 + p.var * 0.3))
    const t = new THREE.Color(SPECIES[p.sp].tint)
    const v = 0.88 + p.var * 0.26
    c.setRGB(t.r * v, t.g * v, t.b * v)
  }
  return (
    <>
      {a.trunk && <Inst count={list.length} geometry={a.trunk} material={bark} fill={fill} deps={[list, growth]} />}
      <Inst count={list.length} geometry={a.crown} material={leaf} fill={fill} deps={[list, growth]} visible={!hideLeaves} />
    </>
  )
}

/* tufts & flowers -------------------------------------------------- */
const tuftGeo = (() => {
  const planes: THREE.BufferGeometry[] = []
  for (let i = 0; i < 3; i++) {
    const g = new THREE.PlaneGeometry(0.5, 0.7)
    g.translate(0, 0.425, 0)
    g.rotateY((i * Math.PI) / 3)
    planes.push(g)
  }
  const g = mergeGeometries(planes)!
  const n = g.attributes.normal
  for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0) // light like the ground, not like a vertical card
  return g
})()
const flowerGeo = new THREE.IcosahedronGeometry(0.035, 0)

function Tufts({ list, season, scale, wind, cast = false }: { list: Tuft2[]; season: Season; scale: number; wind: boolean; cast?: boolean }) {
  const uTime = useRef({ value: 0 })
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ map: tuftTexture, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1, color: GRASS[season] })
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime.current
      // always light the card like the ground (avoids black back faces)
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <normal_fragment_begin>',
        '#include <normal_fragment_begin>\n normal = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);',
      )
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec4 ip = instanceMatrix * vec4(0.,0.,0.,1.);
          float sw = sin(uTime*1.7 + ip.x*0.8 + ip.z*0.6) * 0.07 * position.y * position.y;
          transformed.x += sw; transformed.z += sw*0.6;
        #endif`,
      )
    }
    return m
  }, [])
  useEffect(() => {
    mat.color.set(GRASS[season])
  }, [mat, season])
  useFrame((st) => {
    if (wind) uTime.current.value = st.clock.elapsedTime
  })
  return (
    <Inst
      count={list.length}
      geometry={tuftGeo}
      material={mat}
      cast={cast}
      deps={[list, season, scale]}
      fill={(i, o, c) => {
        const t = list[i]
        const meadowH = t.meadow ? (season === 'spring' ? 0.6 : season === 'winter' ? 0.4 : 1.15) : season === 'winter' ? 0.55 : 0.7
        const s = t.s * meadowH * scale
        o.position.set(t.x, t.y - 0.02, t.z)
        o.rotation.set(0, t.rot, 0)
        o.scale.set(s * 1.1, s, s * 1.1)
        const v = 0.78 + t.c * 0.4
        c.setRGB(v, v * (0.95 + t.c * 0.1), v * 0.9)
      }}
    />
  )
}
type Tuft2 = Veg['tufts'][number]

export function Vegetation() {
  const on = useStore((s) => s.layers.vegetation)
  const phase = useStore((s) => s.phase)
  const season = useSeason()
  const years = useStore((s) => s.settings.growthYears)
  const veg = useVeg()
  const growth = growthFactor(years)
  const month = SEASON_DATE[season].month

  const lists = useMemo(() => {
    const all: Record<string, Plant[]> = {}
    for (const p of veg.plants) if (p.phase <= phase) (all[p.arch] ??= []).push(p)
    for (const p of veg.context) (all[p.arch] ??= []).push(p)
    return all
  }, [veg, phase])
  const tufts = useMemo(() => veg.tufts.filter((t) => t.phase <= phase), [veg, phase])
  const flowers = useMemo(() => veg.flowers.filter((f) => f.phase <= phase && MEADOW_FLOWERS[f.col].bloom[0] <= month && MEADOW_FLOWERS[f.col].bloom[1] >= month), [veg, phase, month])
  const flowerMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.7 }), [])
  if (!on) return null
  const snow = season === 'winter'
  return (
    <group>
      {(Object.keys(lists) as Arch[]).map((arch) => (
        <ArchInst key={arch} arch={arch} list={lists[arch]} season={season} growth={arch === 'fern' ? Math.min(1, growth * 1.4) : growth} snow={snow} />
      ))}
      <Tufts list={tufts} season={season} scale={1} wind />
      <Tufts list={veg.contextTufts} season={season} scale={1.0} wind={false} />
      <Inst
        count={flowers.length}
        geometry={flowerGeo}
        material={flowerMat}
        cast={false}
        deps={[flowers]}
        fill={(i, o, c) => {
          const f = flowers[i]
          o.position.set(f.x, f.y + 0.5 + f.s * 0.3, f.z)
          o.scale.set(f.s * 1.2, f.s * 0.7, f.s * 1.2)
          c.set(MEADOW_FLOWERS[f.col].color)
        }}
      />
    </group>
  )
}

export const useVegetationData = () => null
