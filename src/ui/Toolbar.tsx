import { useRef, useState, useEffect, type ReactNode } from 'react'
import { useStore, VIEWPOINTS, type CamMode, type Season } from '../store'
import { sceneApi } from '../scene/SceneRoot'
import { Btn, cx } from './kit'
import { sunPosition } from '../lib/solar'
import { SEASON_DATE } from '../store'
import { deg } from '../lib/geometry'

const CAMS: { id: CamMode; label: string; title: string }[] = [
  { id: 'aerial', label: 'Aerial', title: 'Whole property from above — boundaries and all structures' },
  { id: 'iso', label: 'Isometric', title: 'Orthographic architectural-model view' },
  { id: 'human', label: 'Eye level', title: 'Walk the site at human scale' },
  { id: 'tour', label: 'Boardwalk tour', title: 'Follow the boardwalk: house → office → gym/sauna → bania' },
  { id: 'plan', label: 'Plan', title: 'Top-down orthographic plan, north up' },
]
const SEASONS: { id: Season; label: string }[] = [
  { id: 'spring', label: 'Spring' },
  { id: 'summer', label: 'Summer' },
  { id: 'autumn', label: 'Autumn' },
  { id: 'winter', label: 'Winter' },
]

export function download(name: string, href: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function Menu({ label, children, title }: { label: ReactNode; children: ReactNode; title?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [open])
  return (
    <div ref={ref} className="relative">
      <Btn active={open} title={title} onClick={() => setOpen(!open)}>{label} ▾</Btn>
      {open && <div className="absolute bottom-[calc(100%+8px)] right-0 z-30 min-w-[210px] rounded-lg border border-line bg-paper p-1.5 shadow-xl" onClick={() => setOpen(false)}>{children}</div>}
    </div>
  )
}
const Item = ({ children, onClick, on }: { children: ReactNode; onClick: () => void; on?: boolean }) => (
  <button onClick={onClick} className="flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left text-[12.5px] hover:bg-paper-2">
    <span>{children}</span>
    {on !== undefined && <span className={cx('h-2.5 w-2.5 rounded-full border', on ? 'border-sage-d bg-sage-d' : 'border-line')} />}
  </button>
)

export function Toolbar() {
  const cam = useStore((s) => s.cam)
  const setCam = useStore((s) => s.setCam)
  const viewpoint = useStore((s) => s.viewpoint)
  const setViewpoint = useStore((s) => s.setViewpoint)
  const season = useStore((s) => s.season)
  const setSeason = useStore((s) => s.setSeason)
  const hour = useStore((s) => s.hour)
  const setHour = useStore((s) => s.setHour)
  const layers = useStore((s) => s.layers)
  const toggleLayer = useStore((s) => s.toggleLayer)
  const edit = useStore((s) => s.editMode)
  const setEdit = useStore((s) => s.setEdit)
  const openPanel = useStore((s) => s.openPanel)
  const say = useStore((s) => s.say)
  const optionId = useStore((s) => s.optionId)
  const file = useRef<HTMLInputElement>(null)
  const { month, day } = SEASON_DATE[season]
  const alt = deg(sunPosition(month, day, hour).alt)
  const night = alt < -4
  const hh = Math.floor(hour)
  const mm = Math.round((hour - hh) * 60)

  const shot = (scale: number) => {
    const url = sceneApi.screenshot(scale)
    if (!url) return say('Screenshot is not ready yet')
    download(`narewka-${optionId}-${cam}-${season}${scale > 1 ? '@2x' : ''}.png`, url)
    say('Screenshot saved')
  }
  const saveJson = () => {
    const blob = new Blob([useStore.getState().exportJSON()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    download(`narewka-masterplan-${optionId}.json`, url)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    say('Configuration saved as JSON')
  }
  const loadJson = (f: File | undefined) => {
    if (!f) return
    f.text().then((t) => useStore.getState().importJSON(t))
  }

  const Divider = () => <i className="mx-1 h-5 w-px bg-line" />
  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-20 w-[min(900px,calc(100%-24px))] -translate-x-1/2 rounded-xl border border-line bg-paper/95 p-2 shadow-lg backdrop-blur">
      <div className="flex flex-wrap items-center gap-1.5">
        {CAMS.map((c) => (
          <Btn key={c.id} className="!px-2" active={cam === c.id} title={c.title} onClick={() => setCam(c.id)}>{c.label}</Btn>
        ))}
        <Divider />
        <Btn active={edit} onClick={() => setEdit(!edit)} title="Move, rotate and resize proposed structures; reshape the boardwalk">✎ Edit</Btn>
        <Btn onClick={() => openPanel('site', true)} title="Annotated top-down site plan (exportable SVG)">Site plan</Btn>
        <Btn onClick={() => openPanel('compare', true)} title="Compare the three options">Compare</Btn>
        <span className="ml-auto flex items-center gap-1.5">
          <Menu label="Export" title="Screenshot, save and load">
            <Item onClick={() => shot(1)}>📷 Screenshot (PNG)</Item>
            <Item onClick={() => shot(2)}>📷 Screenshot 2× resolution</Item>
            <Item onClick={() => openPanel('site', true)}>Annotated site plan (SVG / PNG)…</Item>
            <div className="my-1 border-t border-line" />
            <Item onClick={saveJson}>Save configuration (JSON)</Item>
            <Item onClick={() => file.current?.click()}>Load configuration…</Item>
          </Menu>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { loadJson(e.target.files?.[0]); e.target.value = '' }} />
          <Btn onClick={() => openPanel('help', true)} title="Controls & help">?</Btn>
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 border-t border-line pt-1.5">
        <Btn active={night} onClick={() => useStore.getState().setNight(!night)} title="Toggle day / night">{night ? '☾ Night' : '☀ Day'}</Btn>
        <div className="flex items-center gap-2 px-1">
          <input type="range" min={4} max={22} step={0.25} value={hour} onChange={(e) => setHour(parseFloat(e.target.value))} className="w-[96px]" aria-label="Solar time" />
          <span className="w-[74px] text-[11.5px] tabular-nums text-ink-2">{String(hh).padStart(2, '0')}:{String(mm).padStart(2, '0')} · {alt > 0 ? `${alt.toFixed(0)}°` : 'below'}</span>
        </div>
        <Divider />
        {SEASONS.map((s) => <Btn key={s.id} className="!px-2" active={season === s.id} onClick={() => setSeason(s.id)}>{s.label}</Btn>)}
        <Divider />
        <span className="ml-auto" />
        <Menu label="Layers" title="Show / hide layers">
          {(['vegetation', 'boardwalk', 'fences', 'dimensions', 'labels', 'utilities', 'interiors', 'lights', 'context'] as const).map((k) => (
            <Item key={k} on={layers[k]} onClick={() => toggleLayer(k)}>{({ vegetation: 'Vegetation', boardwalk: 'Boardwalk', fences: 'Fences & gates', dimensions: 'Dimensions', labels: 'Name tags', utilities: 'Utility routes', interiors: 'Open roofs', lights: 'Night lights', context: 'Surroundings' } as Record<string, string>)[k]}</Item>
          ))}
        </Menu>
      </div>
    </div>
  )
}

export function TourBar() {
  const cam = useStore((s) => s.cam)
  const tour = useStore((s) => s.tour)
  const setTour = useStore((s) => s.setTour)
  const setCam = useStore((s) => s.setCam)
  const layout = useStore((s) => s.layout)
  if (cam !== 'tour') return null
  const stops = ['House terrace', ...layout.structures.filter((s) => s.kind !== 'greenhouse').sort((a, b) => a.phase - b.phase).map((s) => s.label.split(' (')[0])]
  const idx = Math.min(stops.length - 1, Math.floor(tour.t * stops.length))
  return (
    <div className="pointer-events-auto absolute left-1/2 top-3 z-20 w-[min(620px,calc(100%-24px))] -translate-x-1/2 rounded-xl border border-line bg-paper/95 p-3 shadow-lg backdrop-blur">
      <div className="flex items-center gap-3">
        <Btn active onClick={() => setTour({ playing: !tour.playing, t: tour.t >= 0.999 ? 0 : tour.t })}>{tour.playing ? '❚❚ Pause' : '▶ Play'}</Btn>
        <input type="range" min={0} max={1} step={0.001} value={tour.t} onChange={(e) => setTour({ t: parseFloat(e.target.value), playing: false })} className="flex-1" aria-label="Tour position" />
        <select value={tour.speed} onChange={(e) => setTour({ speed: parseFloat(e.target.value) })} className="rounded-md border border-line bg-card px-1.5 py-1 text-[12px]">
          <option value={0.6}>Slow</option><option value={1.1}>Walk</option><option value={2.2}>Fast</option>
        </select>
        <Btn onClick={() => setCam('aerial')}>Exit</Btn>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11.5px] text-ink-2">
        {stops.map((s, i) => (
          <span key={s} className={cx('rounded-full px-2 py-0.5', i === idx ? 'bg-sage-d text-white' : '')}>{i + 1}. {s}</span>
        ))}
      </div>
    </div>
  )
}

