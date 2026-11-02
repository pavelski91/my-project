# Assumptions and verification items

## Assumed (and visible in the app)
| Assumption | Where |
|---|---|
| Survey sheet is north-up | Settings → *Sheet bearing from true north* |
| Boundary scale 0.0649 m/px (calibrated to 1418 m²) | `src/data/site.ts` |
| Existing house 4.2 × 7.4 m with the whole interior inside it; extension = bedroom 3.3 m at the north end next to the bathroom, loft continues over it; 2-car carport ≈ 5.6 × 5.2 m by the drive — eaves 2.9 m, roof 40° | `src/data/site.ts`, `src/scene/House.tsx` |
| Setbacks: 3.0 m for habitable pavilions, 1.0 m for decks/features (a *guide* only) | Settings → *Feature setback*; layout `setback` fields |
| Existing tin garage removed in Phase 1 | `src/lib/validate.ts` |
| Right-hand dwelling will not be built — its land is released and used (you confirmed) | Settings → *Use second-dwelling land* (on by default) |
| Annual rainfall 600 mm, runoff 0.9, first-flush/filter 0.9 | Sustain tab (editable rainfall) |
| Timber decks and the boardwalk count as permeable (raised, open joints) | Dashboard footnote |
| Native share counts only native woody plants; cultivars count as non-native | Dashboard |
| Plot treated as pasture; no existing trees | `VERIFY_ITEMS` |
| Terrain from 17 spot heights | `SPOT_HEIGHTS` |

## Must be verified before any real decision
1. **Setbacks and building lines** (MPZP / WZ, Prawo budowlane §12 WT) — the plan shows lines on the road and east side only.
2. **Permit route and intensity limits** for the extension, office, gym/sauna, greenhouse and bania — the plan authorises two ~35 m² dwellings (70 m² built). The model reports built area as 105 m² for Option A.
3. **Status of the second dwelling** (planned, sold, dropped?).
4. **Existing tin garage** — ownership, removal.
5. **Utilities** — capacity and routes for office, sauna (≈ 6–9 kW heater) and outdoor shower; drainage for the shower/bania; the plan ends services at the dwellings.
6. **Soil, groundwater and infiltration** — needed for the rain garden, pond, screw-pile design and acid-loving plants.
7. **Existing vegetation.**
8. **Fire safety** — stove and tub chimney clearances, distances to boundaries and trees.
9. **Spot heights / DTM** — commission a staked-out topographic survey.
10. **True north and neighbour shading** for the greenhouse siting.

## Not modelled
Structural engineering, heating/cooling loads, embodied carbon, construction cost, construction access and staging, noise, and neighbouring plots' shading.
