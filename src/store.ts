import { create } from 'zustand'
import { LAYOUTS, RECOMMENDED, cloneLayout, type Layout, type Structure, type Feature } from './data/layouts'
import { clamp, type V2 } from './lib/geometry'

export type CamMode = 'aerial' | 'iso' | 'human' | 'tour' | 'plan'
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type LeftTab = 'plan' | 'buildings' | 'landscape' | 'sustain' | 'phases'

export interface Layers {
  vegetation: boolean
  fences: boolean
  boardwalk: boolean
  utilities: boolean
  dimensions: boolean
  labels: boolean
  interiors: boolean // open roofs / cut-away view
  lights: boolean
  context: boolean
  second: boolean // reserved footprint of second dwelling
}

export interface Settings {
  releaseSecondDwelling: boolean
  featureSetback: number
  growthYears: number
  northOffset: number // bearing of sheet "up" from true north (deg)
  quality: 'medium' | 'high'
  boardwalkWidth: number
  precipMm: number
}

export const SEASON_DATE: Record<Season, { month: number; day: number }> = {
  spring: { month: 5, day: 15 },
  summer: { month: 6, day: 21 },
  autumn: { month: 10, day: 15 },
  winter: { month: 1, day: 15 },
}

export const VIEWPOINTS = [
  { id: 'terrace', name: 'On the terrace', pos: [12.0, 17.4] as V2, look: [22, 29] as V2, eyeY: undefined as number | undefined },
  { id: 'gate', name: 'At the entrance gate', pos: [23.5, -4.4] as V2, look: [14, 14] as V2 },
  { id: 'office', name: 'At the micro office', pos: [0, 0] as V2, look: [0, 0] as V2 },
  { id: 'wellness', name: 'At the gym & sauna', pos: [0, 0] as V2, look: [0, 0] as V2 },
  { id: 'bania', name: 'At the bania', pos: [0, 0] as V2, look: [0, 0] as V2 },
  { id: 'greenhouse', name: 'At the greenhouse', pos: [0, 0] as V2, look: [0, 0] as V2 },
  { id: 'house-living', name: 'Inside the house — living room', pos: [7.9, 19.2] as V2, look: [7.0, 13.5] as V2, eyeY: 0 },
  { id: 'house-kitchen', name: 'Inside the house — stair, dining & living', pos: [6.7, 14.2] as V2, look: [7.7, 20.4] as V2, eyeY: 0 },
  { id: 'house-loft', name: 'Inside the house — sleeping loft', pos: [7.3, 13.5] as V2, look: [7.5, 20.0] as V2, eyeY: 1.8, pitch: -0.1 },
  { id: 'garage', name: 'At the garage extension (from the drive)', pos: [14.6, 5.6] as V2, look: [7.3, 9.8] as V2 },
  { id: 'workshop', name: 'At the workshop', pos: [0, 0] as V2, look: [0, 0] as V2 },
  { id: 'pond', name: 'At the pond', pos: [0, 0] as V2, look: [0, 0] as V2, pitch: -0.36 },
  { id: 'meadow', name: 'In the meadow', pos: [14, 8.5] as V2, look: [24, 14] as V2 },
  { id: 'food', name: 'Food forest edge', pos: [30.6, 5.0] as V2, look: [26, 24] as V2 },
]

interface State {
  optionId: 'A' | 'B' | 'C'
  layout: Layout
  phase: number
  cam: CamMode
  camNonce: number
  viewpoint: string
  season: Season
  hour: number
  layers: Layers
  settings: Settings
  editMode: boolean
  selected: string | null
  selectedWp: number | null
  dragging: boolean
  tour: { playing: boolean; t: number; speed: number }
  panel: { site: boolean; compare: boolean; verify: boolean; plants: boolean; help: boolean }
  leftTab: LeftTab
  toast: string | null
  hovered: string | null
  vegVersion: number