export function Hints() {
  const cam = useStore((s) => s.cam)
  const edit = useStore((s) => s.editMode)
  const toast = useStore((s) => s.toast)
  const viewpoint = useStore((s) => s.viewpoint)
  const setViewpoint = useStore((s) => s.setViewpoint)
  return (
    <>
      {cam === 'human' && (
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          <select value={viewpoint} onChange={(e) => setViewpoint(e.target.value)} className="pointer-events-auto w-[200px] rounded-md border border-line bg-paper/95 px-2 py-1.5 text-[12px] shadow">
            {VIEWPOINTS.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <div className="pointer-events-none rounded-lg border border-line bg-paper/90 px-3 py-2 text-[12px] text-ink-2 shadow">
            Drag to look · <b>W A S D</b> / arrows walk<br />
            <b>Shift</b> run · scroll to step
          </div>
        </div>
      )}
      {edit && cam !== 'human' && cam !== 'tour' && (
        <div className="pointer-events-none absolute bottom-[132px] left-3 z-10 max-w-[360px] rounded-lg border border-sage-d bg-sage-d px-3 py-2 text-[12px] leading-snug text-white shadow">
          Edit mode · drag a pavilion or feature on the ground · <b>R</b> rotate · <b>Esc</b> deselect · to reshape the boardwalk select it and drag its handles
        </div>
      )}
      {toast && <div className="pointer-events-none absolute left-1/2 top-16 z-30 -translate-x-1/2 rounded-full border border-line bg-ink px-4 py-2 text-[12.5px] text-white shadow-lg">{toast}</div>}
    </>
  )
}
