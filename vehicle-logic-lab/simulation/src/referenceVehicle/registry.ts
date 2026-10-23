import generatedData from './generated/reference-vehicle-registry.json' with { type: 'json' }
import type {
  ReferenceVehicleEntity,
  ReferenceVehicleEntityKind,
  ReferenceVehicleRegistryData,
  ReferenceVehicleRelation,
  ReferenceVehicleValidationResult,
} from './types.ts'

export const EXPECTED_REFERENCE_VEHICLE_COUNTS: Readonly<Record<ReferenceVehicleEntityKind, number>> = Object.freeze({
  AREA: 16,
  LOGICAL_FUNCTION: 74,
  SIGNAL: 111,
  INTERFACE: 50,
  REQUIREMENT: 180,
  TEST_CASE: 74,
  CASE: 34,
})

const data = generatedData as unknown as ReferenceVehicleRegistryData
const entityById = new Map(data.entities.map(entity => [entity.id, entity]))
const relationDirections: Readonly<Record<string, readonly string[]>> = Object.freeze({
  CONTAINS_LOGICAL_FUNCTION: ['AREA>LOGICAL_FUNCTION'],
  CONTAINS_REQUIREMENT: ['AREA>REQUIREMENT'],
  CONTAINS_TEST_CASE: ['AREA>TEST_CASE'],
  REFINES_CANDIDATE: ['REQUIREMENT>REQUIREMENT'],
  VERIFIED_BY_CANDIDATE: ['REQUIREMENT>TEST_CASE'],
  ALLOCATED_TO_LOGICAL_FUNCTION: ['REQUIREMENT>LOGICAL_FUNCTION'],
  PROPOSED_ALLOCATION_NOT_1_TO_1: ['REQUIREMENT>REQUIREMENT'],
  CASE_TRACES_TO_REQUIREMENT_AND_TC: ['CASE>REQUIREMENT', 'CASE>TEST_CASE'],
  LINKED_IMPLEMENTATION_REQUIREMENT: ['CASE>REQUIREMENT', 'TEST_CASE>REQUIREMENT'],
  LINKED_SYSTEM_REQUIREMENT: ['CASE>REQUIREMENT', 'TEST_CASE>REQUIREMENT'],
  LINKED_TEST_CASE: ['CASE>TEST_CASE'],
  PRIMARY_LOGICAL_FUNCTION: ['CASE>LOGICAL_FUNCTION'],
  PRIMARY_LOGICAL_FUNCTION_TRACE: ['CASE>LOGICAL_FUNCTION'],
  SECONDARY_LOGICAL_FUNCTION: ['CASE>LOGICAL_FUNCTION'],
  SECONDARY_LOGICAL_FUNCTION_TRACE: ['CASE>LOGICAL_FUNCTION'],
  CONNECTS_TO_FUNCTION: ['INTERFACE>LOGICAL_FUNCTION'],
  TRANSFERS_SIGNAL: ['INTERFACE>SIGNAL'],
  CONSUMES_SIGNAL: ['LOGICAL_FUNCTION>SIGNAL'],
  PRODUCES_SIGNAL: ['LOGICAL_FUNCTION>SIGNAL'],
  SATISFIES_LOGICAL_FUNCTION_SCOPE: ['LOGICAL_FUNCTION>REQUIREMENT'],
  PROVIDES_INTERFACE: ['LOGICAL_FUNCTION>INTERFACE'],
  TARGETS_LOGICAL_FUNCTION: ['TEST_CASE>LOGICAL_FUNCTION'],
})
const entitiesByKind = new Map<ReferenceVehicleEntityKind, readonly ReferenceVehicleEntity[]>()
const relationsFrom = new Map<string, readonly ReferenceVehicleRelation[]>()
const relationsTo = new Map<string, readonly ReferenceVehicleRelation[]>()

for (const kind of Object.keys(EXPECTED_REFERENCE_VEHICLE_COUNTS) as ReferenceVehicleEntityKind[]) {
  entitiesByKind.set(kind, Object.freeze(data.entities.filter(entity => entity.entityKind === kind)))
}
for (const entity of data.entities) {
  relationsFrom.set(entity.id, Object.freeze(data.relations.filter(relation => relation.sourceId === entity.id)))
  relationsTo.set(entity.id, Object.freeze(data.relations.filter(relation => relation.targetId === entity.id)))
}

const uniqueEntities = (entities: readonly (ReferenceVehicleEntity | undefined)[]) => {
  const result = new Map<string, ReferenceVehicleEntity>()
  entities.forEach(entity => { if (entity) result.set(entity.id, entity) })
  return Object.freeze([...result.values()])
}

