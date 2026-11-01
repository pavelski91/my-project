import { evaluateOption, scoreOptions, CRITERIA } from '../src/lib/compare'

const years = Number(process.argv[2] ?? 9)
const rs = (['A', 'B', 'C'] as const).map((i) => evaluateOption(i, years))
const sets: Record<string, Record<string, number>> = {
  'brief priorities': { ecology: 1.2, water: 0.8, journey: 1.5, compact: 0.7, solar: 0.8, comfort: 1.2 },
  'equal weights': Object.fromEntries(CRITERIA.map((c) => [c.id, 1])),
  'ecology first': { ecology: 2, water: 1, journey: 0.5, compact: 1, solar: 0.5, comfort: 0.5 },
}
console.log(`Planting age for the solar model: ${years} years`)
for (const [k, w] of Object.entries(sets))
  console.log(k.padEnd(18), scoreOptions(rs, w as never).map((s, i) => `${rs[i].id} ${(s.total * 100).toFixed(0)}`).join('   '))
for (const r of rs)
  console.log(r.id, 'boardwalk', r.boardwalk.toFixed(0), 'm; built', r.m.builtTotal.toFixed(0), 'm²; bio-active', ((100 * r.m.biologicallyActive) / r.m.plotArea).toFixed(1), '%; sun', r.solar?.map((s) => s.hours.toFixed(1)).join(' / '))
