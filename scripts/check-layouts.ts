import { LAYOUTS } from '../src/data/layouts'
import { validateLayout } from '../src/lib/validate'
import { PLOT } from '../src/data/site'
import { polyArea, samplePath, maxGradient } from '../src/lib/geometry'

console.log('Plot area (traced):', polyArea(PLOT).toFixed(1), 'm²')
for (const id of ['A', 'B', 'C'] as const) {
  const L = LAYOUTS[id]
  const iss = validateLayout(L, { releaseSecondDwelling: false, featureSetback: 1 })
  const { samples, length } = samplePath(L.boardwalk, 0.25)
  console.log(`\n== Option ${id}  boardwalk ${length.toFixed(1)} m, max gradient ${(maxGradient(samples) * 100).toFixed(1)} %`)
  for (const i of iss) console.log(` [${i.severity}] ${i.text}`)
  if (!iss.length) console.log(' (no issues)')
}