export const referenceVehicleRegistryData = data
export const getEntity = (id: string) => entityById.get(id)
export const getEntitiesByKind = (kind: ReferenceVehicleEntityKind) => entitiesByKind.get(kind) ?? Object.freeze([])
export const getRelationsFrom = (id: string) => relationsFrom.get(id) ?? Object.freeze([])
export const getRelationsTo = (id: string) => relationsTo.get(id) ?? Object.freeze([])
export const getRelations = (id: string) => Object.freeze([...getRelationsFrom(id), ...getRelationsTo(id)])
export const getRelationsByKind = (relationKind: string) => Object.freeze(data.relations.filter(relation => relation.relationKind === relationKind))

export const getFunctionsForArea = (areaId: string) => uniqueEntities(
  getRelationsFrom(areaId)
    .filter(relation => relation.relationKind === 'CONTAINS_LOGICAL_FUNCTION')
    .map(relation => getEntity(relation.targetId)),
)

export const getSignalsForFunction = (functionId: string) => uniqueEntities(
  getRelationsFrom(functionId)
    .filter(relation => relation.relationKind === 'PRODUCES_SIGNAL' || relation.relationKind === 'CONSUMES_SIGNAL')
    .map(relation => getEntity(relation.targetId)),
)

export const getInterfacesForFunction = (functionId: string) => uniqueEntities([
  ...getRelationsFrom(functionId)
    .filter(relation => relation.relationKind === 'PROVIDES_INTERFACE')
    .map(relation => getEntity(relation.targetId)),
  ...getRelationsTo(functionId)
    .filter(relation => relation.relationKind === 'CONNECTS_TO_FUNCTION')
    .map(relation => getEntity(relation.sourceId)),
])

export const getRequirementsForEntity = (id: string) => {
  const entity = getEntity(id)
  if (entity?.entityKind === 'REQUIREMENT') return Object.freeze([entity])
  return uniqueEntities(getRelations(id).map(relation => {
    const otherId = relation.sourceId === id ? relation.targetId : relation.sourceId
    const other = getEntity(otherId)
    return other?.entityKind === 'REQUIREMENT' ? other : undefined
  }))
}

export const getTestsForRequirement = (requirementId: string) => uniqueEntities(
  getRelations(requirementId).map(relation => {
    const otherId = relation.sourceId === requirementId ? relation.targetId : relation.sourceId
    const other = getEntity(otherId)
    return other?.entityKind === 'TEST_CASE' ? other : undefined
  }),
)

export const getCaseRelations = (caseId: string) => getEntity(caseId)?.entityKind === 'CASE'
  ? getRelations(caseId)
  : Object.freeze([])

export function validateReferenceVehicleRegistry(): ReferenceVehicleValidationResult {
  const seen = new Set<string>(), duplicateIds = new Set<string>()
  for (const entity of data.entities) {
    if (seen.has(entity.id)) duplicateIds.add(entity.id)
    seen.add(entity.id)
  }
  const validKinds = new Set(Object.keys(EXPECTED_REFERENCE_VEHICLE_COUNTS))
  const unknownEntityKinds = [...new Set(data.entities.map(entity => entity.entityKind).filter(kind => !validKinds.has(kind)))]
  const danglingRelations = data.relations.filter(relation => !seen.has(relation.sourceId) || !seen.has(relation.targetId))
  const invalidRelationDirections = data.relations.filter(relation => {
    const sourceKind = entityById.get(relation.sourceId)?.entityKind
    const targetKind = entityById.get(relation.targetId)?.entityKind
    const allowed = relationDirections[relation.relationKind]
    return !sourceKind || !targetKind || !allowed?.includes(`${sourceKind}>${targetKind}`)
  })
  const countMismatches = (Object.entries(EXPECTED_REFERENCE_VEHICLE_COUNTS) as [ReferenceVehicleEntityKind, number][])
    .flatMap(([kind, expected]) => data.counts[kind] === expected ? [] : [`${kind}: expected ${expected}, actual ${data.counts[kind]}`])
  return Object.freeze({
    duplicateIds: Object.freeze([...duplicateIds]),
    danglingRelations: Object.freeze(danglingRelations),
    invalidRelationDirections: Object.freeze(invalidRelationDirections),
    unknownEntityKinds: Object.freeze(unknownEntityKinds),
    countMismatches: Object.freeze(countMismatches),
    valid: duplicateIds.size === 0 && danglingRelations.length === 0 && invalidRelationDirections.length === 0 && unknownEntityKinds.length === 0 && countMismatches.length === 0,
  })
}
