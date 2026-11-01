import * as THREE from 'three'
import { rng, lerp, clamp } from '../lib/geometry'

/** All textures are procedural (no external downloads) and represent 1 m × 1 m of surface unless noted. */

function canvas(w: number, h = w) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}
function toTex(c: HTMLCanvasElement, srgb = true, repeat = true) {
  const t = new THREE.CanvasTexture(c)
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  t.anisotropy = 8
  t.needsUpdate = true
  return t
}
const hex = (h: string) => {
  const c = new THREE.Color(h)
  return [c.r * 255, c.g * 255, c.b * 255]
}
const rgb = (r: number, g: number, b: number, a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`

export interface BoardOpts {
  base: string
  boards: number
  vary?: number
  gap?: number // px
  grain?: number
  vertical?: boolean
  char?: boolean // charred (shou-sugi-ban) look
  seed?: number
  size?: number
}

/** Timber board cladding / decking — returns colour + bump (height) textures. */
export function makeBoards(o: BoardOpts) {
  const S = o.size ?? 512
  const r = rng(o.seed ?? 7)
  const cc = canvas(S)
  const cb = canvas(S)
  const g = cc.getContext('2d')!
  const b = cb.getContext('2d')!
  const [br, bg, bb] = hex(o.base)
  const n = o.boards
  const bw = S / n
  const gap = o.gap ?? 3
  b.fillStyle = '#9a9a9a'
  b.fillRect(0, 0, S, S)
  g.save()
  b.save()
  if (!o.vertical) {
    g.translate(0, S); g.rotate(-Math.PI / 2)
    b.translate(0, S); b.rotate(-Math.PI / 2)
  }
  for (let i = 0; i < n; i++) {
    const v = (r() - 0.5) * (o.vary ?? 0.22)
    const x = i * bw
    g.fillStyle = rgb(br * (1 + v), bg * (1 + v), bb * (1 + v))
    g.fillRect(x, 0, bw, S)
    // grain streaks
    const gr = o.grain ?? 1
    for (let k = 0; k < 38 * gr; k++) {
      const gx = x + r() * bw
      const dark = r() < 0.6
      g.strokeStyle = dark ? rgb(0, 0, 0, 0.05 + r() * 0.16) : rgb(255, 235, 200, 0.03 + r() * 0.07)
      g.lineWidth = 0.5 + r() * 1.4
      g.beginPath()
      let wob = 0
      g.moveTo(gx, 0)
      for (let y = 0; y <= S; y += 32) {
        wob += (r() - 0.5) * 1.1
        g.lineTo(gx + wob, y)
      }
      g.stroke()
      if (dark && r() < 0.5) {
        b.strokeStyle = rgb(60, 60, 60, 0.4)
        b.lineWidth = 0.8
        b.beginPath()
        b.moveTo(gx, 0)
        b.lineTo(gx + wob, S)
        b.stroke()
      }
    }
    // knots
    if (r() < 0.45 * (o.char ? 0.4 : 1)) {
      const kx = x + bw * (0.25 + r() * 0.5)
      const ky = r() * S
      for (let q = 3; q > 0; q--) {
        g.strokeStyle = rgb(30, 15, 5, 0.22)
        g.lineWidth = 1.2
        g.beginPath()
        g.ellipse(kx, ky, q * 2.4, q * 6.5, 0, 0, 7)
        g.stroke()
      }
      b.fillStyle = rgb(60, 60, 60, 0.6)
      b.beginPath(); b.ellipse(kx, ky, 3, 8, 0, 0, 7); b.fill()
    }
    if (o.char) {
      // alligator-skin charring: short broken cross-grain cracks
      for (let k = 0; k < 210; k++) {
        const cx = x + r() * bw
        const cy = r() * S
        g.strokeStyle = rgb(0, 0, 0, 0.1 + r() * 0.35)
        g.lineWidth = 0.7 + r() * 1.1
        g.beginPath()
        g.moveTo(cx - bw * 0.1, cy)
        g.lineTo(cx + bw * 0.1 * (r() * 2 - 1), cy + 5 + r() * 12)
        g.stroke()
        b.strokeStyle = rgb(40, 40, 40, 0.5)
        b.lineWidth = 1
        b.beginPath(); b.moveTo(cx - bw * 0.1, cy); b.lineTo(cx + 2, cy + 7); b.stroke()
      }
      for (let k = 0; k < 40; k++) {
        g.fillStyle = rgb(180, 150, 120, 0.04 + r() * 0.05)
        g.fillRect(x + r() * bw, r() * S, 1 + r() * 2, 12 + r() * 40)
      }
    }
    // shadow gap between boards (rain-screen)
    g.fillStyle = rgb(8, 6, 4, 0.82)
    g.fillRect(x, 0, gap, S)
    g.fillStyle = rgb(255, 240, 220, 0.07)
    g.fillRect(x + gap, 0, 1.2, S)
    b.fillStyle = '#000'
    b.fillRect(x, 0, gap, S)
    // butt joints for decking
    if (!o.vertical && r() < 0.5) {
      const y = r() * S
      g.fillStyle = rgb(8, 6, 4, 0.7)
      g.fillRect(x, y, bw, 2)
    }
  }
  g.restore()
  b.restore()
  const map = toTex(cc)
  const bump = toTex(cb, false)
  return { map, bump }
}

/** Dark standing-seam metal roof (0.5 m panels), seams run along v. */
export function makeSeamRoof() {
  const S = 512
  const c = canvas(S)
  const b = canvas(S)
  const g = c.getContext('2d')!
  const gb = b.getContext('2d')!
  const r = rng(11)
  g.fillStyle = '#2a2d31'
  g.fillRect(0, 0, S, S)
  gb.fillStyle = '#808080'
  gb.fillRect(0, 0, S, S)
  for (let i = 0; i < 4000; i++) {
    g.fillStyle = rgb(120, 130, 140, r() * 0.05)
    g.fillRect(r() * S, r() * S, 1 + r() * 2, 1 + r() * 8)
  }
  for (let i = 0; i < 2; i++) {
    const x = i * (S / 2)
    g.fillStyle = rgb(8, 9, 11, 0.9)
    g.fillRect(x, 0, 6, S)
    g.fillStyle = rgb(120, 130, 140, 0.35)
    g.fillRect(x + 6, 0, 2, S)
    g.fillStyle = rgb(0, 0, 0, 0.12)
    g.fillRect(x + 8, 0, 14, S)
    gb.fillStyle = '#fff'
    gb.fillRect(x, 0, 8, S)
    gb.fillStyle = '#505050'
    gb.fillRect(x + 8, 0, 8, S)
  }
  return { map: toTex(c), bump: toTex(b, false) }
}

/** Soft monochrome noise for bump / roughness variation. */
export function makeNoise(size = 256, seed = 3, contrast = 1) {
  const c = canvas(size)
  const g = c.getContext('2d')!
  const img = g.createImageData(size, size)
  const r = rng(seed)
  const grid = new Float32Array(size * size)
  for (let o = 0; o < 4; o++) {
    const cell = size / 2 ** (o + 2)
    const pts = Math.ceil(size / cell) + 1
    const v: number[] = Array.from({ length: pts * pts }, () => r())
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const fx = x / cell, fy = y / cell
        const ix = Math.floor(fx), iy = Math.floor(fy)
        const tx = fx - ix, ty = fy - iy
        const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty)
        const a = v[(iy % pts) * pts + (ix % pts)], bq = v[(iy % pts) * pts + ((ix + 1) % pts)]
        const cq = v[((iy + 1) % pts) * pts + (ix % pts)], d = v[((iy + 1) % pts) * pts + ((ix + 1) % pts)]
        grid[y * size + x] += lerp(lerp(a, bq, sx), lerp(cq, d, sx), sy) / 2 ** o
      }
  }
  for (let i = 0; i < size * size; i++) {
    const v = clamp((grid[i] / 1.875 - 0.5) * contrast + 0.5, 0, 1) * 255
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v
    img.data[i * 4 + 3] = 255
  }
  g.putImageData(img, 0, 0)
  return toTex(c, false)
}

/** Speckled stone / paving. */
export function makeStone(base = '#7c7a74', seed = 5) {
  const S = 256
  const c = canvas(S)
  const g = c.getContext('2d')!
  const r = rng(seed)
  const [br, bg, bb] = hex(base)
  g.fillStyle = base
  g.fillRect(0, 0, S, S)
  for (let i = 0; i < 2600; i++) {
    const v = (r() - 0.5) * 70
    g.fillStyle = rgb(br + v, bg + v, bb + v, 0.5)
    g.fillRect(r() * S, r() * S, 1 + r() * 3, 1 + r() * 3)
  }
  return toTex(c)
}

/** Grass blade card (tuft) with alpha. Colour is multiplied by instance colour. */
export function makeTuft() {
  const W = 128, H = 256
  const c = canvas(W, H)
  const g = c.getContext('2d')!
  const r = rng(21)
  for (let i = 0; i < 46; i++) {
    const x0 = W * (0.08 + r() * 0.84)
    const hgt = H * (0.45 + r() * 0.55)
    const bend = (r() - 0.5) * 70
    const grd = g.createLinearGradient(0, H, 0, H - hgt)
    const l = 0.75 + r() * 0.25
    grd.addColorStop(0, rgb(170 * l, 180 * l, 130 * l))
    grd.addColorStop(1, rgb(255 * l, 255 * l, 225 * l))
    g.fillStyle = grd
    g.beginPath()
    g.moveTo(x0 - 2.2, H)
    g.quadraticCurveTo(x0 + bend * 0.2, H - hgt * 0.5, x0 + bend, H - hgt)
    g.quadraticCurveTo(x0 + bend * 0.2 + 2, H - hgt * 0.5, x0 + 2.2, H)
    g.fill()
  }
  const t = toTex(c, true, false)
  return t
}

/** Concentric raked-gravel pattern for the meditation garden. */
export function makeRake() {
  const S = 512
  const c = canvas(S)
  const g = c.getContext('2d')!
  g.fillStyle = '#c9c4b8'
  g.fillRect(0, 0, S, S)
  const r = rng(2)
  for (let i = 0; i < 6000; i++) {
    g.fillStyle = rgb(120 + r() * 100, 115 + r() * 100, 105 + r() * 100, 0.35)
    g.fillRect(r() * S, r() * S, 2, 2)
  }
  g.strokeStyle = 'rgba(90,86,76,0.5)'
  g.lineWidth = 3
  for (let i = 1; i < 14; i++) {
    g.beginPath()
    g.ellipse(S * 0.35, S * 0.5, i * 18, i * 14, 0, 0, 7)
    g.stroke()
  }
  g.strokeStyle = 'rgba(255,255,255,0.35)'
  g.lineWidth = 1.5
  for (let i = 1; i < 14; i++) {
    g.beginPath()
    g.ellipse(S * 0.35, S * 0.5 + 2, i * 18, i * 14, 0, 0, 7)
    g.stroke()
  }
  return toTex(c, true, false)
}

/** Vertical gradient for water. */
export function makeWater() {
  const S = 128
  const c = canvas(S)
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2)
  grd.addColorStop(0, '#1f3a3d')
  grd.addColorStop(1, '#2f4f44')
  g.fillStyle = grd
  g.fillRect(0, 0, S, S)
  return toTex(c, true, false)
}
