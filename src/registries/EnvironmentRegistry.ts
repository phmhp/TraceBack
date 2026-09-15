import presets from '../data/environment/environment-presets.json' with { type: 'json' }

export interface EnvironmentPreset {
  presetId: string
  groundColor: string
  foliageColor: string
  accentColor: string
  density: number
}
const values = new Map<string, EnvironmentPreset>()
for (const raw of presets as unknown[]) {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid environment preset')
  const item = raw as Record<string, unknown>
  if (typeof item.presetId !== 'string' || typeof item.groundColor !== 'string' ||
      typeof item.foliageColor !== 'string' || typeof item.accentColor !== 'string' || typeof item.density !== 'number') {
    throw new Error('Invalid environment preset fields')
  }
  values.set(item.presetId, Object.freeze(item as unknown as EnvironmentPreset))
}
export function getEnvironmentPreset(id: string): Readonly<EnvironmentPreset> {
  const preset = values.get(id)
  if (!preset) throw new Error(`Unknown environment preset: ${id}`)
  return preset
}
export function hasEnvironmentPreset(id: string) { return values.has(id) }
