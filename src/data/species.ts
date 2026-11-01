export type Arch = 'pine' | 'spruce' | 'birch' | 'rowan' | 'broad' | 'fruit' | 'shrub' | 'juniper' | 'fern'

export interface Species {
  id: string
  name: string
  latin: string
  pl: string
  arch: Arch
  native: boolean
  edible?: boolean
  /** mature height range in metres (shrubs: mature spread height) */
  h: [number, number]
  tint: string
  role: string
}

/** Species chosen for Podlasie (USDA ≈ 5b–6a). "native" = indigenous in NE Poland; cultivars are listed as non-native by design. */
export const SPECIES: Record<string, Species> = {
  pine: { id: 'pine', name: 'Scots pine', latin: 'Pinus sylvestris', pl: 'sosna zwyczajna', arch: 'pine', native: true, h: [11, 17], tint: '#ffffff', role: 'Structure tree; evergreen backbone, deep rooting, habitat for crested tits and red squirrels' },
  spruce: { id: 'spruce', name: 'Norway spruce', latin: 'Picea abies', pl: 'świerk pospolity', arch: 'spruce', native: true, h: [10, 15], tint: '#f2f6f2', role: 'Winter windbreak and bird shelter, used sparingly on the north edge' },
  birch: { id: 'birch', name: 'Silver birch', latin: 'Betula pendula', pl: 'brzoza brodawkowata', arch: 'birch', native: true, h: [9, 14], tint: '#ffffff', role: 'Light-canopy pioneer; > 300 insect species; white stems for the Japandi palette' },
  rowan: { id: 'rowan', name: 'Rowan', latin: 'Sorbus aucuparia', pl: 'jarząb pospolity', arch: 'rowan', native: true, edible: true, h: [5, 9], tint: '#ffffff', role: 'Spring blossom, autumn berries for thrushes and waxwings' },
  aspen: { id: 'aspen', name: 'Aspen', latin: 'Populus tremula', pl: 'topola osika', arch: 'broad', native: true, h: [8, 13], tint: '#f4ffe8', role: 'Shimmering leaves; food plant for hawkmoth caterpillars' },
  alder: { id: 'alder', name: 'Black alder', latin: 'Alnus glutinosa', pl: 'olsza czarna', arch: 'broad', native: true, h: [7, 12], tint: '#e6f2e6', role: 'Wet-tolerant; used near the rain garden / pond (nitrogen fixer)' },
  birdcherry: { id: 'birdcherry', name: 'Bird cherry', latin: 'Prunus padus', pl: 'czeremcha zwyczajna', arch: 'rowan', native: true, edible: true, h: [5, 8], tint: '#f2fff2', role: 'Scented spring blossom, early bee forage' },
  hazel: { id: 'hazel', name: 'Hazel', latin: 'Corylus avellana', pl: 'leszczyna pospolita', arch: 'shrub', native: true, edible: true, h: [2.8, 4.2], tint: '#e2f0d2', role: 'Shrub layer, nuts, catkins feed early bees; coppiced for pea sticks' },
  hawthorn: { id: 'hawthorn', name: 'Hawthorn', latin: 'Crataegus monogyna', pl: 'głóg jednoszyjkowy', arch: 'shrub', native: true, h: [2.5, 4.0], tint: '#d7ecc3', role: 'Thorny hedge; nesting site and berries' },
  guelder: { id: 'guelder', name: 'Guelder rose', latin: 'Viburnum opulus', pl: 'kalina koralowa', arch: 'shrub', native: true, h: [2.0, 3.4], tint: '#d3e6bd', role: 'Moist soils; berries for winter birds' },
  dogrose: { id: 'dogrose', name: 'Dog rose', latin: 'Rosa canina', pl: 'róża dzika', arch: 'shrub', native: true, edible: true, h: [1.6, 2.6], tint: '#d9ebc4', role: 'Hips, pollinator forage, thorny wildlife hedge' },
  elder: { id: 'elder', name: 'Elder', latin: 'Sambucus nigra', pl: 'bez czarny', arch: 'shrub', native: true, edible: true, h: [2.5, 4.0], tint: '#ddeec8', role: 'Flowers and berries; fast screening' },
  juniper: { id: 'juniper', name: 'Common juniper', latin: 'Juniperus communis', pl: 'jałowiec pospolity', arch: 'juniper', native: true, h: [1.8, 3.4], tint: '#ffffff', role: 'Evergreen structure, winter berries; Japandi "niwaki" accent' },
  bilberry: { id: 'bilberry', name: 'Bilberry / lingonberry mat', latin: 'Vaccinium myrtillus / vitis-idaea', pl: 'borówka czarna / brusznica', arch: 'fern', native: true, edible: true, h: [0.3, 0.5], tint: '#cfe3b8', role: 'Forest-floor edible ground cover under pines (needs acidic soil — verify)' },
  fern: { id: 'fern', name: 'Wood fern', latin: 'Dryopteris filix-mas', pl: 'nasięźrzał / paproć samcza', arch: 'fern', native: true, h: [0.6, 1.0], tint: '#c4e0b0', role: 'Shade layer, moisture retention' },
  apple: { id: 'apple', name: 'Apple (Antonówka)', latin: 'Malus domestica', pl: 'jabłoń (Antonówka)', arch: 'fruit', native: false, edible: true, h: [3.8, 5.2], tint: '#ffffff', role: 'Heritage Polish cultivar, frost-hardy to −30 °C, blossom for bees' },
  pear: { id: 'pear', name: 'Pear (Faworytka)', latin: 'Pyrus communis', pl: 'grusza (Faworytka)', arch: 'fruit', native: false, edible: true, h: [4.2, 5.8], tint: '#f2ffe8', role: 'Hardy dessert pear, spring blossom' },
  plum: { id: 'plum', name: 'Plum (Węgierka)', latin: 'Prunus domestica', pl: 'śliwa (Węgierka)', arch: 'fruit', native: false, edible: true, h: [3.8, 5.0], tint: '#f0fae8', role: 'Hardy plum, self-fertile' },
  sourcherry: { id: 'sourcherry', name: 'Sour cherry', latin: 'Prunus cerasus', pl: 'wiśnia', arch: 'fruit', native: false, edible: true, h: [3.0, 4.2], tint: '#eaf8e0', role: 'Very hardy, early blossom' },
  currant: { id: 'currant', name: 'Blackcurrant / redcurrant', latin: 'Ribes nigrum / rubrum', pl: 'porzeczka', arch: 'shrub', native: false, edible: true, h: [1.2, 1.7], tint: '#cce4b4', role: 'Soft fruit for the berry rows' },
  gooseberry: { id: 'gooseberry', name: 'Gooseberry', latin: 'Ribes uva-crispa', pl: 'agrest', arch: 'shrub', native: false, edible: true, h: [1.0, 1.4], tint: '#c8e0ae', role: 'Soft fruit' },
  honeyberry: { id: 'honeyberry', name: 'Honeyberry', latin: 'Lonicera caerulea', pl: 'jagoda kamczacka', arch: 'shrub', native: false, edible: true, h: [1.2, 1.8], tint: '#c6e0b0', role: 'Hardy to −40 °C; earliest fruit of the year' },
  raspberry: { id: 'raspberry', name: 'Raspberry', latin: 'Rubus idaeus', pl: 'malina', arch: 'shrub', native: true, edible: true, h: [1.4, 1.9], tint: '#c4dea8', role: 'Native cane fruit; forms thicket for wrens' },
}

