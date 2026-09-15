export type Validity = 'VALID' | 'INVALID'
export type PropulsionDirection = 'NONE' | 'FORWARD' | 'REVERSE'
export type PropulsionState = 'PROP_DISABLED' | 'PROP_ENABLED'

export interface PropulsionRequest { magnitude: number; direction: PropulsionDirection; validity: Validity }
export interface DriveTorqueRequest { magnitudeNm: number; direction: PropulsionDirection; validity: Validity }
export interface EDriveCommand { magnitudeNm: number; direction: PropulsionDirection; validity: Validity }

export const ZERO_VALID_REQUEST: PropulsionRequest = { magnitude: 0, direction: 'NONE', validity: 'VALID' }
export const ZERO_INVALID_REQUEST: PropulsionRequest = { magnitude: 0, direction: 'NONE', validity: 'INVALID' }
