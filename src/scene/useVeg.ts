import { useStore } from '../store'
import { generateVegetation, type Vegetation } from '../lib/vegetation'

const cache = new Map<string, Vegetation>()

/** Shared, memoised vegetation scatter for the current layout (re-generated only on committed changes). */
export function useVeg(): Vegetation {
  const ver = useStore((s) => s.vegVersion)
  const optionId = useStore((s) => s.optionId)
  const second = useStore((s) => s.settings.releaseSecondDwelling)
  const dragging = useStore((s) => s.dragging)
  const key = `${optionId}|${ver}|${second}`
  let v = cache.get(key)
  if (!v) {
    const { layout, phase } = useStore.getState()
    // while a drag is in progress keep showing the last committed scatter
    if (dragging && cache.size) return Array.from(cache.values()).pop()!
    v = generateVegetation(layout, phase, second)
    cache.set(key, v)
    if (cache.size > 4) cache.delete(cache.keys().next().value as string)
  }
  return v
}
