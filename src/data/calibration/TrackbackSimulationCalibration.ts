/** Game-tuning assumptions. These are not OEM or production-vehicle calibration values. */
export const TRACKBACK_SIMULATION_CALIBRATION_V0_1 = {
  profileId: 'TRACKBACK_SIMULATION_CALIBRATION_v0.1',
  provenance: 'SIMULATION_ASSUMPTION',
  status: 'REVIEW_REQUIRED',
  keyboardPedalResponse: {
    acceleratorRisePerSecond: 1.8,
    acceleratorFallPerSecond: 3,
    brakeRisePerSecond: 3.6,
    brakeFallPerSecond: 5,
  },
  pedalMap: { calibrationId: 'CAL-PROP-PEDAL-MAP', value: 'linear 0..1', unit: '1', purpose: 'pedal to normalized request', source: 'existing linear accelerator behavior', reviewNotes: 'Initial game tuning' },
  gearDirectionChangeMaxSpeedMps: { calibrationId: 'CAL-GEAR-DIR-CHANGE-MAX-SPEED', value: 0.5, unit: 'm/s', purpose: 'D/R interlock', source: 'simulation assumption', reviewNotes: 'Play-test adjustable' },
  vmcForwardTorqueMap: { calibrationId: 'CAL-VMC-FWD-TQ-MAP', maximumTorqueNm: 180, zeroTorqueSpeedMps: 24, unit: 'Nm', purpose: 'forward request conversion', source: 'migrated from 1800 N and speedFactor', reviewNotes: 'Combined with 10 N/Nm conversion preserves prior force' },
  vmcReverseTorqueMap: { calibrationId: 'CAL-VMC-REV-TQ-MAP', maximumTorqueNm: 130, zeroTorqueSpeedMps: 12, unit: 'Nm', purpose: 'reverse request conversion', source: 'simulation assumption', reviewNotes: 'Reduced reverse speed/force' },
  maxForwardTorqueNm: { calibrationId: 'CAL-EDR-MAX-FWD-TQ', value: 180, unit: 'Nm', purpose: 'forward eDrive limit', source: 'migrated game tuning', reviewNotes: 'Play-test adjustable' },
  maxReverseTorqueNm: { calibrationId: 'CAL-EDR-MAX-REV-TQ', value: 130, unit: 'Nm', purpose: 'reverse eDrive limit', source: 'simulation assumption', reviewNotes: 'Play-test adjustable' },
  torqueToForce: { calibrationId: 'SIM-PROP-TORQUE-TO-FORCE', value: 10, unit: 'N/Nm', purpose: 'physics adapter conversion', source: '180 Nm × 10 preserves 1800 N maximum', reviewNotes: 'Arcade physics conversion' },
  responseWindowSeconds: { calibrationId: 'SIM-PROP-RESPONSE-WINDOW', value: 1, unit: 's', purpose: 'normal response observation', source: 'simulation assumption', reviewNotes: 'Test threshold' },
  minimumResponseAccelerationMps2: { calibrationId: 'SIM-PROP-MIN-RESPONSE-ACCEL', value: 0.05, unit: 'm/s²', purpose: 'observable response', source: 'simulation assumption', reviewNotes: 'Test threshold' },
  zeroSpeedToleranceMps: { calibrationId: 'SIM-PROP-ZERO-SPEED-TOLERANCE', value: 0.1, unit: 'm/s', purpose: 'near-stationary classification', source: 'simulation assumption', reviewNotes: 'Test/interlock support' },
} as const
