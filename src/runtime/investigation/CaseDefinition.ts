export interface FailureType { id:string; label:string; causes:{id:string;label:string}[] }
export const failureTypes: FailureType[] = [
  {id:'LOGIC_CALCULATION',label:'Logic / Calculation',causes:[{id:'INCORRECT_SCALING',label:'Incorrect Scaling · 잘못된 비율 계산'},{id:'INCORRECT_LIMIT',label:'Incorrect Limit · 잘못된 제한 로직'},{id:'INCORRECT_DIRECTION',label:'Incorrect Direction · 방향 계산 오류'}]},
  {id:'STATE_MODE',label:'State / Mode',causes:[{id:'STATE_TRANSITION',label:'잘못된 상태 전이'}]},
  {id:'INTERFACE_SIGNAL',label:'Interface / Signal',causes:[{id:'SIGNAL_MAPPING',label:'잘못된 신호 전달'}]},
  {id:'TIMING_EXECUTION',label:'Timing / Execution',causes:[{id:'MISSED_EXECUTION',label:'호출 지연 또는 누락'}]},
  {id:'DATA_CALIBRATION',label:'Data / Calibration',causes:[{id:'INCORRECT_CALIBRATION',label:'잘못된 보정값'}]},
  {id:'FAULT_HANDLING_MONITORING',label:'Fault Handling / Monitoring',causes:[{id:'MONITOR_REACTION',label:'감시·반응 조건 오류'}]},
]
export interface RootCauseDefinition { location:string; failureType:string; detailedCause:string; requirementIds:string[]; explanation:string }
export interface CaseDefinition {
  id:string; version:string; title:string; symptom:string; guidance:'GUIDED'; incidentPath:string[]
  relatedRequirements:string[]; relatedTestCases:string[]; rootCause:RootCauseDefinition
  evidenceRules:{minimumInputs:number; expectedRatio:number; ratioTolerance:number; numericTolerance:number; unsaturatedOnly:boolean}
}
/** Canonical author definition. C remains the source of executed fault behavior. */
export const propulsionCaseDefinition: CaseDefinition = {
  id:'CASE-PT-001',version:'0.3.0',title:'Acceleration Response Degradation',
  symptom:'GearState가 D일 때 가속 페달 입력에 비해 차량의 가속 반응이 약합니다.',guidance:'GUIDED',
  incidentPath:['DriverInput','GearLogic','PropulsionFunction','VMC','eDrive','DriveAdapter','VehiclePhysics'],
  relatedRequirements:['SYSR-PROP-009','SWR-VMC-001','SWR-EDR-001'],relatedTestCases:['TC-PROP-NORMAL-009','TC-PROP-NORMAL-010A','TC-PROP-NORMAL-010B'],
  rootCause:{location:'eDrive',failureType:'LOGIC_CALCULATION',detailedCause:'INCORRECT_SCALING',requirementIds:['SWR-EDR-001'],explanation:'eDrive의 정상 clamp 결과에 불필요한 0.5 배율이 적용됐습니다. 보정값 오류가 아니라 코드 경로의 계산 오류입니다.'},
  evidenceRules:{minimumInputs:2,expectedRatio:.5,ratioTolerance:.01,numericTolerance:1e-6,unsaturatedOnly:true},
}

