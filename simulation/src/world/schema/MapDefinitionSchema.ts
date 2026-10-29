import type { MapDefinition } from '../../domain/world/MapDefinition.ts'
import { hasAssetDefinition } from '../../registries/AssetRegistry.ts'
import { hasEnvironmentPreset } from '../../registries/EnvironmentRegistry.ts'
import { hasSurfaceDefinition } from '../../registries/SurfaceRegistry.ts'
import { hasRoadProfile } from '../../registries/RoadProfileRegistry.ts'

const roadTypes = new Set(['STRAIGHT', 'CURVE', 'INTERSECTION', 'TWO_LANE', 'HILL', 'DIRT_SECTION'])
const actorTypes = new Set(['LEAD_VEHICLE', 'CROSS_TRAFFIC', 'GENERIC_TRAFFIC'])
const scenarioTypes = new Set(['LONGITUDINAL', 'LATERAL', 'INTERSECTION', 'SURFACE_CHANGE'])
const environmentTypes = new Set(['MEADOW', 'FOREST', 'URBAN', 'CONSTRUCTION', 'DIRT_FIELD', 'SERVICE_AREA'])
const objectTypes = new Set(['BARRIER', 'CONE', 'ROCK', 'BUILDING', 'STOPPED_VEHICLE', 'ROAD_BLOCK'])

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(`Invalid MapDefinition: ${message}`) }
function record(value: unknown, path: string): Record<string, unknown> { assert(value && typeof value === 'object' && !Array.isArray(value), `${path} must be an object`); return value as Record<string, unknown> }
function string(value: unknown, path: string) { assert(typeof value === 'string' && value.length > 0, `${path} must be a string`) }
function number(value: unknown, path: string) { assert(typeof value === 'number' && Number.isFinite(value), `${path} must be finite`) }
function strings(value: unknown, path: string, allowed?: Set<string>) { assert(Array.isArray(value), `${path} must be an array`); value.forEach((v, i) => { string(v, `${path}[${i}]`); assert(!allowed || allowed.has(v as string), `${path}[${i}] is unsupported`) }) }
function point(value: unknown, path: string) { const v = record(value, path); number(v.x, `${path}.x`); number(v.y, `${path}.y`); number(v.z, `${path}.z`) }
function bounds(value: unknown, path: string) { const v = record(value, path); ['minX', 'maxX', 'minZ', 'maxZ'].forEach((k) => number(v[k], `${path}.${k}`)); assert((v.minX as number) < (v.maxX as number) && (v.minZ as number) < (v.maxZ as number), `${path} is inverted`) }
function array(value: unknown, path: string) { assert(Array.isArray(value), `${path} must be an array`); return value }
function unique(items: unknown[], key: string, path: string) { const ids = items.map((item, i) => { const v = record(item, `${path}[${i}]`); string(v[key], `${path}[${i}].${key}`); return v[key] }); assert(new Set(ids).size === ids.length, `${path} contains duplicate ${key}`) }