/** Meadow & understorey flowers (instanced as small billboards). */
export const MEADOW_FLOWERS: { name: string; latin: string; color: string; bloom: [number, number] }[] = [
  { name: 'Ox-eye daisy', latin: 'Leucanthemum vulgare', color: '#f6f4ec', bloom: [5, 8] },
  { name: 'Yarrow', latin: 'Achillea millefolium', color: '#ece8da', bloom: [6, 9] },
  { name: 'Cornflower', latin: 'Centaurea cyanus', color: '#5d7fc4', bloom: [6, 8] },
  { name: 'Common knapweed', latin: 'Centaurea jacea', color: '#a357a3', bloom: [6, 9] },
  { name: 'Field scabious', latin: 'Knautia arvensis', color: '#9a7fbf', bloom: [6, 9] },
  { name: "Bird's-foot trefoil", latin: 'Lotus corniculatus', color: '#e8c52e', bloom: [5, 8] },
  { name: 'Meadow sage', latin: 'Salvia pratensis', color: '#6a63c2', bloom: [5, 7] },
  { name: 'Red clover', latin: 'Trifolium pratense', color: '#cf6f9a', bloom: [5, 9] },
  { name: 'Wild carrot', latin: 'Daucus carota', color: '#f3f1e4', bloom: [6, 9] },
]

