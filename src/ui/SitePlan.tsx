import { useMemo, useRef } from 'react'
import { useStore } from '../store'
import { PLOT, PLOT_LABELS, UTILITIES, SPOT_HEIGHTS, HOUSE_EXISTING, HOUSE_EXTENSION, TERRACE, SECOND_DWELLING, SHED_EXISTING, ENTRANCE, PLAN_BALANCE } from '../data/site'
import { ZONE_INFO } from '../data/catalog'
import { elevation, rectCorners, boxToRect, samplePath, signedDistToPlot, type V2, type Rect } from '../lib/geometry'
import { SPECIES } from '../data/species'
import { Btn, Modal, fmt, useMetrics } from './kit'
import { useVeg } from '../scene/useVeg'
import { download } from './Toolbar'
import { apronRect } from '../lib/validate'
import { gatePos } from '../scene/Fence'

const S = 17 // px per metre
const XMIN = -6, ZMIN = -10, XMAX = 45, ZMAX = 46
const OX = 56, OY = 56
const X = (x: number) => OX + (x - XMIN) * S
const Y = (z: number) => OY + (z - ZMIN) * S
const PW = (XMAX - XMIN) * S
const PH = (ZMAX - ZMIN) * S
const RIGHT = 520
const W = OX + PW + 36 + RIGHT
const H0 = OY * 2 + PH

/** Marching-squares iso-line segments of f(x,z)=level. */
function contour(f: (x: number, z: number) => number, level: number, step = 0.75): [V2, V2][] {
  const segs: [V2, V2][] = []
  const nx = Math.ceil((XMAX - XMIN) / step), nz = Math.ceil((ZMAX - ZMIN) / step)
  const g: number[][] = []
  for (let j = 0; j <= nz; j++) {
    g[j] = []
    for (let i = 0; i <= nx; i++) g[j][i] = f(XMIN + i * step, ZMIN + j * step) - level
  }
  const lerp = (a: number, b: number) => a / (a - b)
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const v = [g[j][i], g[j][i + 1], g[j + 1][i + 1], g[j + 1][i]]
      const x0 = XMIN + i * step, z0 = ZMIN + j * step
      const pts: V2[] = []
      if (v[0] * v[1] < 0) pts.push([x0 + lerp(v[0], v[1]) * step, z0])
      if (v[1] * v[2] < 0) pts.push([x0 + step, z0 + lerp(v[1], v[2]) * step])
      if (v[3] * v[2] < 0) pts.push([x0 + lerp(v[3], v[2]) * step, z0 + step])
      if (v[0] * v[3] < 0) pts.push([x0, z0 + lerp(v[0], v[3]) * step])
      if (pts.length === 2) segs.push([pts[0], pts[1]])
      else if (pts.length === 4) {
        segs.push([pts[0], pts[1]], [pts[2], pts[3]])
      }
    }
  return segs
}

const ptsStr = (pts: V2[]) => pts.map(([x, z]) => `${X(x).toFixed(1)},${Y(z).toFixed(1)}`).join(' ')
const rectPts = (r: Rect) => ptsStr(rectCorners(r))

