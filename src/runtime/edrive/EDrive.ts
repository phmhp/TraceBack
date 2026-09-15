import type { DriveTorqueRequest, EDriveCommand } from '../../domain/propulsion/PropulsionTypes.ts'

export function createEDriveCommand(request: Readonly<DriveTorqueRequest>, maximumForwardTorqueNm: number,
  maximumReverseTorqueNm: number): EDriveCommand {
  if (request.validity === 'INVALID') return { magnitudeNm: 0, direction: 'NONE', validity: 'INVALID' }
  if (request.magnitudeNm <= 0 || request.direction === 'NONE') return { magnitudeNm: 0, direction: 'NONE', validity: 'VALID' }
  const limit = request.direction === 'FORWARD' ? maximumForwardTorqueNm : maximumReverseTorqueNm
  return { magnitudeNm: Math.max(0, Math.min(request.magnitudeNm, limit)), direction: request.direction, validity: 'VALID' }
}
