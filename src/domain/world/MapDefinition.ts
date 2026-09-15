import type { QuaternionValue, Vector3Value } from '../vehicle/VehicleState.ts'

export type RoadType = 'STRAIGHT' | 'CURVE' | 'INTERSECTION' | 'TWO_LANE' | 'HILL' | 'DIRT_SECTION'
export type SurfaceType = 'ASPHALT_DRY' | 'ASPHALT_LOW_GRIP' | 'GRAVEL' | 'DIRT'
export type EnvironmentType = 'MEADOW' | 'FOREST' | 'URBAN' | 'CONSTRUCTION' | 'DIRT_FIELD' | 'SERVICE_AREA'
export type StaticObjectType = 'BARRIER' | 'CONE' | 'ROCK' | 'BUILDING' | 'STOPPED_VEHICLE' | 'ROAD_BLOCK'
export type ActorType = 'LEAD_VEHICLE' | 'CROSS_TRAFFIC' | 'GENERIC_TRAFFIC'
export type ScenarioType = 'LONGITUDINAL' | 'LATERAL' | 'INTERSECTION' | 'SURFACE_CHANGE'

export interface Bounds2D { minX: number; maxX: number; minZ: number; maxZ: number }
export interface MapPoint { x: number; y: number; z: number }
export interface SpawnPoint { id: string; position: MapPoint; rotationY: number; tags: string[] }
export interface RoadSegment {
  id: string
  type: RoadType
  points: MapPoint[]
  width: number
  surfaceType: SurfaceType
  tags: string[]
}
export interface RouteCheckpoint { id: string; pointIndex: number }
export interface RouteDefinition {
  routeId: string
  orderedPoints: MapPoint[]
  checkpoints: RouteCheckpoint[]
  startPoint: MapPoint
  finishPoint: MapPoint
  closedLoop: boolean
  startHeading?: number
  finishHeading?: number
}
export interface SurfaceZone { id: string; bounds: Bounds2D; surfaceType: SurfaceType }
export interface EnvironmentZone {
  id: string; type: EnvironmentType; bounds: Bounds2D; visualPreset: string
}
export interface StaticWorldObject {
  id: string
  objectType: StaticObjectType
  position: MapPoint
  rotationY: number
  scale: Vector3Value
  collidable: boolean
  assetId: string
}
export interface ActorSpawnPoint {
  id: string
  position: MapPoint
  rotationY: number
  routeId: string
  allowedActorTypes: ActorType[]
  tags: string[]
}
export interface ScenarioTriggerZone {
  id: string
  bounds: Bounds2D
  tags: string[]
  allowedScenarioTypes: ScenarioType[]
}
export interface MinimapConfig { routeId: string; width: number; height: number; padding: number }
export type ImportedRoadClass = 'motorway' | 'trunk' | 'primary' | 'secondary' | 'tertiary' | 'residential' | 'living_street' | 'service' | 'unclassified'
export type RoadProfileId = 'RESIDENTIAL_2_LANE' | 'URBAN_4_LANE' | 'HIGHWAY_6_LANE' | 'MOUNTAIN_2_LANE' | 'DIRT_SINGLE_ROAD' | 'OPEN_TEST_ROAD'
export interface ImportedRoad { id: string; roadClass: ImportedRoadClass; profileId: RoadProfileId; width: number; centerline: MapPoint[]; sourceId: string | null }
export interface ImportedConnector { id: string; position: MapPoint }
export interface ImportedBuilding { id: string; footprint: MapPoint[]; height: number; heightSource: 'OVERTURE_HEIGHT' | 'NUM_FLOORS_ESTIMATE' | 'TRACKBACK_FALLBACK'; collider: boolean }
export interface ImportedMapMetadata { source: string; bbox: { west: number; south: number; east: number; north: number }; originLat: number; originLon: number; overtureRelease: string; attribution: string }
export interface ImportedBaseMap { roads: ImportedRoad[]; connectors: ImportedConnector[]; buildings: ImportedBuilding[]; metadata: ImportedMapMetadata }
export interface MapDefinition {
  mapId: string
  displayName: string
  worldBounds: Bounds2D
  defaultSurfaceType: SurfaceType
  capabilities: string[]
  spawnPoints: SpawnPoint[]
  routes: RouteDefinition[]
  roadSegments: RoadSegment[]
  surfaceZones: SurfaceZone[]
  environmentZones: EnvironmentZone[]
  staticObjects: StaticWorldObject[]
  actorSpawnPoints: ActorSpawnPoint[]
  scenarioTriggerZones: ScenarioTriggerZone[]
  minimapConfig: MinimapConfig
  importedBaseMap?: ImportedBaseMap
}

export interface SurfaceDefinition {
  surfaceType: SurfaceType
  friction: number
  rollingResistance: number
  displayMaterial: string
}
export interface SurfaceInfoProvider { getSurfaceAt(position: Pick<Vector3Value, 'x' | 'z'>): Readonly<SurfaceDefinition> }

export interface StaticColliderDefinition {
  id: string
  position: Vector3Value
  rotation: QuaternionValue
  halfExtents: Vector3Value
  friction: number
}
export interface WorldPhysicsDefinition {
  bounds: Bounds2D
  groundPosition: Vector3Value
  groundHalfExtents: Vector3Value
  vehicleSpawn: { position: Vector3Value; rotation: QuaternionValue }
  staticColliders: StaticColliderDefinition[]
}
