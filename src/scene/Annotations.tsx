import { useMemo } from 'react'
import { Html, Line } from '@react-three/drei'
import { useStore } from '../store'
import { PLOT, PLOT_LABELS, UTILITIES, SECOND_DWELLING, HOUSE_EXISTING, HOUSE_EXTENSION, TERRACE, ENTRANCE } from '../data/site'
import { terrainY, boxToRect, rectCorners } from '../lib/geometry'
import { useWalk } from './useWalk'
import { HOUSE_Y0, HOUSE_RIDGE } from './House'

const Tag = ({ children, tone = 'plain', onClick }: { children: React.ReactNode; tone?: 'plain' | 'dim' | 'accent'; onClick?: () => void }) => (
  <div
    onClick={onClick}
    className={
      'whitespace-nowrap rounded-full border px-2 py-[1px] text-[10px] font-medium leading-4 shadow-sm ' +
      (tone === 'dim'
        ? 'border-[#d9d4c7] bg-[#f6f2e9]/90 text-[#5b5f58]'
        : tone === 'accent'
          ? 'border-[#6f8a5f] bg-[#6f8a5f] text-white'
          : 'border-[#d9d4c7] bg-[#faf7f0]/95 text-[#26292a]')
    }
    style={{ pointerEvents: onClick ? 'auto' : 'none', cursor: onClick ? 'pointer' : 'default' }}
  >
    {children}
  </div>
)

