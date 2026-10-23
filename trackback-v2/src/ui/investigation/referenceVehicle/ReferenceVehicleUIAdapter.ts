import {
  getCaseRelations,
  getEntitiesByKind,
  getEntity,
  getFunctionsForArea,
  getInterfacesForFunction,
  getRelations,
  getRelationsFrom,
  getRequirementsForEntity,
  getSignalsForFunction,
  getTestsForRequirement,
  type ReferenceVehicleEntity,
} from '../../../referenceVehicle/index.ts'
import { getSignalDefinition } from '../../../registries/investigation/Architecture.ts'

export type ReferenceFocus = 'PRIMARY_FOCUS' | 'CONTEXT' | 'BACKGROUND'

const caseRelations = getCaseRelations('CASE-PT-001')
const caseEntityIds = new Set(caseRelations.map(relation => relation.targetId))
const caseAreaIds = new Set(
  [...caseEntityIds]
    .map(id => getEntity(id))
    .flatMap(entity => entity?.metadata.areaId ? [String(entity.metadata.areaId)] : []),
)

const containsOpenValue = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(containsOpenValue)
  if (typeof value !== 'string') return false
  return value.includes('OPEN') || value.includes('TBD') || value.includes('BLOCKED_BY_OPEN_DECISION')
}

export const referenceVehicleAreas = getEntitiesByKind('AREA')

const runtimeComponentReferenceFunction: Record<string, string> = {
  DriverInput: 'LF-DRV-ACQ',
  GearLogic: 'LF-GEAR-INTERLOCK',
  PropulsionFunction: 'LF-PROP-ACQ',
  VMC: 'LF-PROP-GEN',
  eDrive: 'LF-PROP-EDRV',
  BrakingExecution: 'LF-BRK-CMD',
  SteeringExecution: 'LF-STR-ACT',
  DriveAdapterExecution: 'LF-ACT-DRIVE',
  DriveAdapter: 'LF-ACT-DRIVE',
  BrakeAdapter: 'LF-ACT-BRAKE',
  SteeringAdapter: 'LF-ACT-STEER',
  VehiclePhysics: 'LF-PLANT-MOTION',
}

const runtimeInterfaceReferenceInterface: Record<string, string> = {
  'VMC->eDrive': 'IFC-DESIGN-004',
  'eDrive->DriveAdapter': 'IFC-DESIGN-005',
  'DriveAdapter->VehiclePhysics': 'IFC-DESIGN-006',
}

export const getReferenceEntity = (id: string) => getEntity(id)

export const getReferenceFunctionIdForComponent = (componentId: string) =>
  getEntity(componentId)?.entityKind === 'LOGICAL_FUNCTION'
    ? componentId
    : runtimeComponentReferenceFunction[componentId]

const referenceFunctionRuntimeComponent = Object.fromEntries(
  Object.entries(runtimeComponentReferenceFunction).map(([componentId, functionId]) => [functionId, componentId]),
) as Record<string, string>

/** Returns the existing executable/observable TrackBack component for a canonical function, when one exists. */
export const getRuntimeComponentForReferenceFunction = (functionId: string) =>
  referenceFunctionRuntimeComponent[functionId]

export const getReferenceFocus = (entity: ReferenceVehicleEntity): ReferenceFocus => {
  if (caseEntityIds.has(entity.id)) return 'PRIMARY_FOCUS'
  const areaId = String(entity.metadata.areaId ?? (entity.entityKind === 'AREA' ? entity.id : ''))
  return caseAreaIds.has(areaId) ? 'CONTEXT' : 'BACKGROUND'
}

export const hasOpenEngineeringDecision = (entity: ReferenceVehicleEntity) =>
  containsOpenValue(entity.implementationStatus)
  || containsOpenValue(entity.referenceStatus)
  || containsOpenValue(entity.approvalStatus)
  || containsOpenValue(entity.pathScope)
  || Object.values(entity.metadata).some(containsOpenValue)

export const getReferenceStatus = (entity: ReferenceVehicleEntity) => ({
  capability: entity.implementationStatus ?? 'STATUS_NOT_RECORDED',
  scope: entity.pathScope ?? entity.referenceStatus ?? 'SCOPE_NOT_RECORDED',
  approval: entity.approvalStatus ?? 'MATURITY_NOT_RECORDED',
  open: hasOpenEngineeringDecision(entity),
})

