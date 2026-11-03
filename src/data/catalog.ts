/** Descriptions shown in the inspector for every selectable object. */
export interface CatalogEntry {
  title: string
  subtitle: string
  phase: number
  description: string
  materials: string[]
  notes: string[]
  status: 'existing' | 'planned' | 'proposed'
}

export const CATALOG: Record<string, CatalogEntry> = {
  house: {
    title: 'Existing house',
    subtitle: 'Left dwelling on plot 420 — physically built',
    phase: 0,
    status: 'existing',
    description:
      'A compact gabled timber house, long axis north–south, ground-floor level 148.10 m a.s.l. (p.p.p. on the plan). Floor plan (supplied): entrance on the west wall next to the kitchen, bathroom (WC, vanity, shower) behind a partition, kitchen galley along its wall, round dining table, living room with corner sofa and wood stove facing the terrace; sleeping loft above the bathroom. Black standing-seam roof, vertical timber cladding, dark-framed glazing, a sleeping loft over the bathroom and a high ceiling over the living space (see supplied section).',
    materials: ['Black standing-seam steel roof, ~40° pitch', 'Vertical timber cladding: charred-look long walls, warm timber gables', 'Dark aluminium window frames, large sliding door to the terrace', 'Light timber and plaster interior, black steel stair/balustrade'],
    notes: ['Footprint ≈ 4.2 × 7.4 m measured from the plan hatch (±0.3 m).', 'Water Ø32 PE, sewer Ø160 PVC and electricity enter from the north (plan).', 'This object stays fixed in every masterplan option.'],
  },
  extension: {
    title: 'Planned extension — parents’ bedroom (+ kids’ loft above)',
    subtitle: 'Phase 1 — bedroom below; reading nook + 2nd bedroom in the loft above',
    phase: 1,
    status: 'planned',
    description:
      'A 3.3 m extension at the north end of the house, next to the bathroom (floor plan: bedroom with a double bed and a built-in wardrobe, door from the entrance hall). Downstairs: bedroom. Upstairs: the loft above the bathroom becomes a reading nook and continues over the bedroom as a second bedroom. Same roof, cladding and window language; shown in slightly fresher timber so the two stages are readable.',
    materials: ['Continuation of the existing roof (black standing seam, 40°) and vertical timber cladding', 'Sliding window-door to the garden and a window above the bed head', 'Oak floor, whitewashed timber ceiling'],
    notes: ['Position (north end) follows the supplied floor plan, where the bedroom is on the side opposite the living room and terrace — please confirm.', 'Water Ø32 / sewer Ø160 on the plan enter near the north end of the house; check their routes before building.', 'Adds ≈ 14 m² to the built area. The development plan lists 70 m² for both dwellings — verify.'],
  },
  terrace: {
    title: 'Main terrace & pergola',
    subtitle: 'Phase 1 — start of the boardwalk',
    phase: 1,
    status: 'planned',
    description: 'A timber terrace along the east side of the extension with a black steel pergola frame (as in the reference renders), outdoor dining and lounge seating. Level with the interior floor; the boardwalk leaves from its south-east corner.',
    materials: ['Weathered larch or thermowood decking, open joints', 'Black powder-coated steel pergola', 'Surface-mounted low-glare wall lights'],
    notes: ['Deck level 148.06 m; gradient down to the garden is carried by the boardwalk.', 'Roof water from the house is routed to the rain tanks north-east of the house.'],
  },
  shed: {
    title: 'Existing tin garage (blaszak)',
    subtitle: 'Phase 0 only — assumed removed in Phase 1',
    phase: 0,
    status: 'existing',
    description: 'The plan shows an existing metal garage (g1) on the plot, ~3.4 × 4.6 m. It touches the footprint of the planned extension, so the masterplan assumes it is dismantled or moved.',
    materials: ['Corrugated sheet metal'],
    notes: ['Verify ownership, condition and whether it can be reused as tool storage elsewhere.'],
  },
  second: {
    title: 'Second dwelling footprint (plan)',
    subtitle: 'Reserved — not part of this masterplan',
    phase: 0,
    status: 'proposed',
    description: 'The development plan "Dwa budynki mieszkalne jednorodzinne" shows two houses. The right footprint (~4.3 × 7.4 m, floor level 147.80 m) is kept clear and shown as a ghost. Release it in Settings if you want to use that part of the land.',
    materials: [],
    notes: ['Status unknown — please confirm whether it is planned, sold or dropped.'],
  },
  boardwalk: {
    title: 'Continuous boardwalk',
    subtitle: 'Phase 2 — House → Office → Gym & Sauna → Bania',
    phase: 2,
    status: 'proposed',
    description:
      'A Japanese-style timber walkway on slender steel piles. It starts level with the terrace and then follows the slope from above, never descending faster than 1:12.5 (8 %), so it floats higher above the ground downhill instead of becoming a staircase. Rails appear only where the deck is higher than 0.8 m. Low warm path lights alternate from side to side.',
    materials: ['Thermowood or larch boards 28 mm, 135 mm wide, 35 mm open joints (non-slip, reeded top)', 'Hot-dip galvanised/black steel bearers and screw piles — no concrete strip footings, soil left intact', 'Low-level 2200 K LED path lights, dark-sky compliant'],
    notes: ['Width is adjustable from 1.0 to 1.4 m.', 'Maximum gradient and length are reported in the sustainability panel.', 'Drag waypoints in Edit mode to reshape the route; the endpoints stay on the terrace and the last pavilion.'],
  },
  fence: {
    title: 'Boundary fence & gates',
    subtitle: 'Phase 2 — natural timber, dark steel details',
    phase: 2,
    status: 'proposed',
    description:
      'Edge-specific fencing: 1.7 m vertical-slat screen toward the road and west neighbours; 1.5 m horizontal slats toward the east field; 1.2 m open post-and-rail toward the south meadow. All timber screens leave a 13 cm gap at the bottom for hedgehogs and small mammals. Dark steel posts and gate frames.',
    materials: ['Larch or Scots-pine boards, untreated, left to weather', 'Powder-coated steel posts 80 × 80 mm'],
    notes: ['Vehicle gate 4 m (sliding), pedestrian gate 1.0 m on the road edge; service wicket in the south fence.', 'Fence height and distance to the public road are subject to local rules — verify.'],
  },
  office: {
    title: 'Micro office',
    subtitle: 'Phase 3 — first destination on the boardwalk',
    phase: 3,
    status: 'proposed',
    description:
      'A single-volume pavilion with a mono-pitch roof that rises to a deep, shaded eave over a full-width window. Desk and ergonomic chair face the planting; built-in shelving runs along the back wall; the door opens onto the boardwalk landing. Insulated for year-round use.',
    materials: ['Charred-look vertical timber cladding', 'Light timber and plaster interior', 'Dark aluminium frames, triple glazing', 'Black standing-seam roof matching the house'],
    notes: ['Starts at ≈ 10 m². Floor sits level with the boardwalk where it docks.', 'Heating: 600–1000 W electric or infrared panel (to be sized).'],
  },
  wellness: {
    title: 'Private gym & sauna pavilion',
    subtitle: 'Phase 4 — wellness',
    phase: 4,
    status: 'proposed',
    description:
      'A low gabled pavilion along the boardwalk. West end: gym with strength rack, bench and a yoga/stretching zone facing a full-height window. Centre: changing room. East end: Finnish sauna with two bench levels and a stainless chimney, opening to a relaxation deck with an outdoor shower and a lounger.',
    materials: ['Vertical timber cladding, warm gables', 'Sauna lined in thermally modified spruce/aspen', 'Rubber gym flooring, light timber floors', 'Large glazed south and west faces'],
    notes: ['Starts at ≈ 28 m² (adjustable 20–40 m²).', 'Stove chimney clearances and boundary distances need fire-safety verification.', 'Outdoor shower and bania drainage must be connected to a permitted system.'],
  },
  bania: {
    title: 'Bania — wood-fired bathing tub',
    subtitle: 'Phase 4 — next to the sauna deck',
    phase: 4,
    status: 'proposed',
    description:
      'A cedar tub (Ø ≈ 1.9 m) with an external wood-fired heater, set on a raised deck. Vertical timber screens give privacy to the south and east; lantern posts and a bench create the evening mood. Reached from the boardwalk and, in the recommended layout, a few steps from the sauna door.',
    materials: ['Cedar or larch tub with steel hoops', 'Stainless heater and flue', 'Thermowood deck on steel piles'],
    notes: ['Water is drained to an infiltration trench / reed bed after cooling — verify with local rules.', 'Stay outside the 3 m fire distance to timber boundary fences if possible.'],
  },
  greenhouse: {
    title: 'Greenhouse',
    subtitle: 'Phase 5 — sun-driven siting',
    phase: 5,
    status: 'proposed',
    description:
      'A glazed pitched-roof greenhouse with slender dark framing, ridge running east–west so the long glazed face looks south. Raised beds on both sides, a potting bench, roof-vent flaps for natural ventilation and a rain barrel fed from the gutters. The dashboard reports modelled winter, spring and summer sun hours for the south wall.',
    materials: ['Black powder-coated aluminium frame', '4 mm toughened glazing (or polycarbonate)', 'Charred timber plinth'],
    notes: ['Starts at ≈ 13 m². Compost bays and water are placed within reach.', 'Do not plant trees within ~8 m south of the greenhouse — the planting generator keeps this zone clear.'],
  },
}