  setOption: (id: 'A' | 'B' | 'C') => void
  resetLayout: () => void
  setPhase: (p: number) => void
  setCam: (m: CamMode) => void
  setViewpoint: (id: string) => void
  setSeason: (s: Season) => void
  setHour: (h: number) => void
  setNight: (n: boolean) => void
  toggleLayer: (k: keyof Layers) => void
  setSettings: (s: Partial<Settings>) => void
  setEdit: (b: boolean) => void
  select: (id: string | null) => void
  selectWp: (i: number | null) => void
  setDragging: (b: boolean) => void
  patchStructure: (id: string, p: Partial<Structure>) => void
  patchFeature: (id: string, p: Partial<Feature>) => void
  setBoardwalk: (pts: V2[]) => void
  moveWaypoint: (i: number, p: V2) => void
  addWaypoint: () => void
  removeWaypoint: (i: number) => void
  setTour: (t: Partial<State['tour']>) => void
  openPanel: (k: keyof State['panel'], v?: boolean) => void
  setLeftTab: (t: LeftTab) => void
  setHovered: (id: string | null) => void
  say: (msg: string) => void
  exportJSON: () => string
  importJSON: (txt: string) => boolean
}

const defaultLayers: Layers = {
  vegetation: true, fences: true, boardwalk: true, utilities: false, dimensions: false, labels: true,
  interiors: false, lights: true, context: true, second: true,
}
const defaultSettings: Settings = {
  releaseSecondDwelling: true, featureSetback: 1.0, growthYears: 9, northOffset: 0, quality: 'medium', boardwalkWidth: 1.2, precipMm: 600,
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

export const useStore = create<State>((set, get) => ({
  optionId: RECOMMENDED,
  layout: cloneLayout(LAYOUTS[RECOMMENDED]),
  phase: 5,
  cam: 'aerial',
  camNonce: 0,
  viewpoint: 'terrace',
  season: 'summer',
  hour: 19.0,
  layers: defaultLayers,
  settings: defaultSettings,
  editMode: false,
  selected: null,
  selectedWp: null,
  dragging: false,
  tour: { playing: false, t: 0, speed: 1.1 },
  panel: { site: false, compare: false, verify: false, plants: false, help: false },
  leftTab: 'plan',
  toast: null,
  hovered: null,
  vegVersion: 0,

  setOption: (id) =>
    set((s) => ({ optionId: id, layout: cloneLayout(LAYOUTS[id]), selected: null, selectedWp: null, vegVersion: s.vegVersion + 1, settings: { ...s.settings, boardwalkWidth: LAYOUTS[id].boardwalkWidth } })),
  resetLayout: () => {
    const id = get().optionId
    set((s) => ({ layout: cloneLayout(LAYOUTS[id]), selected: null, selectedWp: null, vegVersion: s.vegVersion + 1 }))
    get().say(`Option ${id} reset to its default layout`)
  },
  setPhase: (phase) => set((s) => ({ phase, vegVersion: s.vegVersion + 1 })),
  setCam: (cam) => set((s) => ({ cam, camNonce: s.camNonce + 1, tour: { ...s.tour, playing: cam === 'tour', t: cam === 'tour' ? 0 : s.tour.t }, selected: cam === 'plan' || cam === 'tour' ? s.selected : s.selected })),
  setViewpoint: (viewpoint) => set((s) => ({ viewpoint, cam: 'human', camNonce: s.camNonce + 1 })),
  setSeason: (season) => set({ season }),
  setHour: (hour) => set({ hour }),
  setNight: (n) => set({ hour: n ? 23 : 14 }),
  toggleLayer: (k) => set((s) => ({ layers: { ...s.layers, [k]: !s.layers[k] } })),
  setSettings: (p) =>
    set((s) => {
      const settings = { ...s.settings, ...p }
      let layout = s.layout
      if (p.boardwalkWidth !== undefined) layout = { ...layout, boardwalkWidth: p.boardwalkWidth }
      return { settings, layout, vegVersion: s.vegVersion + (p.releaseSecondDwelling !== undefined ? 1 : 0) }
    }),
  setEdit: (editMode) => set({ editMode, selected: editMode ? get().selected : get().selected, selectedWp: null }),
  select: (selected) => set({ selected, selectedWp: null }),
  selectWp: (selectedWp) => set({ selectedWp }),
  setDragging: (dragging) => set((s) => ({ dragging, vegVersion: dragging ? s.vegVersion : s.vegVersion + 1 })),
  patchStructure: (id, p) =>
    set((s) => ({
      layout: {
        ...s.layout,
        structures: s.layout.structures.map((o) =>
          o.id === id
            ? { ...o, ...p, w: clamp(p.w ?? o.w, o.wLim[0], o.wLim[1]), d: clamp(p.d ?? o.d, o.dLim[0], o.dLim[1]) }
            : o,
        ),
      },
      vegVersion: s.dragging ? s.vegVersion : s.vegVersion + 1,
    })),
  patchFeature: (id, p) =>
    set((s) => ({
      layout: { ...s.layout, features: s.layout.features.map((o) => (o.id === id ? { ...o, ...p } : o)) },
      vegVersion: s.dragging ? s.vegVersion : s.vegVersion + 1,
    })),
  setBoardwalk: (boardwalk) => set((s) => ({ layout: { ...s.layout, boardwalk }, vegVersion: s.vegVersion + 1 })),
  moveWaypoint: (i, p) =>
    set((s) => ({ layout: { ...s.layout, boardwalk: s.layout.boardwalk.map((q, k) => (k === i ? p : q)) } })),
  addWaypoint: () => {
    const { layout } = get()
    const pts = layout.boardwalk
    let best = 0
    let bl = 0
    for (let i = 0; i < pts.length - 1; i++) {
      const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])
      if (l > bl) { bl = l; best = i }
    }
    const m: V2 = [(pts[best][0] + pts[best + 1][0]) / 2, (pts[best][1] + pts[best + 1][1]) / 2]
    const next = [...pts.slice(0, best + 1), m, ...pts.slice(best + 1)]
    set((s) => ({ layout: { ...s.layout, boardwalk: next }, selectedWp: best + 1, selected: 'boardwalk', vegVersion: s.vegVersion + 1 }))
  },
  removeWaypoint: (i) => {
    const pts = get().layout.boardwalk
    if (pts.length <= 3) return get().say('A boardwalk needs at least 3 waypoints')
    set((s) => ({ layout: { ...s.layout, boardwalk: pts.filter((_, k) => k !== i) }, selectedWp: null, vegVersion: s.vegVersion + 1 }))
  },
  setTour: (t) => set((s) => ({ tour: { ...s.tour, ...t } })),
  openPanel: (k, v) => set((s) => ({ panel: { ...s.panel, [k]: v ?? !s.panel[k] } })),
  setLeftTab: (leftTab) => set({ leftTab }),
  setHovered: (hovered) => set({ hovered }),
  say: (toast) => {
    set({ toast })
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => set({ toast: null }), 3200)
  },
  exportJSON: () => {
    const s = get()
    return JSON.stringify(
      { app: 'narewka-japandi-sanctuary', version: 1, optionId: s.optionId, layout: s.layout, phase: s.phase, season: s.season, hour: s.hour, settings: s.settings, layers: s.layers },
      null,
      2,
    )
  },
  importJSON: (txt) => {
    try {
      const j = JSON.parse(txt)
      if (j.app !== 'narewka-japandi-sanctuary' || !j.layout?.structures) throw new Error('not a project file')
      set((s) => ({
        optionId: j.optionId ?? s.optionId, layout: j.layout, phase: j.phase ?? s.phase, season: j.season ?? s.season, hour: j.hour ?? s.hour,
        settings: { ...defaultSettings, ...(j.settings ?? {}) }, layers: { ...defaultLayers, ...(j.layers ?? {}) },
        selected: null, selectedWp: null, vegVersion: s.vegVersion + 1,
      }))
      get().say('Project configuration loaded')
      return true
    } catch (e) {
      get().say('Could not read that file: ' + (e as Error).message)
      return false
    }
  },
}))
