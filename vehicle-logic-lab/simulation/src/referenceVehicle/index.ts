export type {
  CanonicalSourceReference,
  ReferenceVehicleEntity,
  ReferenceVehicleEntityKind,
  ReferenceVehicleRegistryData,
  ReferenceVehicleRelation,
  ReferenceVehicleValidationResult,
  UnresolvedReferenceVehicleReference,
} from './types.ts'

export {
  EXPECTED_REFERENCE_VEHICLE_COUNTS,
  getCaseRelations,
  getEntitiesByKind,
  getEntity,
  getFunctionsForArea,
  getInterfacesForFunction,
  getRelations,
  getRelationsByKind,
  getRelationsFrom,
  getRelationsTo,
  getRequirementsForEntity,
  getSignalsForFunction,
  getTestsForRequirement,
  referenceVehicleRegistryData,
  validateReferenceVehicleRegistry,
} from './registry.ts'
