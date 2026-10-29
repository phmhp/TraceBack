import type { DriveTorqueRequest, PropulsionRequest } from '../../domain/propulsion/PropulsionTypes.ts'

export interface TorqueMap { maximumTorqueNm: number; zeroTorqueSpeedMps: number }

export function createDriveTorqueRequest(request: Readonly<PropulsionRequest>, vehicleSpeed: number,
  forwardMap: Readonly<TorqueMap>, reverseMap: Readonly<TorqueMap>): DriveTorqueRequest {
  if (request.validity === 'INVALID') return { magnitudeNm: 0, direction: 'NONE', validity: 'INVALID' }
  if (request.magnitude <= 0 || request.direction === 'NONE') return { magnitudeNm: 0, direction: 'NONE', validity: 'VALID' }
  const map = request.direction === 'FORWARD' ? forwardMap : reverseMap
  const speedFactor = Math.max(0, 1 - Math.max(0, vehicleSpeed) / map.zeroTorqueSpeedMps)
  return { magnitudeNm: Math.max(0, request.magnitude * map.maximumTorqueNm * speedFactor), direction: request.direction, validity: 'VALID' }
}
