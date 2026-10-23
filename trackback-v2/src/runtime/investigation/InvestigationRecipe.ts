export type GameplayClueId = 'PHENOMENON'|'FAULT_BOUNDARY'|'PROOF'
export type InvestigationRecipeStepId = GameplayClueId|'DIAGNOSIS'|'REPAIR'

export interface InvestigationObjectiveDefinition {
  id:string
  label:string
  points:number
  completion:'INCIDENT_EVIDENCE'|'BOUNDARY_PAIR'|'FORMAL_PROOF'|'SUPPORTED_DIAGNOSIS'|'VERIFIED_REPAIR'
}

export interface InvestigationRecipeStep {
  id:InvestigationRecipeStepId
  label:string
  question:string
  guidance:string
  recommendedTools:string[]
  focusTargets:string[]
  hintLevels:readonly [string,string,string]
  clue?:GameplayClueId
  unlocksRootCause?:boolean
  objectives:readonly InvestigationObjectiveDefinition[]
}

export interface InvestigationRecipe {
  caseId:string
  version:string
  score:{hintLevelPenalty:number}
  steps:readonly InvestigationRecipeStep[]
}

export const casePt001InvestigationRecipe:InvestigationRecipe = {
  caseId:'CASE-PT-001',version:'1.0',score:{hintLevelPenalty:10},
  steps:[
    {id:'PHENOMENON',clue:'PHENOMENON',label:'현상',question:'실제 차량 반응에서 무엇이 이상했나요?',guidance:'사건 시점의 입력과 실제 차량 반응을 함께 확인해 기록하세요.',recommendedTools:['현상 파악'],focusTargets:['INCIDENT_OBSERVATION'],hintLevels:['원인보다 먼저 실제 차량 반응을 확인하세요.','현상 파악에서 사건 시점의 입력과 Actual을 비교하세요.','VehicleSpeed 사건 관찰을 조사 기록으로 저장하세요.'],objectives:[{id:'PT001-OBJ-PHENOMENON',label:'실제 사건 관찰 확보',points:50,completion:'INCIDENT_EVIDENCE'}]},
    {id:'FAULT_BOUNDARY',clue:'FAULT_BOUNDARY',label:'경계',question:'정상은 어디까지 전달됐고 어디서 처음 달라졌나요?',guidance:'저장한 MATCH와 MISMATCH 근거를 마지막 정상·첫 이상으로 지정하세요.',recommendedTools:['구조 및 기능','연관 신호','인터페이스'],focusTargets:['SIGNAL_COMPARISON','INTERFACE_COMPARISON'],hintLevels:['차량 반응에서 입력 방향으로 한 기능씩 거슬러 올라가세요.','같은 시점의 VMC 출력과 eDrive 출력을 비교하세요.','DriveTorqueRequest의 정상 근거와 EDriveCommand의 첫 차이 근거를 각각 지정하세요.'],objectives:[{id:'PT001-OBJ-LAST-NORMAL',label:'마지막 정상 근거 지정',points:75,completion:'BOUNDARY_PAIR'},{id:'PT001-OBJ-FIRST-ABNORMAL',label:'첫 이상 근거 지정',points:75,completion:'BOUNDARY_PAIR'}]},
    {id:'PROOF',clue:'PROOF',label:'증명',question:'남은 후보를 구분할 수 있는 시험은 무엇인가요?',guidance:'요구사항을 기준으로 서로 다른 입력에서 정식 컴포넌트 근거를 확보하세요.',recommendedTools:['가설 검증','컴포넌트 Workbench'],focusTargets:['COMPONENT_MODEL_TEST'],hintLevels:['남은 후보에 서로 다른 입력을 주고 결과가 반복되는지 확인하세요.','독립 Expected가 있는 컴포넌트 Workbench를 사용하세요.','eDrive의 서로 다른 양의 비포화 입력 결과를 정식 검증 근거로 저장하세요.'],unlocksRootCause:true,objectives:[{id:'PT001-OBJ-PROOF',label:'정식 컴포넌트 증명 확보',points:150,completion:'FORMAL_PROOF'}]},
    {id:'DIAGNOSIS',label:'결론',question:'현재 근거가 지지하는 원인 위치와 실패 방식은 무엇인가요?',guidance:'확보한 근거만 사용해 결론을 제출하세요.',recommendedTools:['결론 제출'],focusTargets:['ROOT_CAUSE_REPORT'],hintLevels:['세 단서의 근거를 다시 확인하세요.','첫 이상과 컴포넌트 시험이 같은 기능을 가리키는지 확인하세요.','근거가 지지하는 위치·방식·요구사항을 함께 제출하세요.'],objectives:[{id:'PT001-OBJ-DIAGNOSIS',label:'근거 기반 결론',points:200,completion:'SUPPORTED_DIAGNOSIS'}]},
    {id:'REPAIR',label:'수리',question:'현재 근거가 지지하는 수정은 무엇인가요?',guidance:'수정 후 재현·회귀 시험까지 통과해야 레이스로 복귀합니다.',recommendedTools:['수리 검증'],focusTargets:['REPAIR_REGRESSION'],hintLevels:['진단과 직접 연결된 수정안을 고르세요.','원인과 무관한 보정은 회귀 실패를 만들 수 있습니다.','정상 scaling을 복원한 뒤 재현·회귀 시험을 실행하세요.'],objectives:[{id:'PT001-OBJ-REPAIR',label:'수리·회귀 검증',points:250,completion:'VERIFIED_REPAIR'}]},
  ],
}

export const recipeForCase = (caseId:string) => caseId===casePt001InvestigationRecipe.caseId?casePt001InvestigationRecipe:undefined
export const clueSteps = (recipe:InvestigationRecipe) => recipe.steps.filter((step):step is InvestigationRecipeStep&{clue:GameplayClueId}=>Boolean(step.clue))

