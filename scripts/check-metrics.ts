import { LAYOUTS } from '../src/data/layouts'
import { generateVegetation } from '../src/lib/vegetation'
import { computeMetrics, greenhouseSolar } from '../src/lib/analysis'
for (const id of ['A','B','C'] as const) {
  const L = LAYOUTS[id]
  const t0 = Date.now()
  const v = generateVegetation(L, 5, false)
  const m = computeMetrics(L, 5, false, v)
  const sol = greenhouseSolar(L, 5, false, v, 0.78)
  console.log(`\n== ${id} (${Date.now()-t0} ms)  plants=${v.plants.length} tufts=${v.tufts.length} flowers=${v.flowers.length}`)
  console.log(' built', m.builtTotal.toFixed(1), 'paved', m.paved.toFixed(1), 'decks', m.decks.toFixed(1), 'veg', m.vegetated.toFixed(1), 'bioActive', (m.biologicallyActive/m.plotArea*100).toFixed(1)+'%')
  console.log(' trees', m.trees, 'shrubs', m.shrubs, 'native', (m.nativeShare*100).toFixed(0)+'%', 'roof', m.roofArea.toFixed(0), 'rain m3', m.rainYieldM3.toFixed(0), 'tanks L', m.tankLitres)
  console.log(' bw', m.boardwalkLength.toFixed(1), 'm', (m.boardwalkGrade*100).toFixed(1)+'%', 'edible', m.edibleIntensive.toFixed(0), m.edibleZones.toFixed(0))
  console.log(' sun', sol?.map(s=>s.hours.toFixed(1)).join(' / '))
}
