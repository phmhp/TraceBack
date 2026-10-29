import type { DrivingEventDefinition } from '../../runtime/gameplay/DrivingEvent.ts'

/** First reusable road-context event. It is gameplay data, not engineering truth. */
export const STOPPED_VEHICLE_AVOIDANCE_EVENT:DrivingEventDefinition={
  id:'EVENT-STOPPED-VEHICLE-001',
  type:'STOPPED_VEHICLE_AVOIDANCE',
  title:'정차 차량 주의',
  objective:'앞의 정차 차량을 확인하고 속도를 줄인 뒤 안전하게 피해 가세요.',
  activation:'RECOVERY_START',
  actor:{distanceAheadM:24,lateralOffsetM:-1.8,speedMps:0},
  clearBehindDistanceM:-4,
  collisionPenaltySeconds:3,
  evidenceContext:{environment:'차로 한쪽에 정차 차량이 있음',driverDecision:'감속 후 안전한 공간으로 조향',vehicleFunctions:['Braking','Steering','Vehicle Dynamics']},
}
