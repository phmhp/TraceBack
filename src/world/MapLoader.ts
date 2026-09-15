import type { MapDefinition, WorldPhysicsDefinition } from '../domain/world/MapDefinition.ts'
import { getAssetDefinition } from '../registries/AssetRegistry.ts'
import { getSurfaceDefinition } from '../registries/SurfaceRegistry.ts'
import { SurfaceSystem } from './SurfaceSystem.ts'
import { TriggerZoneSystem } from './TriggerZoneSystem.ts'

export interface LoadedMap { definition: Readonly<MapDefinition>; physics: Readonly<WorldPhysicsDefinition>; surfaces: SurfaceSystem; triggers: TriggerZoneSystem }
function yaw(rotationY: number) { return { x: 0, y: Math.sin(rotationY / 2), z: 0, w: Math.cos(rotationY / 2) } }
export function createLoadedMap(definition: Readonly<MapDefinition>): LoadedMap {
  const spawn = definition.spawnPoints[0]!
  const defaultFriction = getSurfaceDefinition(definition.defaultSurfaceType).friction
  const staticColliders = definition.staticObjects.flatMap((object) => {
    if (!object.collidable) return []
    const asset = getAssetDefinition(object.assetId)
    if (!asset.physicsHalfExtents) return []
    return [{ id: object.id, position: object.position, rotation: yaw(object.rotationY), halfExtents: {
      x: asset.physicsHalfExtents.x * object.scale.x, y: asset.physicsHalfExtents.y * object.scale.y, z: asset.physicsHalfExtents.z * object.scale.z,
    }, friction: defaultFriction }]
  })
  const importedBuildingColliders = definition.importedBaseMap?.buildings.flatMap((building) => {
    if (!building.collider) return []
    const xs=building.footprint.map((point)=>point.x); const zs=building.footprint.map((point)=>point.z); const minX=Math.min(...xs); const maxX=Math.max(...xs); const minZ=Math.min(...zs); const maxZ=Math.max(...zs); const x=(minX+maxX)/2; const z=(minZ+maxZ)/2
    return [{id:`imported-${building.id}`,position:{x,y:building.height/2,z},rotation:{x:0,y:0,z:0,w:1},halfExtents:{x:(maxX-minX)/2,y:building.height/2,z:(maxZ-minZ)/2},friction:.82}]
  }) ?? []
  const importedGuardrailColliders=definition.importedBaseMap?.roads.filter((road)=>road.profileId==='HIGHWAY_6_LANE').slice(0,8).flatMap((road)=>road.centerline.slice(1).flatMap((end,index)=>{const start=road.centerline[index]!;const dx=end.x-start.x,dz=end.z-start.z;const length=Math.hypot(dx,dz);if(length<1)return [];const yawAngle=Math.atan2(dx,dz);const nx=-dz/(length||1),nz=dx/(length||1);return [-1,1].map((side)=>({id:`guardrail-${road.id}-${index}-${side}`,position:{x:(start.x+end.x)/2+nx*side*(road.width/2+1),y:(start.y+end.y)/2+.55,z:(start.z+end.z)/2+nz*side*(road.width/2+1)},rotation:yaw(yawAngle),halfExtents:{x:.16,y:.55,z:length/2},friction:1.35}))}))??[]
  return { definition, surfaces: new SurfaceSystem(definition), triggers: new TriggerZoneSystem(definition), physics: {
    bounds: definition.worldBounds,
    groundPosition: { x: (definition.worldBounds.minX + definition.worldBounds.maxX) / 2, y: -0.5, z: (definition.worldBounds.minZ + definition.worldBounds.maxZ) / 2 },
    groundHalfExtents: { x: (definition.worldBounds.maxX - definition.worldBounds.minX) / 2, y: 0.5, z: (definition.worldBounds.maxZ - definition.worldBounds.minZ) / 2 },
    vehicleSpawn: { position: spawn.position, rotation: yaw(spawn.rotationY) }, staticColliders: [...staticColliders,...importedBuildingColliders,...importedGuardrailColliders],
  } }
}
