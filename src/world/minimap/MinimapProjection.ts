import type { MapPoint, MinimapConfig, RouteDefinition } from '../../domain/world/MapDefinition.ts'
import type { QuaternionValue } from '../../domain/vehicle/VehicleState.ts'

export interface MinimapProjection { project(point: Pick<MapPoint, 'x' | 'z'>): { x: number; y: number }; heading(rotation: QuaternionValue): number }
export function createMinimapProjection(route: Readonly<RouteDefinition>, config: Readonly<MinimapConfig>, contextPoints: readonly Pick<MapPoint,'x'|'z'>[] = route.orderedPoints): MinimapProjection {
  const xs = contextPoints.map((point) => point.x); const zs = contextPoints.map((point) => point.z)
  const minX = Math.min(...xs); const maxX = Math.max(...xs); const minZ = Math.min(...zs); const maxZ = Math.max(...zs)
  const usableWidth = config.width - config.padding * 2; const usableHeight = config.height - config.padding * 2
  const scale = Math.min(usableWidth / Math.max(1, maxX - minX), usableHeight / Math.max(1, maxZ - minZ))
  const offsetX = config.padding + (usableWidth - (maxX - minX) * scale) / 2; const offsetY = config.padding + (usableHeight - (maxZ - minZ) * scale) / 2
  return { project: ({ x, z }) => ({ x: offsetX + (x - minX) * scale, y: offsetY + (maxZ - z) * scale }), heading: (q) => -Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.z * q.z)) * 180 / Math.PI }
}
