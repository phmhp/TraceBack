import type { MapDefinition } from '../../domain/world/MapDefinition.ts'
import { EnvironmentRenderer } from './EnvironmentRenderer.tsx'
import { ContinuousRoadRenderer } from './ContinuousRoadRenderer.tsx'
import { StaticObjectRenderer } from './StaticObjectRenderer.tsx'
import { RoadsideInfrastructureRenderer } from './RoadsideInfrastructureRenderer.tsx'
import { RoadContextDetails } from './RoadContextDetails.tsx'
import { ImportedBaseMapRenderer } from './ImportedBaseMapRenderer.tsx'
import { RaceRouteMarkers } from './RaceRouteMarkers.tsx'
import { ImportedUrbanFurniture } from './ImportedUrbanFurniture.tsx'
import { ImportedRoadEnvironment } from './ImportedRoadEnvironment.tsx'
import { ImportedIntersectionRenderer } from './ImportedIntersectionRenderer.tsx'

export const worldDebugOptions = { showRoute: false, showSpawnPoints: false, showTriggerZones: false, showSurfaceZones: false } as const
export function MapRenderer({ map }: { map: Readonly<MapDefinition> }) {
  const assets = new Map<string, typeof map.staticObjects>()
  for (const object of map.staticObjects) assets.set(object.assetId, [...(assets.get(object.assetId) ?? []), object])
  const centerX = (map.worldBounds.minX + map.worldBounds.maxX) / 2
  const farZ = map.worldBounds.minZ + 100
  return <group>
    <mesh position={[(map.worldBounds.minX + map.worldBounds.maxX) / 2, -0.04, (map.worldBounds.minZ + map.worldBounds.maxZ) / 2]} receiveShadow><boxGeometry args={[map.worldBounds.maxX - map.worldBounds.minX, .08, map.worldBounds.maxZ - map.worldBounds.minZ]} /><meshStandardMaterial color="#91c980" roughness={1} /></mesh>
    <group position={[centerX, -18, farZ]}>
      <mesh position={[-430, 0, 0]} scale={[2.5, 1, 1]}><sphereGeometry args={[120, 18, 10]} /><meshStandardMaterial color="#699c70" roughness={1} /></mesh>
      <mesh position={[-120, 15, -30]} scale={[3, 1.2, 1]}><sphereGeometry args={[130, 18, 10]} /><meshStandardMaterial color="#78aa72" roughness={1} /></mesh>
      <mesh position={[300, -5, 10]} scale={[3.5, .9, 1]}><sphereGeometry args={[125, 18, 10]} /><meshStandardMaterial color="#628f68" roughness={1} /></mesh>
    </group>
    {map.importedBaseMap ? <><ImportedBaseMapRenderer imported={map.importedBaseMap} /><ImportedIntersectionRenderer imported={map.importedBaseMap}/><ImportedUrbanFurniture imported={map.importedBaseMap}/><ImportedRoadEnvironment imported={map.importedBaseMap}/></> : <><ContinuousRoadRenderer route={map.routes.find((route) => route.routeId === map.minimapConfig.routeId)!} segments={map.roadSegments} /><RoadsideInfrastructureRenderer map={map} /><RoadContextDetails map={map} /></>}
    <RaceRouteMarkers route={map.routes.find((route)=>route.routeId===map.minimapConfig.routeId)!} roads={map.importedBaseMap?.roads}/>
    {map.environmentZones.map((zone) => <EnvironmentRenderer key={zone.id} zone={zone} />)}
    {[...assets].map(([assetId, objects]) => <StaticObjectRenderer key={assetId} assetId={assetId} objects={objects} />)}
  </group>
}
