import type { StaticObjectType } from '../domain/world/MapDefinition.ts'
import type { Vector3Value } from '../domain/vehicle/VehicleState.ts'

export type PrimitiveVisual = 'BOX' | 'CONE' | 'ROCK'
export interface AssetDefinition {
  assetId: string
  objectType: StaticObjectType
  primitive: PrimitiveVisual
  size: Vector3Value
  color: string
  accentColor?: string
  physicsHalfExtents?: Vector3Value
}

const assets = {
  BARRIER_PASTEL: { assetId: 'BARRIER_PASTEL', objectType: 'BARRIER', primitive: 'BOX', size: { x: 2.4, y: 0.7, z: 0.45 }, color: '#f3b29d', physicsHalfExtents: { x: 1.2, y: 0.35, z: 0.225 } },
  CONE_CORAL: { assetId: 'CONE_CORAL', objectType: 'CONE', primitive: 'CONE', size: { x: 0.45, y: 0.8, z: 0.45 }, color: '#ec8f72' },
  ROCK_SOFT: { assetId: 'ROCK_SOFT', objectType: 'ROCK', primitive: 'ROCK', size: { x: 1.3, y: 0.9, z: 1.1 }, color: '#9cac9f', physicsHalfExtents: { x: 0.55, y: 0.42, z: 0.48 } },
  BUILDING_SMALL: { assetId: 'BUILDING_SMALL', objectType: 'BUILDING', primitive: 'BOX', size: { x: 8, y: 5, z: 7 }, color: '#f4ddbb', physicsHalfExtents: { x: 4, y: 2.5, z: 3.5 } },
  ROAD_BLOCK_CREAM: { assetId: 'ROAD_BLOCK_CREAM', objectType: 'ROAD_BLOCK', primitive: 'BOX', size: { x: 3.4, y: 1, z: 0.6 }, color: '#fff0cf', physicsHalfExtents: { x: 1.7, y: 0.5, z: 0.3 } },
  APARTMENT_BLOCK_A: { assetId: 'APARTMENT_BLOCK_A', objectType: 'BUILDING', primitive: 'BOX', size: { x: 12, y: 28, z: 9 }, color: '#ddd8ca', accentColor: '#8ba8b5' },
  APARTMENT_BLOCK_B: { assetId: 'APARTMENT_BLOCK_B', objectType: 'BUILDING', primitive: 'BOX', size: { x: 15, y: 22, z: 10 }, color: '#ead7c3', accentColor: '#a88f86' },
  OFFICE_OR_COMMERCIAL_A: { assetId: 'OFFICE_OR_COMMERCIAL_A', objectType: 'BUILDING', primitive: 'BOX', size: { x: 18, y: 12, z: 13 }, color: '#b9c8ca', accentColor: '#6f9098' },
  SMALL_BUILDING_A: { assetId: 'SMALL_BUILDING_A', objectType: 'BUILDING', primitive: 'BOX', size: { x: 9, y: 6, z: 8 }, color: '#f0d8bb', accentColor: '#d88972' },
  WAREHOUSE_A: { assetId: 'WAREHOUSE_A', objectType: 'BUILDING', primitive: 'BOX', size: { x: 24, y: 8, z: 16 }, color: '#b8c3ba', accentColor: '#778e86' },
  GARAGE_OR_TEST_FACILITY_A: { assetId: 'GARAGE_OR_TEST_FACILITY_A', objectType: 'BUILDING', primitive: 'BOX', size: { x: 22, y: 7, z: 14 }, color: '#e4d6b9', accentColor: '#6f9d96' },
  RETAINING_WALL: { assetId: 'RETAINING_WALL', objectType: 'BARRIER', primitive: 'BOX', size: { x: 2, y: 3, z: 18 }, color: '#9c9d91', accentColor: '#787d76' },
  SOUND_BARRIER: { assetId: 'SOUND_BARRIER', objectType: 'BARRIER', primitive: 'BOX', size: { x: .35, y: 4, z: 20 }, color: '#92aeb1', accentColor: '#d3e0da' },
  LARGE_ROAD_SIGN: { assetId: 'LARGE_ROAD_SIGN', objectType: 'ROAD_BLOCK', primitive: 'BOX', size: { x: 7, y: 3, z: .35 }, color: '#5f9188', accentColor: '#f3eed8' },
  HIGHWAY_BARRIER: { assetId: 'HIGHWAY_BARRIER', objectType: 'BARRIER', primitive: 'BOX', size: { x: .45, y: .8, z: 8 }, color: '#d9d7cc', accentColor: '#e7a477' },
} as const satisfies Record<string, AssetDefinition>

export type AssetId = keyof typeof assets
export function getAssetDefinition(assetId: string): Readonly<AssetDefinition> {
  const asset = assets[assetId as AssetId]
  if (!asset) throw new Error(`Unknown assetId: ${assetId}`)
  return asset
}
export function hasAssetDefinition(assetId: string): boolean { return assetId in assets }