CATALOG.workshop = {
  title: 'Workshop & tool house',
  subtitle: 'Phase 2 — built first, used through the whole project',
  phase: 2,
  status: 'proposed',
  description:
    'A small mono-pitch timber workshop (≈ 10 m²) for garden tools and light carpentry: double barn doors on the entrance side, a window over a solid workbench with vise, a pegboard tool wall, shelves and a lean-to firewood store on the east gable. Insulated and wired so it can be used in winter; it also stores materials during the build.',
  materials: ['Charred-look vertical timber cladding, black standing-seam roof', 'Timber barn doors on steel hinges', 'Birch-ply interior, oak workbench top', 'Open timber lean-to for firewood'],
  notes: ['Starts at 3.6 × 2.8 m. Built early (Phase 2) so tools, mower and building materials have a dry home.', 'Needs 230 V + 400 V supply if a saw/planer is planned — verify capacity.', 'Keep fuel, paints and chainsaw in a ventilated cabinet; check distance rules for sheds ≤ 35 m².'],
}
CATALOG.carport = {
  title: 'Carport for 2 cars (wiata garażowa)',
  subtitle: 'Phase 2 — far east of the plot, on a drive from the gate',
  phase: 2,
  status: 'proposed',
  description: 'An open carport ≈ 5.6 × 5.2 m for two cars side by side, on slender black steel posts with a low standing-seam roof draining to a slatted timber back wall with storage, wall charger and bike hooks. It stands apart from the house in the east of the plot; a ≈ 3.2 m permeable-paver drive leads from the vehicle gate straight into it.',
  materials: ['Black powder-coated steel posts and beams', 'Standing-seam roof matching the house', 'Vertical timber slat back wall', 'Permeable paver floor with concrete wheel strips'],
  notes: ['Counts as roofed built area (≈ 29 m²). Open carports are often treated more leniently than a garage, but rules differ per municipality — verify.', 'Roof water goes to a gutter on the back wall and can feed a rain tank.'],
}

