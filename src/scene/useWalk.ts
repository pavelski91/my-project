import { useMemo } from 'react'
import { useStore } from '../store'
import { samplePath } from '../lib/geometry'

/** Sampled boardwalk centre line (memoised on the waypoint array). */
export function useWalk(step = 0.3) {
  const bw = useStore((s) => s.layout.boardwalk)
  return useMemo(() => samplePath(bw, step), [bw, step])
}
