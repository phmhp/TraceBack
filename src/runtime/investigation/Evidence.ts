export type EvidenceType = 'INCIDENT_FRAME' | 'SIGNAL_OBSERVATION' | 'SIGNAL_COMPARISON' | 'SIGNAL_BOUNDARY' | 'INTERFACE_COMPARISON' | 'TEST_RESULT' | 'REQUIREMENT' | 'TEST_CASE'
export type EvidenceStatus = 'OBSERVED' | 'MATCH' | 'MISMATCH' | 'REFERENCE'
export interface EvidenceDetails {
  subjectId?:string
  role?:'STATE'|'INPUT'|'OUTPUT'|'OBSERVATION'|'INTERFACE'
  timestamp?:number
  interval?:{start:number;end:number}
  actual?:string
  criterionKind?:'EXPECTED'|'VALID_RANGE'|'ALLOWED_STATE'|'REQUIREMENT_CONDITION'|'NONE'|'SOURCE_DESTINATION'
  criterionLabel?:string
  criterionValue?:string
  sourceValue?:string
  destinationValue?:string
  interpretation?:string
  condition?:string
  expectedBehavior?:string
  allocatedFunction?:string
  relatedTestCaseIds?:string[]
  hypothesisId?:string
  targetType?:string
  targetId?:string
  verificationMethod?:string
  executionMode?:'COMPONENT_MODEL_TEST'|'VEHICLE_SCENARIO_TEST'
  designTechnique?:string
  designOrigin?:'EXISTING_TEST_CASE'|'PLAYER_DESIGNED_EXPERIMENT'
    |'VEHICLE_SCENARIO_TEST'
  preconditions?:string[]
  stimulus?:unknown
  monitoredOutputIds?:string[]
  expectedCriterion?:string
  verdict?:'PASS'|'FAIL'|'OBSERVED'
  runIndex?:number
  variationGroupId?:string
  scenarioId?:string
  timing?:{durationSeconds:number;observationStartSeconds:number;observationEndSeconds:number;fixedTimestepSeconds:number}
  replayContext?:unknown
  faultInjection?:unknown
  faultTelemetry?:unknown
  interfaceTelemetry?:unknown
  interfaceComparison?:'MATCH'|'MISMATCH'|'UNAVAILABLE'
  returnContext?:{page:1|2|3|4;view?:'FLOW'|'SIGNALS'|'INTERFACES'|'STANDARDS';componentId?:string;signalId?:string;interfaceId?:string;requirementId?:string;frameIndex?:number}
}
export interface Evidence {
  id:string; type:EvidenceType; title:string; source:'DRIVE_RECORDING'|'STANDARD_TEST'|'C_WASM'|'GROUND_TRUTH'|'LIVE_VEHICLE_SCENARIO'
  relatedComponent:string; relatedRequirementIds:string[]; relatedTestCaseIds:string[]
  reference:{frameId?:number;runId?:number;scenarioId?:string;requirementId?:string;testCaseId?:string}
  discovered:boolean; selectedForReport:boolean; status:EvidenceStatus
  claim:string
  details?:EvidenceDetails
}
export interface RootCauseReport { faultLocation:string; failureType:string; detailedCause?:string; evidenceIds:string[] }
export interface EvidenceAssessment { sufficient:boolean; reasons:string[]; ratios:number[]; supportingRunIds:number[] }
