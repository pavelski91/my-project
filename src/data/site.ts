/**
 * SITE DATA — Narewka, ul. Adama Mickiewicza, dz. ewid. nr 420 (obręb 0019 Narewka, gm. Narewka)
 *
 * Source of truth: "Projekt zagospodarowania działki 420" (Dariusz Lipiszko, 02.04.2025, 1:500)
 * on a survey base map (mapa do celów projektowych, GK.6642.98.2025, PUWG 2000 strefa 8).
 *
 * HOW THE GEOMETRY WAS OBTAINED
 *  1. The PDF page (A3, 1:500) was rasterised at 200 dpi.
 *  2. The red dashed parcel boundary (A-B-C-D-E-F-G) was detected by colour threshold and
 *     its corners were read in pixel space.
 *  3. Pixel space -> metres. Nominal scale at 200 dpi/1:500 is 0.0635 m/px. The traced polygon area
 *     at that scale is 1357 m²; the plan states 1418.00 m² and the polygon scaled by 0.0649 m/px
 *     matches 1418 m² exactly, so 0.0649 m/px (≈2 % plot-scale error) is used. Verified on screen: all
 *     numbers below are reproduced by `PLOT_AREA` in the dashboard.
 *  4. Local coordinates: x = east, z = south (north is -z, assumed "north up" as on the survey sheet),
 *     origin = corner A (north-west corner of the parcel). Units: metres.
 *
 * UNCERTAINTY: boundary corners ±0.3 m, building footprints ±0.3 m, spot heights are read off the plan
 * ±0.1 m. Nothing here replaces a surveyor's staking-out.
 */

export const PX_TO_M = 0.0649
const px = (x: number, y: number): [number, number] => [(x - 80) * PX_TO_M, (y - 95) * PX_TO_M]

/** Parcel corners as labelled A..G on the plan. */
export const PLOT_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const
export const PLOT: [number, number][] = [
  px(80, 95), // A  NW
  px(690, 22), // B  N-NE (road side)
  px(695, 85), // C  NE
  px(583, 567), // D  E
  px(418, 672), // E  SE
  px(90, 708), // F  SW
  px(78, 678), // G  W
]

export const PLOT_AREA_STATED = 1418 // m², per plan "Bilans terenu inwestycji"

/** Bilans terenu from the plan, kept verbatim for the dashboard. */
export const PLAN_BALANCE = {
  plot: 1418,
  built: 70, // 2 × ~35 m² dwellings
  paved: 98, // access, paths, terrace
  green: 1250,
  biologicallyActivePct: 88.15,
  builtPct: 4.93,
}

/** Terrain: reading from the survey base (m a.s.l.). [x, z, h] in local metres. */
export const SPOT_HEIGHTS: [number, number, number][] = [
  [2.2, 1.0, 148.6],
  [0.9, -4.3, 148.7],
  [3.2, -2.6, 148.8],
  [5.75, 11.6, 148.2],
  [20.3, 2.2, 148.5],
  [31.0, 2.0, 148.3],
  [16.5, 14.6, 147.9],
  [20.7, 16.6, 147.8],
  [26.5, 14.2, 147.7],
  [38.6, -1.7, 147.3],
  [28.2, 25.3, 146.5],
  [18.9, 28.5, 146.8],
  [6.8, 41.4, 146.1],
  [19.5, 36.4, 145.4],
  [1.2, 37.5, 146.0],
  [17.2, 43.7, 144.4],
  [56.4, 25.1, 144.5],
]
export const TERRAIN_Y0 = 145.0 // y = elevation − 145

export const GROUND_FLOOR_LEFT = 148.1 // p.p.p. of left dwelling (plan note)
export const GROUND_FLOOR_RIGHT = 147.8

export const SITE_LAT = 52.93
export const SITE_LON = 23.78

export interface Box {
  x0: number
  z0: number
  x1: number
  z1: number
}

/** Existing house footprint (left dwelling), long axis N-S, from the PDF hatch. */
export const HOUSE_EXISTING: Box = { x0: 5.2, z0: 12.7, x1: 9.4, z1: 20.1 }
/** Planned extension (garage for 2 cars) behind the sleeping-loft end, i.e. on the NORTH side facing the entrance drive. (old note: +3.3 m so total length ≈ 10.7 m, matching the supplied floor plan (≈2.5 : 1). */
export const HOUSE_EXTENSION: Box = { x0: 5.2, z0: 9.4, x1: 9.4, z1: 12.7 }
/** Main terrace + pergola on the east long side (as in reference renders). */
export const TERRACE: Box = { x0: 9.4, z0: 16.4, x1: 14.2, z1: 23.6 }
/** Second dwelling shown on the plan (hatch on the right). Not part of this brief. */
export const SECOND_DWELLING: Box = { x0: 25.2, z0: 16.6, x1: 29.5, z1: 24.0 }
/** Existing tin garage (blaszak) 'g1' on the plot. */
export const SHED_EXISTING: Box = { x0: 2.0, z0: 22.2, x1: 5.4, z1: 26.8 }