export const getReferenceFunctionContext = (functionId: string) => {
  const entity = getEntity(functionId)
  if (entity?.entityKind !== 'LOGICAL_FUNCTION') return undefined
  const relations = getRelationsFrom(functionId)
  const signals = getSignalsForFunction(functionId)
  const inputIds = new Set(relations.filter(relation => relation.relationKind === 'CONSUMES_SIGNAL').map(relation => relation.targetId))
  const outputIds = new Set(relations.filter(relation => relation.relationKind === 'PRODUCES_SIGNAL').map(relation => relation.targetId))
  const requirements = getRequirementsForEntity(functionId)
  return {
    entity,
    area: getEntity(String(entity.metadata.areaId ?? '')),
    inputs: signals.filter(signal => inputIds.has(signal.id)),
    outputs: signals.filter(signal => outputIds.has(signal.id)),
    interfaces: getInterfacesForFunction(functionId),
    requirements,
    tests: requirements.flatMap(requirement => getTestsForRequirement(requirement.id))
      .filter((test, index, all) => all.findIndex(item => item.id === test.id) === index),
    caseRelevant: caseEntityIds.has(functionId),
  }
}

export const getReferenceFunctionsForArea = (areaId: string) => getFunctionsForArea(areaId)

export const getReferenceSignalContext = (signalId: string) => {
  const entity = getEntity(signalId)
  if (entity?.entityKind !== 'SIGNAL') return undefined
  const relations = getRelations(signalId)
  return {
    entity,
    producers: relations.filter(relation => relation.relationKind === 'PRODUCES_SIGNAL').map(relation => getEntity(relation.sourceId)).filter(Boolean) as ReferenceVehicleEntity[],
    consumers: relations.filter(relation => relation.relationKind === 'CONSUMES_SIGNAL').map(relation => getEntity(relation.sourceId)).filter(Boolean) as ReferenceVehicleEntity[],
    interfaces: relations.filter(relation => relation.relationKind === 'TRANSFERS_SIGNAL').map(relation => getEntity(relation.sourceId)).filter(Boolean) as ReferenceVehicleEntity[],
    runtimeObservable: Boolean(getSignalDefinition(signalId)?.readIncidentActual),
  }
}

export const getReferenceInterfaceContext = (interfaceId: string) => {
  const entity = getEntity(interfaceId)
  if (entity?.entityKind !== 'INTERFACE') return undefined
  const relations = getRelations(interfaceId)
  return {
    entity,
    producers: relations.filter(relation => relation.relationKind === 'PROVIDES_INTERFACE').map(relation => getEntity(relation.sourceId)).filter(Boolean) as ReferenceVehicleEntity[],
    consumers: relations.filter(relation => relation.relationKind === 'CONNECTS_TO_FUNCTION').map(relation => getEntity(relation.targetId)).filter(Boolean) as ReferenceVehicleEntity[],
    signals: relations.filter(relation => relation.relationKind === 'TRANSFERS_SIGNAL').map(relation => getEntity(relation.targetId)).filter(Boolean) as ReferenceVehicleEntity[],
  }
}

export const getReferenceFunctionContextForComponent = (componentId: string) => {
  const functionId = getReferenceFunctionIdForComponent(componentId)
  return functionId ? getReferenceFunctionContext(functionId) : undefined
}

export const getReferenceInterfaceContextForRuntimeEdge = (interfaceId: string) => {
  const referenceId = getEntity(interfaceId)?.entityKind === 'INTERFACE'
    ? interfaceId
    : runtimeInterfaceReferenceInterface[interfaceId]
  return referenceId ? getReferenceInterfaceContext(referenceId) : undefined
}

export const getReferenceRequirementContext = (requirementId: string) => {
  const entity = getEntity(requirementId)
  if (entity?.entityKind !== 'REQUIREMENT') return undefined
  const relations = getRelations(requirementId)
  return {
    entity,
    functions: relations.filter(relation => ['ALLOCATED_TO_LOGICAL_FUNCTION', 'SATISFIES_LOGICAL_FUNCTION_SCOPE'].includes(relation.relationKind))
      .map(relation => getEntity(relation.sourceId === requirementId ? relation.targetId : relation.sourceId))
      .filter(item => item?.entityKind === 'LOGICAL_FUNCTION') as ReferenceVehicleEntity[],
    tests: getTestsForRequirement(requirementId),
  }
}

export const getReferenceTestContext = (testId: string) => {
  const entity = getEntity(testId)
  return entity?.entityKind === 'TEST_CASE' ? entity : undefined
}

export const trackbackVmcUiBoundary = Object.freeze({
  label: 'Trackback_VMC · 현재 실행 경로의 좁은 추진 토크 생성 역할',
  explanation: 'Reference Motion Coordination 전체 구현이 아닙니다. LF-MC-REQ/AUTH/LON/LAT/ALLOC은 별도의 DESIGN_ONLY Reference Design입니다.',
})
