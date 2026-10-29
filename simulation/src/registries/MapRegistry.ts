import provingGround from '../data/maps/map-proving-01.json' with { type: 'json' }
import pangyo2 from '../data/maps/map-pangyo2.json' with { type: 'json' }
import type { MapDefinition } from '../domain/world/MapDefinition.ts'
import { parseMapDefinition } from '../world/schema/MapDefinitionSchema.ts'

export const PROVING_GROUND_MAP_ID = 'MAP_PROVING_01'
export const PANGYO2_MAP_ID = 'MAP_PANGYO2_OVERTURE_01'
const rawMaps: Record<string, unknown> = { [PROVING_GROUND_MAP_ID]: provingGround, [PANGYO2_MAP_ID]: pangyo2 }
const cache = new Map<string, MapDefinition>()
export function loadMapDefinition(mapId: string): Readonly<MapDefinition> {
  const cached = cache.get(mapId)
  if (cached) return cached
  if (!(mapId in rawMaps)) throw new Error(`Unknown mapId: ${mapId}`)
  const map = parseMapDefinition(rawMaps[mapId])
  cache.set(mapId, map)
  return map
}