export function Annotations() {
  const dims = useStore((s) => s.layers.dimensions)
  const labels = useStore((s) => s.layers.labels)
  const util = useStore((s) => s.layers.utilities)
  const secondLayer = useStore((s) => s.layers.second)
  const release = useStore((s) => s.settings.releaseSecondDwelling)
  const layout = useStore((s) => s.layout)
  const phase = useStore((s) => s.phase)
  const select = useStore((s) => s.select)
  const cam = useStore((s) => s.cam)
  const { length } = useWalk()
  const ortho = cam === 'plan' || cam === 'iso'
  const df: number | undefined = ortho ? undefined : 34
  const walking = cam === 'human' || cam === 'tour'

  const edges = useMemo(
    () =>
      PLOT.map((a, i) => {
        const b = PLOT[(i + 1) % PLOT.length]
        return { len: Math.hypot(b[0] - a[0], b[1] - a[1]), mx: (a[0] + b[0]) / 2, mz: (a[1] + b[1]) / 2, name: PLOT_LABELS[i] + PLOT_LABELS[(i + 1) % PLOT.length] }
      }),
    [],
  )
  const line = (pts: [number, number][], y = 0.12): [number, number, number][] => {
    const out: [number, number, number][] = []
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1]
      const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.2)
      for (let k = 0; k < n; k++) {
        const x = a[0] + ((b[0] - a[0]) * k) / n, z = a[1] + ((b[1] - a[1]) * k) / n
        out.push([x, terrainY(x, z) + y, z])
      }
    }
    const l = pts[pts.length - 1]
    out.push([l[0], terrainY(l[0], l[1]) + y, l[1]])
    return out
  }

  const sec = boxToRect(SECOND_DWELLING)
  const tags: { id: string; x: number; z: number; y: number; text: string; phase: number }[] = [
    { id: 'house', x: 7.3, z: 14.5, y: HOUSE_Y0 + HOUSE_RIDGE + 1.2, text: 'Existing house', phase: 0 },
    { id: 'extension', x: 7.3, z: 11.0, y: HOUSE_Y0 + HOUSE_RIDGE + 0.8, text: 'Extension · parents ↓ kids’ loft ↑', phase: 1 },
    { id: 'terrace', x: 15.6, z: 22.6, y: HOUSE_Y0 + 3.3, text: 'Terrace & pergola', phase: 1 },
    { id: 'bay', x: 11.5, z: 16.8, y: HOUSE_Y0 + HOUSE_RIDGE + 1.4, text: 'Family annex · kitchen · dining · living', phase: 1 },
    ...layout.structures.map((s) => ({ id: s.id, x: s.x, z: s.z, y: terrainY(s.x, s.z) + 4.2, text: `${s.label} · ${(s.kind === 'bania' ? s.w * s.d : s.w * s.d).toFixed(0)} m²`, phase: s.phase })),
  ]
  return (
    <group>
      {labels && !walking &&
        tags.filter((t) => t.phase <= phase).map((t) => (
          <Html key={t.id} position={[t.x, t.y, t.z]} center distanceFactor={df} zIndexRange={[10, 0]}>
            <Tag onClick={() => select(t.id)}>{t.text}</Tag>
          </Html>
        ))}
      {labels && !release && secondLayer && !walking && (
        <>
          <Line points={[...rectCorners(sec), rectCorners(sec)[0]].map(([x, z]) => [x, terrainY(x, z) + 0.15, z] as [number, number, number])} color="#9a9a8e" lineWidth={1.6} dashed dashSize={0.4} gapSize={0.25} />
          <mesh position={[sec.x, terrainY(sec.x, sec.z) + 2.35, sec.z]}>
            <boxGeometry args={[sec.w, 4.7, sec.d]} />
            <meshBasicMaterial color="#b8b8a8" transparent opacity={0.1} depthWrite={false} />
          </mesh>
          <Html position={[sec.x, terrainY(sec.x, sec.z) + 5.3, sec.z]} center distanceFactor={df}>
            <Tag tone="dim">Second dwelling (plan) · reserved</Tag>
          </Html>
        </>
      )}
      {labels && !walking && (
        <Html position={[ENTRANCE.gate.x, terrainY(ENTRANCE.gate.x, -2.8) + 2.8, -2.8]} center distanceFactor={df}>
          <Tag tone="dim">Entrance · ul. Mickiewicza ↑ N</Tag>
        </Html>
      )}
      {dims && !walking && (
        <>
          {edges.map((e, i) => (
            <Html key={i} position={[e.mx, terrainY(e.mx, e.mz) + 0.6, e.mz]} center distanceFactor={df} zIndexRange={[8, 0]}>
              <Tag tone="accent">{e.name} {e.len.toFixed(1)} m</Tag>
            </Html>
          ))}
          {layout.structures.filter((s) => s.phase <= phase).map((s) => (
            <Html key={s.id} position={[s.x, terrainY(s.x, s.z) + 0.7, s.z]} center distanceFactor={df === undefined ? undefined : df - 6} zIndexRange={[8, 0]}>
              <Tag tone="dim">{s.w.toFixed(1)} × {s.d.toFixed(1)} m</Tag>
            </Html>
          ))}
          {[HOUSE_EXISTING, HOUSE_EXTENSION, TERRACE].filter((_, i) => i === 0 || phase >= 1).map((b, i) => {
            const r = boxToRect(b)
            return (
              <Html key={i} position={[r.x, HOUSE_Y0 + 0.5, r.z]} center distanceFactor={df === undefined ? undefined : df - 6} zIndexRange={[8, 0]}>
                <Tag tone="dim">{r.w.toFixed(1)} × {r.d.toFixed(1)} m</Tag>
              </Html>
            )
          })}
          {phase >= 2 && (
            <Html position={[layout.boardwalk[Math.floor(layout.boardwalk.length / 2)][0], 1.2 + terrainY(layout.boardwalk[Math.floor(layout.boardwalk.length / 2)][0], layout.boardwalk[Math.floor(layout.boardwalk.length / 2)][1]), layout.boardwalk[Math.floor(layout.boardwalk.length / 2)][1]]} center distanceFactor={df === undefined ? undefined : df - 6}>
              <Tag tone="accent">Boardwalk {length.toFixed(1)} m × {layout.boardwalkWidth.toFixed(1)} m</Tag>
            </Html>
          )}
        </>
      )}
      {util && (
        <>
          <Line points={line(UTILITIES.waterLeft)} color="#2f7fd0" lineWidth={2.4} />
          <Line points={line(UTILITIES.waterRight)} color="#2f7fd0" lineWidth={2.4} />
          <Line points={line(UTILITIES.sewerLeft)} color="#d98a1f" lineWidth={2.4} />
          <Line points={line(UTILITIES.sewerRight)} color="#d98a1f" lineWidth={2.4} />
          <Line points={line(UTILITIES.electric)} color="#c0392b" lineWidth={2.4} dashed dashSize={0.5} gapSize={0.3} />
          <Html position={[9.3, 1.0 + terrainY(9.3, 2), 2]} center distanceFactor={df}><Tag tone="dim">Water Ø32 PE · Sewer Ø160 PVC (plan)</Tag></Html>
          <Html position={[13, 1.0 + terrainY(13, 12.5), 12.5]} center distanceFactor={df}><Tag tone="dim">Electric (plan)</Tag></Html>
        </>
      )}
    </group>
  )
}
