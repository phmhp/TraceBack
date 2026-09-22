export type EvidenceType = 'INCIDENT_FRAME' | 'SIGNAL_BOUNDARY' | 'TEST_RESULT' | 'REQUIREMENT' | 'TEST_CASE'
export interface Evidence {
  id:string; type:EvidenceType; title:string; source:'DRIVE_RECORDING'|'STANDARD_TEST'|'C_WASM'|'GROUND_TRUTH'
  relatedComponent:string; relatedRequirementIds:string[]; relatedTestCaseIds:string[]
  reference:{frameId?:number;runId?:number;requirementId?:string;testCaseId?:string}
  discovered:boolean; selectedForReport:boolean; status:'OBSERVED'|'MATCH'|'MISMATCH'|'REFERENCE'
}
export interface RootCauseReport { faultLocation:string; failureType:string; detailedCause:string; evidenceIds:string[] }
export interface EvidenceAssessment { sufficient:boolean; reasons:string[]; ratios:number[]; supportingRunIds:number[] }