CATALOG.bay = {
  title: 'Family annex — kitchen · dining · living',
  subtitle: 'Phase 1 — new wing east of the house, 4.2 × 5.9 m',
  phase: 1,
  status: 'planned',
  description:
    'A new gabled wing dostawione to the east side of the existing house, parallel roof, same cladding and pitch. Inside ≈ 22 m² of open space: kitchen along the north wall (fridge, oven tower, 4-ring hob with hood, sink) with a 2.2 m island and four stools, a round dining table for six, and the living area with the sofa, armchair and wood stove by the big south window. The east wall is a glazed sliding wall to the terrace; the covered loggia runs along the south window.',
  materials: ['Same black standing-seam roof (40°) and vertical timber cladding as the house', 'Glazed sliding wall to the terrace, big south window', 'Oak floor, whitewashed timber ceiling with tie beams'],
  notes: ['Footprint 4.2 × 5.9 = 24.8 m². With the house (31.1) and the poured-slab extension (13.9) the building is 69.8 m² — just under the WZ limit of 70 m². Do not add anything else to the footprint.', 'Roof valley where the two gables meet needs a proper gutter detail.', 'Position and size are a design proposal for the architect to confirm.'],
}

export const FEATURE_NOTES: Record<string, { title: string; notes: string[] }> = {
  firepit: { title: 'Fire pit', notes: ['Stone ring with log seats under birch.', 'Keep 5 m from timber and trees; local open-fire rules apply.'] },
  hammock: { title: 'Hammock', notes: ['Two timber posts (or mature pines once established).'] },
  meditation: { title: 'Japanese meditation corner', notes: ['Raked gravel, three stones, a low bench and a cloud-pruned Scots pine (niwaki). Small gravel area — the one deliberate gravel feature.'] },
  dining: { title: 'Outdoor dining', notes: ['Table and chairs on the main terrace.'] },
  toolshed: { title: 'Tool storage', notes: ['Small timber shed for tools, ≈ 2.3 m².'] },
  tanks: { title: 'Rain tanks', notes: ['1000 L IBC tanks clad in timber slats. Capacity shown in the dashboard.', 'Overflow goes to the rain garden (not to the road).'] },
  bikes: { title: 'Bicycle shelter', notes: ['Open timber shelter near the pedestrian gate.'] },
  compost: { title: 'Compost bays', notes: ['Three timber bays — fresh, maturing, finished.', 'Kept near the greenhouse and kitchen beds.'] },
  pond: { title: 'Wildlife pond', notes: ['Shallow-edged, unlined or clay-lined, no fish; amphibian and dragonfly habitat.', 'Depth ≈ 0.6 m at the deepest. Needs soil/groundwater check.'] },
  raingarden: { title: 'Rain garden', notes: ['Shallow planted basin that takes roof overflow and lets it soak in.', 'Needs an infiltration test; may need a gravel base.'] },
  beds: { title: 'Raised vegetable beds', notes: ['Three larch beds, 1.2 m wide, no-dig with compost mulch.'] },
  habitat: { title: 'Habitat features', notes: ['Log pile, standing deadwood, insect hotel and bird box.'] },
  platform: { title: 'Woodland seating platform', notes: ['Small raised timber platform with a bench, for forest-bathing pauses.'] },
}

