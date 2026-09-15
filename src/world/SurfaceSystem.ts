import type { MapDefinition, SurfaceInfoProvider } from '../domain/world/MapDefinition.ts'
import { getSurfaceDefinition } from '../registries/SurfaceRegistry.ts'
import { getRoadProfile } from '../registries/RoadProfileRegistry.ts'

function pointSegmentDistance(position:{x:number;z:number},a:{x:number;z:number},b:{x:number;z:number}){const dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz;if(!l2)return Math.hypot(position.x-a.x,position.z-a.z);const t=Math.max(0,Math.min(1,((position.x-a.x)*dx+(position.z-a.z)*dz)/l2));return Math.hypot(position.x-(a.x+t*dx),position.z-(a.z+t*dz))}

export class SurfaceSystem implements SurfaceInfoProvider {
  private readonly map: Readonly<MapDefinition>
  constructor(map: Readonly<MapDefinition>) { this.map = map }
  getSurfaceAt(position: { x: number; z: number }) {
    for (let index = this.map.surfaceZones.length - 1; index >= 0; index--) {
      const zone = this.map.surfaceZones[index]!
      const bounds = zone.bounds
      if (position.x >= bounds.minX && position.x <= bounds.maxX && position.z >= bounds.minZ && position.z <= bounds.maxZ) return getSurfaceDefinition(zone.surfaceType)
    }
    for(const road of this.map.importedBaseMap?.roads??[]){const profile=getRoadProfile(road.profileId);const halfWidth=profile.laneCount*profile.laneWidth/2+profile.shoulderWidth;if(road.centerline.slice(1).some((end,index)=>pointSegmentDistance(position,road.centerline[index]!,end)<=halfWidth))return getSurfaceDefinition(profile.id==='DIRT_SINGLE_ROAD'?'DIRT':'ASPHALT_DRY')}
    return getSurfaceDefinition(this.map.defaultSurfaceType)
  }
}