/** Planned utility routes from the plan (blue = water Ø32 PE, orange = sewer Ø160 PVC, red = electric). */
export const UTILITIES = {
  waterLeft: [[9.3, -5.6], [9.3, 12.7]] as [number, number][],
  waterRight: [[34.0, -5.6], [28.8, 16.6]] as [number, number][],
  sewerLeft: [[7.9, -5.8], [7.9, 12.7]] as [number, number][],
  sewerRight: [[29.2, -5.8], [29.2, 16.6]] as [number, number][],
  electric: [[0.5, 0], [0.5, 12.3], [25.6, 12.8], [25.6, 16.6]] as [number, number][],
}

/** Entrance (zjazd) from the road on the north side + waste point, as on the plan. */
export const ENTRANCE = {
  gate: { x: 23.5, width: 4.0 },
  pedestrian: { x: 17.0 },
  service: { x: 12.5 }, // south side service wicket (proposal)
  apron: { x0: 20.0, x1: 29.2, depth: 5.5 }, // paved hardstand (proposal within the plan's 98 m² paved allowance)
  waste: { x: 31.8, z: -1.5, w: 2.4, d: 1.4 },
  /** drive from the vehicle gate to the garage (permeable pavers / gravel), centre line + width */
  drive: { pts: [[24.0, -0.8], [25.6, 2.0], [28.0, 3.9], [30.3, 4.7]] as [number, number][], width: 3.2 },
}

export const SITE_FACTS = {
  soilClass: 'Br / PsV — grunty brunatne (brown soils), pasture class V (read from the survey map; no soil survey available)',
  neighbours: 'Arable land RV/RIVb to the north & west, meadow ŁV to the south, neighbour dwelling & tin sheds west of the boundary',
  climate: 'Humid continental (Dfb), Podlasie — roughly USDA zone 5b–6a. Annual precipitation assumed 600 mm (editable).',
  buildingLine: 'Plan shows "nieprzekraczalna linia zabudowy" on the north (road) and east boundaries (6.00 m dimension on the east).',
}

/** Items the designer cannot confirm from the documents. Shown in the UI and README. */
export const VERIFY_ITEMS: { id: string; title: string; detail: string }[] = [
  { id: 'north', title: 'True north', detail: 'Assumed that the survey sheet is north-up. The sun path uses a configurable north offset in Settings.' },
  { id: 'setbacks', title: 'Setbacks to boundaries', detail: 'Plan shows building lines on the road and east side only. Defaults here: 3.0 m for habitable pavilions and 1.0 m for decks/features. Confirm with MPZP/WZ and Prawo budowlane (§12 WT) before final siting.' },
  { id: 'permit', title: 'Permits & built-area limit', detail: 'The plan allows 70 m² built area (two ~35 m² dwellings). Additional pavilions (office, gym/sauna, greenhouse, bania) need a legal route (zgłoszenie / pozwolenie, MPZP intensity limits). Not assumed.' },
  { id: 'second', title: 'Second dwelling footprint', detail: 'The PDF shows two dwellings. You confirmed the second one will not be built, so that land is released by default and used for the pavilions (switch it back in Settings → Use second-dwelling land). Plan utility routes to it are ignored in the checks.' },
  { id: 'shed', title: 'Existing tin garage', detail: 'Blue "g1" on the plot (~3.4 × 4.6 m) touches the planned extension. Masterplan assumes removal/relocation in Phase 1.' },
  { id: 'utilities', title: 'Utility capacity', detail: 'Water/sewer/electric routes are the plan\'s proposals (end at the dwellings). Branches for pavilions, sauna power load and drainage of bania/shower are unverified. Septic/sewer connection for the sauna shower, outdoor shower and bania drainage must be checked.' },
  { id: 'soil', title: 'Soil, groundwater & infiltration', detail: 'No geotechnical data. Rain-garden/pond/foundation (screw piles) assumptions need a percolation test and a groundwater check; SE corner is the lowest point (145.4–146.5 m).' },
  { id: 'trees', title: 'Existing vegetation', detail: 'The plan marks no trees on the plot; the base is treated as grassland (pasture). Confirm on site.' },
  { id: 'heights', title: 'Spot heights', detail: 'Terrain is interpolated from ~17 survey spot heights (±0.1 m reading error), not from a DTM.' },
  { id: 'fire', title: 'Fire & sauna safety', detail: 'Wood-fired stove/tub chimney clearances, distance to neighbouring boundaries, and spark protection require local fire-safety verification.' },
]
