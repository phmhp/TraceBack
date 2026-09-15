/** TEMPORARY arcade physics calibration; not real vehicle/source/approved case data. */
export const phase2Physics = {
  gravity: { x: 0, y: -9.81, z: 0 },
  groundHalfExtents: { x: 1000, y: 0.5, z: 1000 },
  groundPosition: { x: 0, y: -0.5, z: -500 },
  spawn: { x: 0, y: 0.9, z: 0 },
  chassisHalfExtents: { x: 0.85, y: 0.2, z: 1.35 },
  massKg: 220,
  wheelRadius: 0.425,
  suspensionRestLength: 0.22,
  visualOriginOffsetY: -0.65,
} as const
