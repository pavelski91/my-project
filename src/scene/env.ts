import { useMemo } from 'react'
import * as THREE from 'three'
import { useStore, SEASON_DATE } from '../store'
import { sunPosition, sunDir } from '../lib/solar'
import { smooth } from '../lib/geometry'
import type { ThreeEvent } from '@react-three/fiber'
import { canDrag, beginItemDrag } from './Editing'

export function useSunState() {
  const season = useStore((s) => s.season)
  const hour = useStore((s) => s.hour)
  const north = useStore((s) => s.settings.northOffset)
  return useMemo(() => {
    const { month, day } = SEASON_DATE[season]
    const sun = sunPosition(month, day, hour)
    const dir = sunDir(sun, north)
    const sinAlt = Math.sin(sun.alt)
    const day01 = smooth(-0.1, 0.12, sinAlt) // 0 = night, 1 = day
    const lowSun = smooth(0.42, 0.0, Math.max(sinAlt, 0)) // 1 near the horizon (golden hour)
    const glow = Math.max(1 - day01, day01 * lowSun * 0.85) // warm windows & lamps from golden hour on
    return { sun, dir, sinAlt, day: day01, night: 1 - day01, glow, lowSun, snow: season === 'winter' ? 1 : 0, season, leafy: season === 'summer' || season === 'spring' || season === 'autumn' }
  }, [season, hour, north])
}

export function useNight() {
  return useSunState().night
}

/** Click / hover handlers for selectable scene objects. */
export function usePick(id: string) {
  const select = useStore((s) => s.select)
  const setHovered = useStore((s) => s.setHovered)
  return useMemo(
    () => ({
      onClick: (e: ThreeEvent<MouseEvent>) => {
        if (e.delta > 4) return // was a drag, not a click
        e.stopPropagation()
        select(id)
      },
      onPointerDown: (e: ThreeEvent<PointerEvent>) => {
        if (e.button !== 0 || !canDrag(id)) return
        e.stopPropagation()
        beginItemDrag(id, e.point)
      },
      onPointerOver: (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        setHovered(id)
        document.body.style.cursor = canDrag(id) ? 'grab' : 'pointer'
      },
      onPointerOut: () => {
        setHovered(null)
        document.body.style.cursor = ''
      },
    }),
    [id, select, setHovered],
  )
}

export const COLORS = {
  sage: '#7c8f6b',
  warn: '#b9694a',
  charcoal: '#26292a',
  timber: '#b98a55',
}
export const tmpColor = new THREE.Color()
