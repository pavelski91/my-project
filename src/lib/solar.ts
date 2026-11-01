import * as THREE from 'three'
import { SITE_LAT } from '../data/site'
import { rad, deg, rectCirclesPoint, type Rect } from './geometry'

export interface Sun {
  alt: number // radians
  az: number // radians, clockwise from true north
}

export const dayOfYear = (month: number, day: number) => {
  const d = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let n = day
  for (let i = 0; i < month - 1; i++) n += d[i]
  return n
}

/** Solar position from local *solar* time (hours, 12 = solar noon). Accurate to ≈1°, plenty for a concept model. */
export function sunPosition(month: number, day: number, solarHour: number, lat = SITE_LAT): Sun {
  const N = dayOfYear(month, day)
  const decl = rad(23.44) * Math.sin(rad((360 / 365) * (284 + N)))
  const H = rad(15 * (solarHour - 12))
  const phi = rad(lat)
  const sinAlt = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(H)
  const alt = Math.asin(sinAlt)
  const cosAz = (Math.sin(decl) - Math.sin(alt) * Math.sin(phi)) / (Math.cos(alt) * Math.cos(phi) + 1e-9)
  let az = Math.acos(Math.min(1, Math.max(-1, cosAz)))
  if (H > 0) az = 2 * Math.PI - az
  return { alt, az }
}

/** Direction *towards* the sun in scene space. `sheetBearing` = bearing of scene "up" (−z) from true north. */
export function sunDir(s: Sun, sheetBearing = 0) {
  const az = s.az - rad(sheetBearing)
  return new THREE.Vector3(Math.sin(az) * Math.cos(s.alt), Math.sin(s.alt), -Math.cos(az) * Math.cos(s.alt))
}

export function dayLength(month: number, day: number, lat = SITE_LAT) {
  const N = dayOfYear(month, day)
  const decl = rad(23.44) * Math.sin(rad((360 / 365) * (284 + N)))
  const x = -Math.tan(rad(lat)) * Math.tan(decl)
  return (2 * deg(Math.acos(Math.min(1, Math.max(-1, x))))) / 15
}

export interface Occluder {
  rect: Rect
  h: number
}
export interface CrownOccluder {
  x: number
  z: number
  r: number
  y0: number
  y1: number
  evergreen: boolean
}

/**
 * Hours of direct sun at a point (height 1 m) for a date. Buildings block fully; tree crowns attenuate
 * (evergreen 85 %, deciduous in leaf 55 %, bare 15 %). Neighbouring plots are ignored.
 */
export function sunHours(
  px: number,
  pz: number,
  month: number,
  day: number,
  occ: Occluder[],
  crowns: CrownOccluder[],
  inLeaf: boolean,
  sheetBearing = 0,
) {
  let hours = 0
  const step = 0.25
  for (let h = 3; h <= 21; h += step) {
    const s = sunPosition(month, day, h)
    if (s.alt < rad(2)) continue
    const d = sunDir(s, sheetBearing)
    const hx = d.x / Math.cos(s.alt)
    const hz = d.z / Math.cos(s.alt)
    const tn = Math.tan(s.alt)
    let light = 1
    const hit = new Set<number>()
    for (let t = 0.4; t < 45 && light > 0.02; t += 0.4) {
      const x = px + hx * t
      const z = pz + hz * t
      const y = 1 + t * tn
      for (const o of occ) if (y < o.h && rectCirclesPoint(o.rect, x, z)) { light = 0; break }
      if (light === 0) break
      for (let ci = 0; ci < crowns.length; ci++) {
        const c = crowns[ci]
        if (hit.has(ci)) continue
        if (y > c.y0 && y < c.y1 && (x - c.x) ** 2 + (z - c.z) ** 2 < c.r * c.r) {
          hit.add(ci)
          light *= c.evergreen ? 0.15 : inLeaf ? 0.45 : 0.85
        }
      }
    }
    hours += light * step
  }
  return hours
}
