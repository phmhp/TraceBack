/**
 * Educational/gameplay execution-model calibration.
 *
 * These values preserve the existing TraceBack driving behavior. They are
 * SIMULATION_ASSUMPTION values and must never be presented as Genesis GV70
 * production calibration or internal ECU logic.
 */
export const TRACKBACK_CHASSIS_EXECUTION_CALIBRATION_V0_1 = {
  profileId: 'TRACKBACK_CHASSIS_EXECUTION_CALIBRATION_v0.1',
  provenance: 'SIMULATION_ASSUMPTION',
  modelAuthority: 'TRACKBACK_EXECUTION_MODEL',
  status: 'REVIEW_REQUIRED',
  serviceBrakeMaximumForceN: {
    calibrationId: 'SIM-BRAKE-MAX-FORCE',
    value: 6500,
    unit: 'N',
    purpose: 'normalized service-brake request to physics force',
    source: 'formalized from the pre-existing TemporaryBrakeSteeringAdapters behavior',
  },
  steeringMaximumAngleRad: {
    calibrationId: 'SIM-STEER-MAX-ANGLE',
    value: 0.42,
    unit: 'rad',
    purpose: 'maximum low-speed front-wheel command',
    source: 'formalized from the pre-existing TemporaryBrakeSteeringAdapters behavior',
  },
  steeringSpeedAttenuationPerMps: {
    calibrationId: 'SIM-STEER-SPEED-ATTENUATION',
    value: 0.07,
    unit: '1/(m/s)',
    purpose: 'reduce steering command as vehicle speed rises',
    source: 'formalized from the pre-existing TemporaryBrakeSteeringAdapters behavior',
  },
} as const

export type TrackbackChassisExecutionCalibration = typeof TRACKBACK_CHASSIS_EXECUTION_CALIBRATION_V0_1