export type ZoneMixEntry = [string, number]
export const ZONE_MIX: Record<string, { trees: ZoneMixEntry[]; shrubs: ZoneMixEntry[]; treeDensity: number; shrubDensity: number; under: ZoneMixEntry[]; underDensity: number }> = {
  woodland: {
    trees: [['pine', 0.34], ['birch', 0.3], ['rowan', 0.12], ['aspen', 0.08], ['birdcherry', 0.06], ['spruce', 0.06], ['alder', 0.04]],
    shrubs: [['hazel', 0.3], ['juniper', 0.2], ['guelder', 0.15], ['elder', 0.1], ['dogrose', 0.15], ['hawthorn', 0.1]],
    treeDensity: 7.5, shrubDensity: 11, under: [['fern', 0.45], ['bilberry', 0.55]], underDensity: 22,
  },
  screen: {
    trees: [['birch', 0.4], ['rowan', 0.3], ['pine', 0.3]],
    shrubs: [['hazel', 0.28], ['hawthorn', 0.16], ['guelder', 0.14], ['dogrose', 0.16], ['juniper', 0.14], ['elder', 0.12]],
    treeDensity: 3.2, shrubDensity: 24, under: [], underDensity: 0,
  },
  foodforest: {
    trees: [['apple', 0.34], ['plum', 0.2], ['pear', 0.18], ['sourcherry', 0.14], ['rowan', 0.14]],
    shrubs: [['currant', 0.26], ['gooseberry', 0.2], ['honeyberry', 0.2], ['hazel', 0.14], ['raspberry', 0.2]],
    treeDensity: 5.2, shrubDensity: 15, under: [['fern', 0.2], ['bilberry', 0.8]], underDensity: 8,
  },
  berries: {
    trees: [],
    shrubs: [['currant', 0.3], ['gooseberry', 0.22], ['honeyberry', 0.28], ['raspberry', 0.2]],
    treeDensity: 0, shrubDensity: 30, under: [], underDensity: 0,
  },
  kitchen: { trees: [], shrubs: [['currant', 0.3], ['gooseberry', 0.3], ['dogrose', 0.4]], treeDensity: 0, shrubDensity: 3, under: [], underDensity: 0 },
  shade: {
    trees: [['rowan', 0.5], ['birch', 0.5]],
    shrubs: [['juniper', 0.3], ['guelder', 0.4], ['hazel', 0.3]],
    treeDensity: 3.6, shrubDensity: 8, under: [['fern', 0.6], ['bilberry', 0.4]], underDensity: 30,
  },
  wetland: { trees: [['alder', 1]], shrubs: [['guelder', 0.5], ['elder', 0.5]], treeDensity: 2.0, shrubDensity: 6, under: [['fern', 1]], underDensity: 8 },
  meadow: { trees: [], shrubs: [['hawthorn', 0.34], ['dogrose', 0.66]], treeDensity: 0, shrubDensity: 0.9, under: [], underDensity: 0 },
}