export const ZONE_INFO: Record<string, { name: string; desc: string; color: string }> = {
  woodland: { name: 'Native woodland', desc: 'Scots pine, silver birch, rowan, aspen, hazel and juniper over a fern/bilberry floor. Light canopy so the understorey flowers.', color: '#587046' },
  screen: { name: 'Hedgerow / screen', desc: 'Layered 3–4 m screen of hazel, hawthorn, guelder rose and dog rose with birch and rowan — privacy and nesting cover.', color: '#6a7e4b' },
  meadow: { name: 'Wildflower meadow', desc: 'Low-fertility, twice-yearly cut meadow with local ecotype seed: ox-eye daisy, yarrow, cornflower, knapweed, red clover.', color: '#c8b462' },
  foodforest: { name: 'Food forest', desc: 'Antonówka apple, plum, pear, sour cherry over currants, gooseberry, honeyberry and perennials.', color: '#8a9650' },
  berries: { name: 'Soft fruit', desc: 'Rows of currants, gooseberries, honeyberries and raspberries, mulched with wood chip.', color: '#8d7a4c' },
  kitchen: { name: 'Herb & kitchen garden', desc: 'Perennial herbs, rhubarb and vegetables close to the greenhouse and compost.', color: '#7a6246' },
  shade: { name: 'Shade garden', desc: 'Ferns, bilberry and moss under rowan and birch.', color: '#4c6b46' },
  wetland: { name: 'Wetland margin', desc: 'Sedges, marsh marigold, iris and alder around the pond and rain garden.', color: '#4f7867' },
}
