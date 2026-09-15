import test from 'node:test'
import assert from 'node:assert/strict'
import mapJson from '../src/data/maps/map-proving-01.json' with { type: 'json' }
import pangyoJson from '../src/data/maps/map-pangyo2.json' with { type: 'json' }
import { parseMapDefinition } from '../src/world/schema/MapDefinitionSchema.ts'
import { createLoadedMap } from '../src/world/MapLoader.ts'
import { createMinimapProjection } from '../src/world/minimap/MinimapProjection.ts'
import { projectWgs84ToLocal, unprojectLocalToWgs84 } from '../src/world/import/LocalProjection.ts'

test('Pangyo Overture import validates and keeps base geography separate from race overlay', () => {
  const map = parseMapDefinition(pangyoJson); assert.equal(map.mapId, 'MAP_PANGYO2_OVERTURE_01')
  assert.ok(map.importedBaseMap.roads.length > 100); assert.ok(map.importedBaseMap.buildings.length > 100); assert.ok(map.routes[0].orderedPoints.length >= 2)
  assert.ok(new Set(map.importedBaseMap.roads.map((road)=>road.profileId)).size>=3)
  assert.ok(map.importedBaseMap.roads.some((road)=>road.centerline.some((point)=>point.y>0))); assert.equal(typeof map.routes[0].startHeading,'number'); assert.equal(typeof map.routes[0].finishHeading,'number')
  const routePoints=map.routes[0].orderedPoints; let maximumTurn=0; for(let i=2;i<routePoints.length;i++){const a=Math.atan2(routePoints[i-1].x-routePoints[i-2].x,routePoints[i-1].z-routePoints[i-2].z);const b=Math.atan2(routePoints[i].x-routePoints[i-1].x,routePoints[i].z-routePoints[i-1].z);maximumTurn=Math.max(maximumTurn,Math.abs(Math.atan2(Math.sin(b-a),Math.cos(b-a))))} assert.ok(maximumTurn<10*Math.PI/180)
  assert.equal(map.roadSegments.length, 0); assert.match(map.importedBaseMap.metadata.attribution, /Overture Maps Foundation/)
  const loaded = createLoadedMap(map); assert.ok(loaded.physics.staticColliders.length > 0)
  assert.equal(map.importedBaseMap.buildings.filter((building)=>building.collider).length,map.importedBaseMap.buildings.length)
  assert.ok(loaded.physics.staticColliders.filter((collider)=>collider.id.startsWith('imported-')).length===map.importedBaseMap.buildings.length)
  assert.ok(loaded.physics.staticColliders.filter((collider)=>collider.id.startsWith('imported-')).every((collider)=>collider.friction===.82))
  assert.equal(loaded.surfaces.getSurfaceAt(map.routes[0].startPoint).surfaceType,'ASPHALT_DRY')
  assert.equal(loaded.surfaces.getSurfaceAt({x:0,z:900}).surfaceType,'GRAVEL')
  assert.equal(loaded.surfaces.getSurfaceAt({x:520,z:590}).surfaceType,'DIRT')
  const spawn=loaded.physics.vehicleSpawn.position; assert.ok(loaded.physics.staticColliders.every((collider)=>Math.abs(spawn.x-collider.position.x)>collider.halfExtents.x||Math.abs(spawn.z-collider.position.z)>collider.halfExtents.z),'spawn must not overlap an imported building collider')
  const rotation=loaded.physics.vehicleSpawn.rotation; const routeDx=routePoints[1].x-routePoints[0].x; const routeDz=routePoints[1].z-routePoints[0].z
  const vehicleForwardX=-2*rotation.w*rotation.y; const vehicleForwardZ=2*rotation.y*rotation.y-1
  assert.ok(vehicleForwardX*routeDx+vehicleForwardZ*routeDz>0,'ego spawn must face the first route segment')
})

test('Pangyo WGS84 projection is meter-based and round trips around the configured origin', () => {
  const origin = { originLat: 37.4065, originLon: 127.087 }; const local = projectWgs84ToLocal(127.088, 37.4075, origin)
  assert.ok(local.x > 88 && local.x < 89); assert.ok(local.z > 111 && local.z < 112)
  const geographic = unprojectLocalToWgs84(local.x, local.z, origin); assert.ok(Math.abs(geographic.lon - 127.088) < 1e-9); assert.ok(Math.abs(geographic.lat - 37.4075) < 1e-9)
})

test('proving ground validates and exposes route, road types and capabilities independently of display name', () => {
  const map = parseMapDefinition(mapJson)
  assert.equal(map.mapId, 'MAP_PROVING_01'); assert.equal(map.displayName, 'Green Valley Circuit')
  assert.ok(map.routes[0].orderedPoints.length >= 10)
  for (const type of ['STRAIGHT', 'CURVE', 'INTERSECTION', 'TWO_LANE', 'DIRT_SECTION']) assert.ok(map.roadSegments.some((road) => road.type === type))
  for (const capability of ['LONG_STRAIGHT', 'CURVE', 'INTERSECTION', 'LOW_GRIP_AVAILABLE']) assert.ok(map.capabilities.includes(capability))
})

test('schema rejects broken references and duplicate identifiers', () => {
  const broken = structuredClone(mapJson); broken.minimapConfig.routeId = 'MISSING'
  assert.throws(() => parseMapDefinition(broken), /minimap route/)
  const duplicate = structuredClone(mapJson); duplicate.staticObjects[1].id = duplicate.staticObjects[0].id
  assert.throws(() => parseMapDefinition(duplicate), /duplicate id/)
})

test('surface and hidden trigger lookup use position; physics definition contains only collider/spawn data', () => {
  const loaded = createLoadedMap(parseMapDefinition(mapJson))
  assert.equal(loaded.surfaces.getSurfaceAt({ x: 0, z: 300 }).surfaceType, 'ASPHALT_DRY')
  assert.equal(loaded.surfaces.getSurfaceAt({ x: 350, z: -500 }).surfaceType, 'DIRT')
  assert.ok(loaded.surfaces.getSurfaceAt({ x: 350, z: -500 }).friction < loaded.surfaces.getSurfaceAt({ x: 0, z: 300 }).friction)
  assert.equal(loaded.triggers.getZonesAt({ x: 0, z: 300 })[0].id, 'ZONE_STRAIGHT_01')
  assert.ok(!('mapId' in loaded.physics)); assert.equal(loaded.physics.staticColliders.length, mapJson.staticObjects.filter((item) => item.collidable).length)
})

test('minimap projection fits route and maps identity heading to north', () => {
  const map = parseMapDefinition(mapJson); const route = map.routes[0]
  const projection = createMinimapProjection(route, map.minimapConfig)
  for (const point of route.orderedPoints) { const p = projection.project(point); assert.ok(p.x >= map.minimapConfig.padding && p.x <= map.minimapConfig.width - map.minimapConfig.padding); assert.ok(p.y >= map.minimapConfig.padding && p.y <= map.minimapConfig.height - map.minimapConfig.padding) }
  assert.equal(projection.heading({ x: 0, y: 0, z: 0, w: 1 }), -0)
})