export function SitePlanSVG({ svgRef }: { svgRef?: React.RefObject<SVGSVGElement | null> }) {
  const layout = useStore((s) => s.layout)
  const phase = useStore((s) => s.phase)
  const optionId = useStore((s) => s.optionId)
  const years = useStore((s) => s.settings.growthYears)
  const releaseSecond = useStore((s) => s.settings.releaseSecondDwelling)
  const veg = useVeg()
  const m = useMetrics()
  const bw = useMemo(() => samplePath(layout.boardwalk, 0.5), [layout.boardwalk])
  const growth = 0.12 + 0.88 * (1 - Math.exp(-years / 11))

  const contours = useMemo(() => {
    const out: { level: number; segs: [V2, V2][] }[] = []
    for (let l = 145.5; l <= 148.6; l += 0.5) out.push({ level: l, segs: contour(elevation, l) })
    return out
  }, [])
  const setback = useMemo(() => contour(signedDistToPlot, 3.0, 0.5), [])

  // numbered schedule
  const items: { n: number; label: string; sub: string; r: Rect; fill: string; stroke?: string; kind: string }[] = []
  let n = 1
  const push = (label: string, sub: string, r: Rect, fill: string, kind: string, stroke?: string) => items.push({ n: n++, label, sub, r, fill, stroke, kind })
  push('Existing house', `${(HOUSE_EXISTING.x1 - HOUSE_EXISTING.x0).toFixed(1)} × ${(HOUSE_EXISTING.z1 - HOUSE_EXISTING.z0).toFixed(1)} m · floor 148.10`, boxToRect(HOUSE_EXISTING), '#3b3f40', 'house')
  if (phase >= 1) {
    push('Planned extension', '+3.3 m south, Phase 1', boxToRect(HOUSE_EXTENSION), '#6b5440', 'ext')
    push('Terrace & pergola', 'Phase 1', boxToRect(TERRACE), '#b49a78', 'deck')
  } else push('Existing tin garage', 'g1 · removed in Phase 1', boxToRect(SHED_EXISTING), '#9aa4a6', 'shed')
  layout.structures.filter((s) => s.phase <= phase).forEach((s) => push(s.label, `${s.w.toFixed(1)} × ${s.d.toFixed(1)} m = ${(s.w * s.d).toFixed(1)} m² · Phase ${s.phase}`, s, s.kind === 'bania' ? '#b49a78' : s.kind === 'greenhouse' ? '#cfe0d6' : s.kind === 'workshop' ? '#7a6a55' : s.kind === 'carport' ? '#a9a9a0' : '#3b3f40', s.kind))
  layout.features.filter((f) => f.enabled && f.phase <= phase && f.kind !== 'dining').forEach((f) => push(f.label, `Phase ${f.phase}`, f, f.kind === 'pond' ? '#6aa0aa' : f.kind === 'raingarden' ? '#9bb8a4' : f.kind === 'beds' ? '#8a5f3e' : f.kind === 'firepit' ? '#a9a395' : '#7a6f60', f.kind))

  const treeR = (h: number) => Math.max(0.5, h * growth * 0.2)
  const plants = veg.plants.filter((p) => p.phase <= phase && p.arch !== 'fern')
  const trees = plants.filter((p) => ['pine', 'spruce', 'birch', 'rowan', 'broad', 'fruit'].includes(p.arch)).sort((a, b) => b.h - a.h)
  const shrubs = plants.filter((p) => ['shrub', 'juniper'].includes(p.arch))
  const aprn = apronRect()
  const edges = PLOT.map((a, i) => {
    const b = PLOT[(i + 1) % PLOT.length]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2
    // outward normal (polygon is clockwise on screen with z down)
    let nx = (b[1] - a[1]) / len, nz = -(b[0] - a[0]) / len
    const cx = PLOT.reduce((s, p) => s + p[0], 0) / PLOT.length, cz = PLOT.reduce((s, p) => s + p[1], 0) / PLOT.length
    if ((mx - cx) * nx + (mz - cz) * nz < 0) { nx = -nx; nz = -nz }
    const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
    return { len, mx: mx + nx * 2.1, mz: mz + nz * 2.1, ang: ang > 90 || ang < -90 ? ang + 180 : ang, name: PLOT_LABELS[i] + PLOT_LABELS[(i + 1) % PLOT.length], a, b }
  })

  const zoneRows = Math.ceil(new Set(layout.zones.filter((z) => z.phase <= phase).map((z) => z.type)).size / 2)
  const rightH = 128 + items.length * 21 + 52 + zoneRows * 19 + 20 + 124 + 24 + 150
  const H = Math.max(H0, rightH + OY * 2)
  const roadN = (d: number): V2[] => {
    // road band at distance d from boundary AB (north)
    const a = PLOT[0], b = PLOT[1]
    const l = Math.hypot(b[0] - a[0], b[1] - a[1])
    const dx = (b[0] - a[0]) / l, dz = (b[1] - a[1]) / l
    const nx = dz, nz = -dx
    return [[a[0] + dx * -30 + nx * d, a[1] + dz * -30 + nz * d], [a[0] + dx * 70 + nx * d, a[1] + dz * 70 + nz * d]]
  }
  const r1 = roadN(7.2), r2 = roadN(14.8)

  return (
    <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} width={W} height={H} fontFamily="Inter, 'Segoe UI', Helvetica, Arial, sans-serif" style={{ background: '#f6f2e9', maxWidth: '100%', height: 'auto' }}>
      <defs>
        <clipPath id="planclip"><rect x={OX} y={OY} width={PW} height={PH} /></clipPath>
        <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#8a8a80" strokeWidth="1" /></pattern>
      </defs>
      <rect x={OX} y={OY} width={PW} height={PH} fill="#f1ede1" stroke="#cfc9b9" />
      <g clipPath="url(#planclip)">
        {/* road */}
        <polygon points={`${X(r1[0][0])},${Y(r1[0][1])} ${X(r1[1][0])},${Y(r1[1][1])} ${X(r2[1][0])},${Y(r2[1][1])} ${X(r2[0][0])},${Y(r2[0][1])}`} fill="#d7d4cb" />
        <text x={X(r1[0][0] + 6)} y={Y(r1[0][1] - 5.5)} fontSize="11" fill="#8a8a80" transform={`rotate(-6.8 ${X(r1[0][0] + 6)} ${Y(r1[0][1] - 5.5)})`}>ul. Adama Mickiewicza (road, by others)</text>
        {/* neighbours */}
        <rect x={X(-31.5)} y={Y(0.8)} width={9 * S} height={6.5 * S} fill="url(#hatch)" stroke="#9a9a8e" />
        <rect x={X(-15.5)} y={Y(30.1)} width={4.2 * S} height={2.2 * S} fill="url(#hatch)" stroke="#9a9a8e" />
        <rect x={X(-7.4)} y={Y(31.5)} width={3.6 * S} height={2.2 * S} fill="url(#hatch)" stroke="#9a9a8e" />
        {/* contours */}
        {contours.map((c) => (
          <g key={c.level}>
            <path d={c.segs.map(([a, b]) => `M${X(a[0]).toFixed(1)} ${Y(a[1]).toFixed(1)}L${X(b[0]).toFixed(1)} ${Y(b[1]).toFixed(1)}`).join('')} stroke={c.level % 1 === 0 ? '#a99c80' : '#cbbfa5'} strokeWidth={c.level % 1 === 0 ? 0.9 : 0.6} fill="none" />
            {c.segs.length > 4 && (
              <text x={X(c.segs[Math.floor(c.segs.length / 2)][0][0])} y={Y(c.segs[Math.floor(c.segs.length / 2)][0][1])} fontSize="8.5" fill="#8c7f63">{c.level.toFixed(1)}</text>
            )}
          </g>
        ))}
        {/* zones */}
        {layout.zones.filter((z) => z.phase <= phase).map((z) => (
          <polygon key={z.id} points={ptsStr(z.poly)} fill={ZONE_INFO[z.type].color} fillOpacity={0.42} stroke={ZONE_INFO[z.type].color} strokeOpacity={0.7} strokeWidth="0.8" />
        ))}
        {/* setback guide */}
        <path d={setback.map(([a, b]) => `M${X(a[0]).toFixed(1)} ${Y(a[1]).toFixed(1)}L${X(b[0]).toFixed(1)} ${Y(b[1]).toFixed(1)}`).join('')} stroke="#777" strokeWidth="0.9" strokeDasharray="3 4" fill="none" />
        {/* entrance & hard surfaces */}
        {phase >= 2 && <polygon points={rectPts(aprn)} fill="#bdbab0" stroke="#8d8a80" />}
        {phase >= 2 && <rect x={X(ENTRANCE.waste.x - ENTRANCE.waste.w / 2)} y={Y(ENTRANCE.waste.z - ENTRANCE.waste.d / 2)} width={ENTRANCE.waste.w * S} height={ENTRANCE.waste.d * S} fill="#8d8a80" />}
        {/* second dwelling ghost */}
        {!releaseSecond && <polygon points={rectPts(boxToRect(SECOND_DWELLING))} fill="none" stroke="#8a8a80" strokeDasharray="4 3" />}
        {/* utilities */}
        {([[UTILITIES.waterLeft, '#2f7fd0'], [UTILITIES.waterRight, '#2f7fd0'], [UTILITIES.sewerLeft, '#d98a1f'], [UTILITIES.sewerRight, '#d98a1f'], [UTILITIES.electric, '#c0392b']] as [V2[], string][]).map(([p, c], i) => (
          <polyline key={i} points={ptsStr(p)} stroke={c} strokeWidth="1.3" strokeDasharray={c === '#c0392b' ? '5 3' : '2 2'} fill="none" />
        ))}
        {/* planting */}
        {trees.map((p, i) => <circle key={'t' + i} cx={X(p.x)} cy={Y(p.z)} r={treeR(p.h) * S} fill={p.arch === 'pine' || p.arch === 'spruce' ? '#3d5a3c' : SPECIES[p.sp]?.native ? '#7c9a62' : '#c19a62'} fillOpacity={0.5} stroke="#2f4a2f" strokeOpacity={0.5} strokeWidth="0.6" />)}
        {shrubs.map((p, i) => <circle key={'s' + i} cx={X(p.x)} cy={Y(p.z)} r={Math.max(0.35, p.h * growth * 0.25) * S} fill={SPECIES[p.sp]?.native ? '#a2b87a' : '#d1b27a'} fillOpacity={0.55} />)}
        {/* stone path */}
        {phase >= 2 && <polyline points={ptsStr(layout.stonePath)} stroke="#8a8579" strokeWidth="3" strokeDasharray="5 6" fill="none" strokeLinecap="round" />}
        {/* boardwalk */}
        {phase >= 2 && (
          <g>
            <polyline points={ptsStr(bw.samples.map((p) => [p.x, p.z] as V2))} stroke="#3b3f40" strokeWidth={layout.boardwalkWidth * S + 2} fill="none" strokeLinejoin="round" strokeLinecap="butt" />
            <polyline points={ptsStr(bw.samples.map((p) => [p.x, p.z] as V2))} stroke="#9a7b56" strokeWidth={layout.boardwalkWidth * S - 1} fill="none" strokeLinejoin="round" strokeLinecap="butt" />
          </g>
        )}
        {/* buildings */}
        {items.map((it) => (
          <g key={it.n}>
            <polygon points={rectPts(it.r)} fill={it.fill} stroke="#1f2223" strokeWidth="1" fillOpacity={it.kind === 'pond' || it.kind === 'raingarden' || it.kind === 'greenhouse' ? 0.75 : 0.95} />
          </g>
        ))}
        {/* fence */}
        <polygon points={ptsStr(PLOT)} fill="none" stroke="#b5483a" strokeWidth="1.6" strokeDasharray="9 3" />
        {phase >= 2 && (
          <g stroke="#2b2d2e" strokeWidth="3">
            {[gatePos(0, ENTRANCE.gate.x), gatePos(0, ENTRANCE.pedestrian.x), gatePos(4, ENTRANCE.service.x)].map((g, i) => {
              const w = i === 0 ? ENTRANCE.gate.width : 1.0
              const dx = Math.cos(-g.ang) * w / 2, dz = Math.sin(-g.ang) * w / 2
              return <line key={i} x1={X(g.x - dx)} y1={Y(g.z - dz)} x2={X(g.x + dx)} y2={Y(g.z + dz)} />
            })}
          </g>
        )}
        {/* spot heights */}
        {SPOT_HEIGHTS.filter(([x, z]) => x > XMIN && x < XMAX && z > ZMIN && z < ZMAX).map(([x, z, h], i) => (
          <g key={i}><circle cx={X(x)} cy={Y(z)} r="1.4" fill="#6b5f48" /><text x={X(x) + 3} y={Y(z) - 2} fontSize="8.5" fill="#6b5f48">{h.toFixed(1)}</text></g>
        ))}
        {/* edge dimensions */}
        {edges.map((e) => (
          <text key={e.name} x={X(e.mx)} y={Y(e.mz)} fontSize="10.5" fill="#b5483a" textAnchor="middle" transform={`rotate(${e.ang} ${X(e.mx)} ${Y(e.mz)})`}>{e.name} {e.len.toFixed(2)} m</text>
        ))}
        {PLOT.map(([x, z], i) => (
          <g key={i}><circle cx={X(x)} cy={Y(z)} r="9" fill="#b5483a" /><text x={X(x)} y={Y(z) + 3.7} fontSize="11" fill="#fff" textAnchor="middle" fontWeight="600">{PLOT_LABELS[i]}</text></g>
        ))}
        {/* numbering */}
        {items.map((it) => (
          <g key={'n' + it.n}>
            <circle cx={X(it.r.x)} cy={Y(it.r.z)} r="8.5" fill="#faf7f0" stroke="#1f2223" />
            <text x={X(it.r.x)} y={Y(it.r.z) + 3.7} fontSize="10.5" fontWeight="600" textAnchor="middle" fill="#1f2223">{it.n}</text>
          </g>
        ))}
        {/* entrance arrow */}
        <g transform={`translate(${X(ENTRANCE.gate.x)} ${Y(-4.6)})`}>
          <path d="M0 -22 L0 8 M-6 0 L0 9 L6 0" stroke="#1f2223" strokeWidth="1.6" fill="none" />
          <text x="10" y="-8" fontSize="10.5" fill="#1f2223">entrance</text>
        </g>
      </g>
      {/* north arrow */}
      <g transform={`translate(${OX + PW - 38} ${OY + 46})`}>
        <circle r="22" fill="#faf7f0" stroke="#1f2223" />
        <path d="M0 -17 L6 8 L0 3 L-6 8 Z" fill="#1f2223" />
        <text y="-24" fontSize="12" fontWeight="700" textAnchor="middle" fill="#1f2223">N</text>
      </g>
      {/* scale bar */}
      <g transform={`translate(${OX + 14} ${OY + PH - 22})`}>
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={i * 2 * S} y="0" width={2 * S} height="6" fill={i % 2 ? '#faf7f0' : '#1f2223'} stroke="#1f2223" />)}
        <text x="0" y="-5" fontSize="10.5" fill="#1f2223">0</text>
        <text x={5 * 2 * S} y="-5" fontSize="10.5" fill="#1f2223" textAnchor="middle">10 m</text>
        <text x={0} y="20" fontSize="9.5" fill="#6b6f68">1 : {Math.round((1000 / 25.4) * 96 / S * 1)} at 96 dpi</text>
      </g>

      {/* right panel */}
      <g transform={`translate(${OX + PW + 36} ${OY})`}>
        <text y="12" fontSize="10.5" letterSpacing="2" fill="#5d7150" fontWeight="600">NAREWKA · MICKIEWICZA 1 · DZ. 420 · 1418 m²</text>
        <text y="42" fontSize="25" fill="#26292a" fontFamily="Georgia, 'Iowan Old Style', serif">Japandi Forest Sanctuary</text>
        <text y="64" fontSize="13" fill="#5b5f58">Annotated site plan · Option {optionId} — {layout.name} · Phase {phase}</text>
        <text y="82" fontSize="11" fill="#8a8a80">Concept design — dimensions traced from the survey plan, ±0.3 m. Not for construction.</text>
        <line x1="0" x2={RIGHT - 20} y1="96" y2="96" stroke="#d9d4c7" />
        {items.map((it, i) => (
          <g key={it.n} transform={`translate(0 ${118 + i * 21})`}>
            <circle cx="9" cy="-4" r="8.5" fill="#faf7f0" stroke="#1f2223" />
            <text x="9" y="0" fontSize="10.5" fontWeight="600" textAnchor="middle" fill="#1f2223">{it.n}</text>
            <text x="26" y="0" fontSize="12" fill="#26292a">{it.label}</text>
            <text x={RIGHT - 24} y="0" fontSize="10.5" fill="#6b6f68" textAnchor="end">{it.sub}</text>
          </g>
        ))}
        {(() => {
          const y0 = 128 + items.length * 21
          const zoneKeys = Array.from(new Set(layout.zones.filter((z) => z.phase <= phase).map((z) => z.type)))
          return (
            <g transform={`translate(0 ${y0})`}>
              <line x1="0" x2={RIGHT - 20} y1="0" y2="0" stroke="#d9d4c7" />
              <text y="22" fontSize="10.5" letterSpacing="1.6" fill="#5b5f58" fontWeight="600">PLANTING ZONES</text>
              {zoneKeys.map((k, i) => (
                <g key={k} transform={`translate(${(i % 2) * 250} ${40 + Math.floor(i / 2) * 19})`}>
                  <rect width="14" height="12" fill={ZONE_INFO[k].color} fillOpacity={0.55} stroke={ZONE_INFO[k].color} />
                  <text x="22" y="10" fontSize="11.5" fill="#26292a">{ZONE_INFO[k].name} · {fmt(m.area[k] || 0, 0)} m²</text>
                </g>
              ))}
              {(() => {
                const yy = 52 + Math.ceil(zoneKeys.length / 2) * 19
                return (
                  <g transform={`translate(0 ${yy})`}>
                    <text y="10" fontSize="10.5" letterSpacing="1.6" fill="#5b5f58" fontWeight="600">SYMBOLS</text>
                    <g transform="translate(0 24)"><circle cx="7" cy="6" r="6" fill="#7c9a62" fillOpacity="0.55" stroke="#2f4a2f" /><text x="22" y="10" fontSize="11.5">Native tree (crown at {years} yrs)</text></g>
                    <g transform="translate(250 24)"><circle cx="7" cy="6" r="6" fill="#c19a62" fillOpacity="0.55" stroke="#2f4a2f" /><text x="22" y="10" fontSize="11.5">Fruit tree / cultivar</text></g>
                    <g transform="translate(0 44)"><circle cx="7" cy="6" r="6" fill="#3d5a3c" fillOpacity="0.55" stroke="#2f4a2f" /><text x="22" y="10" fontSize="11.5">Evergreen (pine, spruce)</text></g>
                    <g transform="translate(250 44)"><circle cx="7" cy="6" r="3.5" fill="#a2b87a" /><text x="22" y="10" fontSize="11.5">Shrub / hedge</text></g>
                    <g transform="translate(0 64)"><rect y="2" width="18" height="8" fill="#9a7b56" stroke="#3b3f40" /><text x="26" y="10" fontSize="11.5">Boardwalk {fmt(bw.length, 0)} m × {layout.boardwalkWidth.toFixed(1)} m</text></g>
                    <g transform="translate(250 64)"><line x1="0" x2="18" y1="6" y2="6" stroke="#b5483a" strokeWidth="1.6" strokeDasharray="6 2" /><text x="26" y="10" fontSize="11.5">Parcel boundary</text></g>
                    <g transform="translate(0 84)"><line x1="0" x2="18" y1="6" y2="6" stroke="#777" strokeDasharray="3 3" /><text x="26" y="10" fontSize="11.5">3 m setback guide (verify)</text></g>
                    <g transform="translate(250 84)"><line x1="0" x2="18" y1="6" y2="6" stroke="#2f7fd0" strokeDasharray="2 2" /><line x1="0" x2="18" y1="9" y2="9" stroke="#d98a1f" strokeDasharray="2 2" /><text x="26" y="10" fontSize="11.5">Water / sewer / electric (plan)</text></g>
                    <g transform="translate(0 104)"><line x1="0" x2="18" y1="6" y2="6" stroke="#a99c80" /><text x="26" y="10" fontSize="11.5">Contours 0.5 m (interpolated from spot heights)</text></g>
                  </g>
                )
              })()}
            </g>
          )
        })()}
        <g transform={`translate(0 ${H - OY * 2 - 150})`}>
          <line x1="0" x2={RIGHT - 20} y1="0" y2="0" stroke="#d9d4c7" />
          <text y="22" fontSize="10.5" letterSpacing="1.6" fill="#5b5f58" fontWeight="600">KEY FIGURES (MODEL)</text>
          {[
            [`Plot ${fmt(m.plotArea, 0)} m²`, `Built ${fmt(m.builtTotal, 0)} m² (plan: ${PLAN_BALANCE.built})`],
            [`Paved ${fmt(m.paved, 0)} m² (plan: ${PLAN_BALANCE.paved})`, `Decks & boardwalk ${fmt(m.decks, 0)} m²`],
            [`Biologically active ${fmt((m.biologicallyActive / m.plotArea) * 100, 1)} % (plan: ${PLAN_BALANCE.biologicallyActivePct})`, `Trees ${m.trees} · shrubs ${m.shrubs}`],
            [`Roof water ${fmt(m.rainYieldM3, 0)} m³/yr`, `Tanks ${fmt(m.tankLitres / 1000, 0)} m³`],
          ].map((r, i) => (
            <g key={i} transform={`translate(0 ${44 + i * 20})`}><text fontSize="12" fill="#26292a">{r[0]}</text><text x="260" fontSize="12" fill="#26292a">{r[1]}</text></g>
          ))}
          <text y="138" fontSize="10" fill="#8a8a80">Source: Projekt zagospodarowania działki 420 (2025, 1:500); traced boundary area {fmt(m.plotArea, 1)} m².</text>
        </g>
      </g>
    </svg>
  )
}

