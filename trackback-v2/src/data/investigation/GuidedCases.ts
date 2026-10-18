import { defaultExperimentOptions } from '../../runtime/case/CaseExperiment.ts'
import { validateGuidedCase, type GuidedCaseDefinition } from '../../runtime/investigation/GuidedCase.ts'

export const propulsionGuidedCase=validateGuidedCase({
  caseId:'CASE-PT-001',
  version:'2.0.0',
  driverStatement:'“D로 달리면서 액셀을 밟았는데, 차가 평소처럼 나가지 않았어요.”',
  observe:{
    question:'운전자의 말을 측정 가능한 현상으로 바꾸면 무엇인가요?',
    context:'원인을 고르기 전에 운전자 입력과 실제 차량 반응이 처음 달라진 순간을 확인합니다.',
    observations:[
      {id:'pedal',label:'가속 입력',metric:'ACCELERATOR_PERCENT',unit:'%'},
      {id:'gear',label:'실제 기어',metric:'GEAR_STATE'},
      {id:'speed',label:'차량 속력',metric:'SPEED_KPH',unit:'km/h'},
      {id:'time',label:'선택 시점',metric:'EXECUTION_TIME',unit:'s'},
    ],
    choices:[
      {id:'no-input',label:'가속 입력 자체가 없었다',feedback:'사건 기록에는 유효한 가속 입력이 있습니다. 입력과 반응을 다시 함께 보세요.'},
      {id:'weak-response',label:'가속 입력은 있었지만 구동 출력이 정상 기준보다 작았다',feedback:'현상을 원인과 분리했습니다. 이제 최초 차이가 어디에서 생겼는지 추적할 수 있습니다.',correct:true},
      {id:'road-cause',label:'도로 마찰이 원인이라고 확정됐다',feedback:'현재 기록만으로 환경 원인을 확정할 수 없습니다. 현상과 원인 가설을 구분하세요.'},
    ],
    expectedMetric:'EXPECTED_OUTPUT',actualMetric:'ACTUAL_OUTPUT',chartLabel:'기대 구동 명령과 실제 구동 명령',
  },
  domain:{
    question:'이 현상을 만드는 기능 경로를 어느 도메인에서 먼저 찾아야 할까요?',
    domains:[
      {id:'DRIVER_STATE',label:'운전자·차량 상태',summary:'페달, 기어 요청, READY와 기능 허용 상태',nodeIds:['DriverInput','VehicleState','GearLogic'],relevant:false,feedback:'전제조건 확인에는 필요하지만 현재 현상의 최초 출력 차이를 설명하는 중심 경로는 아닙니다.'},
      {id:'PROPULSION',label:'추진·구동',summary:'추진 요청, 토크 계산, eDrive 명령과 차량 구동력',nodeIds:['PropulsionFunction','VMC','eDrive','DriveAdapter'],relevant:true,feedback:'운전자 가속 요청이 실제 구동력으로 변환되는 인과 경로입니다. 이 도메인을 확대합니다.'},
      {id:'CHASSIS',label:'제동·조향',summary:'서비스 브레이크와 조향 실행',nodeIds:['BrakingExecution','SteeringExecution'],relevant:false,feedback:'이번 기록에서는 브레이크와 조향이 안정적입니다. 가능성을 완전히 삭제하지 않고 우선순위를 낮춥니다.'},
      {id:'PLANT',label:'차량·환경 반응',summary:'차량 동역학, 노면과 실제 속도 변화',nodeIds:['VehiclePhysics'],relevant:false,feedback:'실제 반응은 여기서 관찰하지만, 먼저 명령이 정상적으로 도달했는지 확인해야 원인 범위를 줄일 수 있습니다.'},
    ],
  },
  localize:{
    question:'추진 기능 체인에서 어디까지 정상이고 어디서부터 달라질까요?',
    boundaries:[
      {id:'vmc-output',kind:'LAST_NORMAL',componentId:'VMC',signalId:'DriveTorqueRequest',label:'VMC 토크 요청',question:'상류 제어기가 만든 요청은 기준과 일치하나요?',expectedMeaning:'일치하면 운전자 입력부터 VMC 출력까지를 우선 배제할 수 있습니다.'},
      {id:'edrive-output',kind:'FIRST_ABNORMAL',componentId:'eDrive',signalId:'EDriveCommand',label:'eDrive 구동 명령',question:'바로 다음 기능의 출력은 같은 기준을 만족하나요?',expectedMeaning:'처음 달라진 출력은 eDrive 내부 또는 인접 인터페이스를 후보로 남깁니다.'},
    ],
  },
  discriminate:{
    question:'남은 원인 후보를 가장 잘 구별하는 시험은 무엇인가요?',
    hypotheses:[
      {id:'edrive-scaling',label:'eDrive 내부 비율 계산 오류',category:'INTERNAL_LOGIC',location:'eDrive',prediction:'입력 크기를 바꿔도 Actual/Expected 비율이 비슷하게 반복됩니다.',evidenceFit:'SUPPORTED',feedback:'현재 경계 증거와 일치하지만, 서로 다른 입력에서 패턴이 반복되는지 시험해야 합니다.',report:{faultLocation:'eDrive',failureType:'LOGIC_CALCULATION',detailedCause:'INCORRECT_SCALING'}},
      {id:'interface-mapping',label:'VMC → eDrive 인터페이스 매핑 오류',category:'INTERFACE',location:'eDrive',prediction:'송신 값과 수신 값 사이에서 단위·스케일 차이가 나타납니다.',evidenceFit:'POSSIBLE',feedback:'현재 사건 기록은 eDrive의 내부 수신값을 별도로 제공하지 않아 아직 배제할 수 없습니다.',report:{faultLocation:'eDrive',failureType:'INTERFACE_SIGNAL',detailedCause:'SIGNAL_MAPPING'}},
      {id:'torque-calibration',label:'토크 제한 보정값 오류',category:'STATE_CALIBRATION',location:'eDrive',prediction:'특정 한계 부근에서만 출력이 잘리며 낮은 입력은 정상이어야 합니다.',evidenceFit:'POSSIBLE',feedback:'여러 비포화 입력에서도 같은 비율 차이가 나면 이 가설과 구별할 수 있습니다.',report:{faultLocation:'eDrive',failureType:'DATA_CALIBRATION',detailedCause:'INCORRECT_CALIBRATION'}},
    ],
    testPlans:[
      {id:'single-repeat',label:'같은 입력 90을 한 번 더 실행',rationale:'재현성은 확인하지만 비율 계산과 상한 보정을 충분히 구별하지 못합니다.',fixedConditions:['D','VALID','FORWARD'],changedInput:'변경 없음',observedOutput:'EDriveCommand',target:'eDrive',first:90,options:defaultExperimentOptions(),discriminating:false},
      {id:'two-unsaturated-inputs',label:'조건은 고정하고 비포화 입력 45와 90 비교',rationale:'서로 다른 입력에서 비율이 반복되는지 확인해 스케일링과 단순 상한 보정을 구별합니다.',fixedConditions:['Gear D','Validity VALID','Direction FORWARD'],changedInput:'DriveTorqueRequest 45 → 90',observedOutput:'EDriveCommand / Expected',target:'eDrive',first:45,second:90,options:defaultExperimentOptions(),discriminating:true},
      {id:'change-everything',label:'기어·방향·입력을 모두 변경',rationale:'여러 변수가 동시에 바뀌어 어떤 조건이 결과를 만들었는지 해석하기 어렵습니다.',fixedConditions:[],changedInput:'Gear, direction, magnitude',observedOutput:'여러 출력',target:'eDrive',first:45,second:90,options:{...defaultExperimentOptions(),direction:'REVERSE'},discriminating:false},
    ],
  },
  verify:{
    question:'시험 결과가 실제로 지지하는 설명은 무엇인가요?',
    interpretations:[
      {id:'fail-is-cause',label:'FAIL이므로 내부 코드 원인이 자동 확정됐다',feedback:'FAIL은 이 시험 범위가 기준을 만족하지 않았다는 뜻입니다. 원인은 반복 패턴과 경계 증거를 함께 해석해야 합니다.'},
      {id:'ratio-pattern',label:'두 입력에서 비슷한 비율 차이가 반복되어 스케일링 가설을 지지한다',feedback:'시험이 말할 수 있는 범위 안에서 해석했습니다. 이 결과를 경계 증거와 함께 사용할 수 있습니다.',correct:true},
      {id:'normal',label:'두 결과 모두 정상 범위다',feedback:'Expected와 Actual을 행별로 다시 비교하세요.'},
    ],
  },
  resolve:{
    question:'현재 근거에 직접 대응하는 수리안을 선택하세요.',
    repairs:[
      {id:'restore-scaling',label:'승인된 입력–출력 비율 복원',explanation:'진단된 계산 관계를 정상 baseline으로 되돌리고 회귀시험을 실행합니다.',variant:0},
      {id:'raise-limit',label:'토크 상한만 크게 변경',explanation:'증거가 가리키지 않은 보정값을 변경하므로 다른 조건에 영향을 줄 수 있습니다.',variant:2},
      {id:'flip-direction',label:'전진·후진 방향 처리 변경',explanation:'현재 현상과 관계없는 방향 로직 변경으로 회귀 실패 가능성이 큽니다.',variant:3},
    ],
  },
  scope:{
    OBSERVE:{title:'현상만 확정하는 범위',include:[
      {id:'driver-input',label:'운전자 입력',detail:'가속 페달, 기어, READY 상태'},
      {id:'vehicle-response',label:'차량 반응',detail:'기대 구동 명령과 실제 구동 명령'},
      {id:'first-change',label:'이상 시점',detail:'정상 기준에서 처음 벗어난 시점'},
    ],defer:['고장 부품과 내부 로직은 아직 확정하지 않습니다.']},
    DOMAIN:{title:'관련 영역을 찾는 범위',include:[
      {id:'whole-map',label:'전체 차량 지도',detail:'입력에서 실제 차량 반응까지의 큰 흐름'},
      {id:'causal-domain',label:'직접 인과 도메인',detail:'현상과 가장 가까운 기능 영역'},
      {id:'adjacent-domain',label:'인접 도메인',detail:'우선순위를 낮출 수 있는 정상 영역'},
    ],defer:['개별 신호 값과 코드 결함은 다음 단계에서 확인합니다.']},
    LOCALIZE:{title:'경계를 좁히는 범위',include:[
      {id:'same-time',label:'같은 사건 시점',detail:'서로 다른 시점의 값을 섞지 않기'},
      {id:'last-normal',label:'마지막 정상',detail:'기준과 일치하는 가장 하류 신호'},
      {id:'first-abnormal',label:'첫 이상',detail:'기준과 처음 달라지는 출력'},
    ],defer:['첫 이상은 원인 확정이 아니라 조사 범위입니다.']},
    DISCRIMINATE:{title:'가설을 구별하는 범위',include:[
      {id:'prediction',label:'가설별 예측',detail:'맞다면 무엇이 관찰되어야 하는지'},
      {id:'fixed',label:'고정 조건',detail:'기어, 유효성, 방향을 동일하게 유지'},
      {id:'changed',label:'변경 변수',detail:'입력 크기 한 가지만 변경'},
    ],defer:['시험 실행 전에는 가장 그럴듯한 가설도 정답이 아닙니다.']},
    VERIFY:{title:'시험 결과를 해석하는 범위',include:[
      {id:'row-compare',label:'행별 비교',detail:'각 입력의 Expected와 Actual'},
      {id:'repeat-pattern',label:'반복 패턴',detail:'입력이 달라도 같은 비율 차이인지'},
      {id:'claim-limit',label:'말할 수 있는 범위',detail:'FAIL과 원인 확정을 구분'},
    ],defer:['이 시험에서 관찰하지 않은 인터페이스까지 단정하지 않습니다.']},
    RESOLVE:{title:'결론과 수리를 확인하는 범위',include:[
      {id:'evidence-chain',label:'근거 연결',detail:'현상, 경계, 시험 결과가 한 설명을 지지'},
      {id:'direct-repair',label:'직접 대응 수리',detail:'확인된 실패 방식만 변경'},
      {id:'regression',label:'회귀 확인',detail:'재현 조건과 정상 조건을 모두 시험'},
    ],defer:['주행 점수와 공학적 판정은 별도로 유지합니다.']},
  },
  visualModel:{
    title:'운전자 요청이 실제 구동력으로 바뀌는 경로',
    caption:'사건 시점의 운전자 의도, 제어 신호, 기계적 반응을 같은 세로선에서 비교합니다.',
    layers:[
      {id:'intent',label:'운전자 의도',description:'운전자가 차에 요청한 조건',nodes:[
        {id:'pedal',label:'가속 페달',value:'80%',state:'NORMAL'},
        {id:'drive-state',label:'D · READY',value:'주행 허용',state:'NORMAL'},
        {id:'request',label:'추진 요청',value:'90 Nm',state:'NORMAL'},
      ]},
      {id:'control',label:'제어 신호',description:'소프트웨어 기능 사이의 값',nodes:[
        {id:'propulsion',label:'Propulsion',value:'90 Nm',state:'NORMAL'},
        {id:'vmc',label:'VMC',value:'90 Nm',state:'NORMAL'},
        {id:'edrive',label:'eDrive',value:'45 Nm',state:'ABNORMAL'},
      ]},
      {id:'physical',label:'기계적 반응',description:'명령이 실제 움직임이 되는 과정',nodes:[
        {id:'inverter',label:'인버터·모터',value:'토크 부족',state:'ABNORMAL'},
        {id:'gearset',label:'감속기·차동기',value:'동력 전달',state:'CONTEXT'},
        {id:'wheel',label:'구동륜',value:'가속 저하',state:'ABNORMAL'},
      ]},
    ],
  },
  readMetric:(metricId,frame)=>{
    switch(metricId){
      case 'ACCELERATOR_PERCENT':return frame.sw.input.acceleratorPedalPosition*100
      case 'BRAKE_PERCENT':return frame.brake*100
      case 'STEERING_PERCENT':return frame.steering*100
      case 'GEAR_STATE':return frame.sw.output.gearState
      case 'VEHICLE_READY':return frame.sw.input.vehicleReady
      case 'SPEED_KPH':return (frame.plant?.speed??frame.sw.input.vehicleSpeed)*3.6
      case 'EXECUTION_TIME':return frame.sw.executionTime
      case 'EXPECTED_OUTPUT':return frame.sw.output.driveTorqueRequest.magnitudeNm
      case 'ACTUAL_OUTPUT':return frame.sw.output.eDriveCommand.magnitudeNm
      default:throw new Error(`Unknown guided metric: ${metricId}`)
    }
  },
} satisfies GuidedCaseDefinition)

const guidedCases=new Map([[propulsionGuidedCase.caseId,propulsionGuidedCase]])

export function guidedCaseFor(caseId:string):GuidedCaseDefinition{
  const definition=guidedCases.get(caseId)
  if(!definition)throw new Error(`Guided investigation is not authored for ${caseId}.`)
  return definition
}
