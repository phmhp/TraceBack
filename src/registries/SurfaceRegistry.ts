import surfaceData from '../data/surfaces/surface-definitions.json' with { type: 'json' }
import type { SurfaceDefinition, SurfaceType } from '../domain/world/MapDefinition.ts'

function validateSurface(item: unknown): SurfaceDefinition {
  if (!item || typeof item !== 'object') throw new Error('Surface definition must be an object')
  const value = item as Record<string, unknown>
  if (typeof value.surfaceType !== 'string' || typeof value.friction !== 'number' ||
      typeof value.rollingResistance !== 'number' || typeof value.displayMaterial !== 'string') {
    throw new Error('Invalid surface definition')
  }
  if (value.friction <= 0 || value.rollingResistance < 0) throw new Error('Invalid surface parameters')
  return value as unknown as SurfaceDefinition
}

const definitions = new Map<SurfaceType, SurfaceDefinition>(
  (surfaceData as unknown[]).map((item) => {
    const value = validateSurface(item)
    return [value.surfaceType, Object.freeze(value)]
  }),
)

export function getSurfaceDefinition(type: SurfaceType): Readonly<SurfaceDefinition> {
  const value = definitions.get(type)
  if (!value) throw new Error(`Unknown surface type: ${type}`)
  return value
}

export function hasSurfaceDefinition(type: string): type is SurfaceType {
  return definitions.has(type as SurfaceType)
}