export function SitePlanModal() {
  const open = useStore((s) => s.panel.site)
  const openPanel = useStore((s) => s.openPanel)
  const ref = useRef<SVGSVGElement>(null)
  const optionId = useStore((s) => s.optionId)
  if (!open) return null
  const svgText = () => '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(ref.current!)
  const saveSvg = () => {
    const url = URL.createObjectURL(new Blob([svgText()], { type: 'image/svg+xml' }))
    download(`narewka-site-plan-${optionId}.svg`, url)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }
  const savePng = () => {
    const url = URL.createObjectURL(new Blob([svgText()], { type: 'image/svg+xml;charset=utf-8' }))
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      const hh = ref.current ? parseFloat(ref.current.getAttribute('height') || '0') : H0
      c.width = W * 2
      c.height = hh * 2
      const g = c.getContext('2d')!
      g.scale(2, 2)
      g.drawImage(img, 0, 0, W, hh)
      download(`narewka-site-plan-${optionId}.png`, c.toDataURL('image/png'))
      URL.revokeObjectURL(url)
    }
    img.src = url
  }
  return (
    <Modal wide title="Annotated site plan" sub="Top-down plan generated from the live model — boundary dimensions, contours, buildings, boardwalk, planting and utilities." onClose={() => openPanel('site', false)}>
      <div className="flex gap-2 border-b border-line px-6 py-2.5">
        <Btn tone="sage" onClick={saveSvg}>Download SVG</Btn>
        <Btn onClick={savePng}>Download PNG (2×)</Btn>
        <span className="ml-auto self-center text-[12px] text-ink-2">Follows the current option, phase and edits.</span>
      </div>
      <div className="overflow-auto p-4"><SitePlanSVG svgRef={ref} /></div>
    </Modal>
  )
}
