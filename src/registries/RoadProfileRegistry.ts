import type { RoadProfileId } from '../domain/world/MapDefinition.ts'
export interface RoadProfile { id: RoadProfileId; laneCount: number; laneWidth: number; shoulderWidth: number; medianType: 'NONE'|'PAINTED'|'BARRIER'; edgeLine: boolean; centerLine: boolean; sidewalkEnabled: boolean }
const profiles: Record<RoadProfileId,RoadProfile> = {
  RESIDENTIAL_2_LANE:{id:'RESIDENTIAL_2_LANE',laneCount:2,laneWidth:3,shoulderWidth:.4,medianType:'NONE',edgeLine:false,centerLine:true,sidewalkEnabled:true},
  URBAN_4_LANE:{id:'URBAN_4_LANE',laneCount:4,laneWidth:3.15,shoulderWidth:.6,medianType:'PAINTED',edgeLine:true,centerLine:true,sidewalkEnabled:true},
  HIGHWAY_6_LANE:{id:'HIGHWAY_6_LANE',laneCount:6,laneWidth:3.35,shoulderWidth:1.8,medianType:'BARRIER',edgeLine:true,centerLine:true,sidewalkEnabled:false},
  MOUNTAIN_2_LANE:{id:'MOUNTAIN_2_LANE',laneCount:2,laneWidth:3.1,shoulderWidth:.9,medianType:'NONE',edgeLine:true,centerLine:true,sidewalkEnabled:false},
  DIRT_SINGLE_ROAD:{id:'DIRT_SINGLE_ROAD',laneCount:1,laneWidth:4.5,shoulderWidth:.4,medianType:'NONE',edgeLine:false,centerLine:false,sidewalkEnabled:false},
  OPEN_TEST_ROAD:{id:'OPEN_TEST_ROAD',laneCount:2,laneWidth:3.5,shoulderWidth:2,medianType:'NONE',edgeLine:true,centerLine:true,sidewalkEnabled:false},
}
export function getRoadProfile(id: RoadProfileId): Readonly<RoadProfile> { return profiles[id] }
export function hasRoadProfile(id: string): id is RoadProfileId { return id in profiles }
