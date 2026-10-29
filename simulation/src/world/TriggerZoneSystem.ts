import type { MapDefinition, ScenarioTriggerZone } from '../domain/world/MapDefinition.ts'

export class TriggerZoneSystem {
  private readonly map: Readonly<MapDefinition>
  constructor(map: Readonly<MapDefinition>) { this.map = map }
  getZonesAt(position: { x: number; z: number }): readonly ScenarioTriggerZone[] {
    return this.map.scenarioTriggerZones.filter(({ bounds }) => position.x >= bounds.minX && position.x <= bounds.maxX && position.z >= bounds.minZ && position.z <= bounds.maxZ)
  }
  findByCapabilities(capabilities: readonly string[]) {
    return this.map.scenarioTriggerZones.filter((zone) => capabilities.every((capability) => zone.tags.includes(capability)))
  }
}