export function parseMapDefinition(input: unknown): MapDefinition {
  const map = record(input, 'map')
  string(map.mapId, 'mapId'); string(map.displayName, 'displayName'); bounds(map.worldBounds, 'worldBounds')
  assert(typeof map.defaultSurfaceType === 'string' && hasSurfaceDefinition(map.defaultSurfaceType), 'defaultSurfaceType is unknown')
  strings(map.capabilities, 'capabilities')
  const spawns = array(map.spawnPoints, 'spawnPoints'); unique(spawns, 'id', 'spawnPoints'); assert(spawns.length > 0, 'spawnPoints is empty')
  spawns.forEach((raw, i) => { const v = record(raw, `spawnPoints[${i}]`); point(v.position, `spawnPoints[${i}].position`); number(v.rotationY, `spawnPoints[${i}].rotationY`); strings(v.tags, `spawnPoints[${i}].tags`) })
  const routes = array(map.routes, 'routes'); unique(routes, 'routeId', 'routes'); assert(routes.length > 0, 'routes is empty')
  const routeIds = new Set(routes.map((raw, i) => { const v = record(raw, `routes[${i}]`); const points = array(v.orderedPoints, `routes[${i}].orderedPoints`); assert(points.length >= 2, `routes[${i}] needs two points`); points.forEach((p, n) => point(p, `routes[${i}].orderedPoints[${n}]`)); point(v.startPoint, `routes[${i}].startPoint`); point(v.finishPoint, `routes[${i}].finishPoint`); if(v.startHeading!==undefined)number(v.startHeading,`routes[${i}].startHeading`); if(v.finishHeading!==undefined)number(v.finishHeading,`routes[${i}].finishHeading`); assert(typeof v.closedLoop === 'boolean', `routes[${i}].closedLoop must be boolean`); const checkpoints = array(v.checkpoints, `routes[${i}].checkpoints`); checkpoints.forEach((c, n) => { const cp = record(c, `checkpoint[${n}]`); string(cp.id, 'checkpoint.id'); number(cp.pointIndex, 'checkpoint.pointIndex'); assert((cp.pointIndex as number) >= 0 && (cp.pointIndex as number) < points.length, 'checkpoint pointIndex is out of range') }); return v.routeId as string }))
  const roads = array(map.roadSegments, 'roadSegments'); unique(roads, 'id', 'roadSegments')
  roads.forEach((raw, i) => { const v = record(raw, `roadSegments[${i}]`); assert(typeof v.type === 'string' && roadTypes.has(v.type), 'road type is unsupported'); const points = array(v.points, `roadSegments[${i}].points`); assert(points.length >= 2, 'road needs two points'); points.forEach((p, n) => point(p, `road.points[${n}]`)); number(v.width, 'road.width'); assert((v.width as number) > 0, 'road width must be positive'); assert(typeof v.surfaceType === 'string' && hasSurfaceDefinition(v.surfaceType), 'road surface is unknown'); strings(v.tags, 'road.tags') })
  const surfaces = array(map.surfaceZones, 'surfaceZones'); unique(surfaces, 'id', 'surfaceZones'); surfaces.forEach((raw, i) => { const v = record(raw, `surfaceZones[${i}]`); bounds(v.bounds, 'surface.bounds'); assert(typeof v.surfaceType === 'string' && hasSurfaceDefinition(v.surfaceType), 'surface is unknown') })
  const environments = array(map.environmentZones, 'environmentZones'); unique(environments, 'id', 'environmentZones'); environments.forEach((raw, i) => { const v = record(raw, `environmentZones[${i}]`); assert(typeof v.type === 'string' && environmentTypes.has(v.type), 'environment type is unsupported'); bounds(v.bounds, 'environment.bounds'); assert(typeof v.visualPreset === 'string' && hasEnvironmentPreset(v.visualPreset), 'environment preset is unknown') })
  const objects = array(map.staticObjects, 'staticObjects'); unique(objects, 'id', 'staticObjects'); objects.forEach((raw, i) => { const v = record(raw, `staticObjects[${i}]`); assert(typeof v.objectType === 'string' && objectTypes.has(v.objectType), 'object type is unsupported'); point(v.position, 'object.position'); number(v.rotationY, 'object.rotationY'); point(v.scale, 'object.scale'); assert(typeof v.collidable === 'boolean', 'object.collidable must be boolean'); assert(typeof v.assetId === 'string' && hasAssetDefinition(v.assetId), 'asset is unknown') })
  const actorSpawns = array(map.actorSpawnPoints, 'actorSpawnPoints'); unique(actorSpawns, 'id', 'actorSpawnPoints'); actorSpawns.forEach((raw, i) => { const v = record(raw, `actorSpawnPoints[${i}]`); point(v.position, 'actor.position'); number(v.rotationY, 'actor.rotationY'); assert(typeof v.routeId === 'string' && routeIds.has(v.routeId), 'actor route is unknown'); strings(v.allowedActorTypes, 'actor.allowedActorTypes', actorTypes); strings(v.tags, 'actor.tags') })
  const triggers = array(map.scenarioTriggerZones, 'scenarioTriggerZones'); unique(triggers, 'id', 'scenarioTriggerZones'); triggers.forEach((raw, i) => { const v = record(raw, `scenarioTriggerZones[${i}]`); bounds(v.bounds, 'trigger.bounds'); strings(v.tags, 'trigger.tags'); strings(v.allowedScenarioTypes, 'trigger.allowedScenarioTypes', scenarioTypes) })
  const minimap = record(map.minimapConfig, 'minimapConfig'); assert(typeof minimap.routeId === 'string' && routeIds.has(minimap.routeId), 'minimap route is unknown'); number(minimap.width, 'minimap.width'); number(minimap.height, 'minimap.height'); number(minimap.padding, 'minimap.padding')
  if (map.importedBaseMap !== undefined) {
    const imported = record(map.importedBaseMap, 'importedBaseMap'); const metadata = record(imported.metadata, 'importedBaseMap.metadata')
    string(metadata.source, 'importedBaseMap.metadata.source'); number(metadata.originLat, 'importedBaseMap.metadata.originLat'); number(metadata.originLon, 'importedBaseMap.metadata.originLon'); string(metadata.overtureRelease, 'importedBaseMap.metadata.overtureRelease'); string(metadata.attribution, 'importedBaseMap.metadata.attribution')
    array(imported.roads, 'importedBaseMap.roads').forEach((raw, i) => { const road = record(raw, `importedBaseMap.roads[${i}]`); string(road.id, 'imported road id'); string(road.roadClass, 'imported road class'); assert(typeof road.profileId==='string'&&hasRoadProfile(road.profileId),'imported road profile is unknown'); number(road.width, 'imported road width'); const centerline = array(road.centerline, 'imported road centerline'); assert(centerline.length >= 2, 'imported road needs two points'); centerline.forEach((p,n)=>point(p,`imported road point ${n}`)) })
    array(imported.connectors, 'importedBaseMap.connectors').forEach((raw) => point(record(raw,'imported connector').position,'imported connector position'))
    array(imported.buildings, 'importedBaseMap.buildings').forEach((raw, i) => { const building = record(raw, `imported building ${i}`); string(building.id,'imported building id'); number(building.height,'imported building height'); assert(typeof building.collider === 'boolean','imported building collider must be boolean'); const footprint=array(building.footprint,'imported building footprint'); assert(footprint.length>=4,'imported building footprint needs four points'); footprint.forEach((p,n)=>point(p,`imported building point ${n}`)) })
  }
  return map as unknown as MapDefinition
}
