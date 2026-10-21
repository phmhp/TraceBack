import type {Graph,Mission} from '../engine/types.ts'
import {LogicSimulation} from '../engine/simulation.ts'
export type VehicleArea='ready'|'gear'|'propulsion'|'braking'|'steering'|'energy'
/** Curated responsibilities, not an assertion that canonical candidate aliases execute. */
export const VEHICLE_AREAS=[
 {id:'ready',name:'출발 준비',icon:'key',point:[190,120],color:'#8875d5',question:'지금 출발해도 되는 상태일까?',operation:'버튼 이벤트 + 브레이크 + 준비 → READY → 구동 허용',source:['TRAINING-READY'],status:'직접 만드는 기능'},
 {id:'gear',name:'기어',icon:'gear',point:[440,80],color:'#559bcb',question:'요청 기어와 실제 적용 기어는 같을까?',operation:'D↔R 요청 → 속도 조건 확인 → 적용 또는 이전 기어 유지',source:['LF-GEAR-INTERLOCK','LF-GEAR-STATE','SWR-GEAR-001'],status:'기존 C 실행기'},
 {id:'propulsion',name:'구동',icon:'motor',point:[705,160],color:'#20afa5',question:'페달 입력이 어떻게 바퀴의 힘이 될까?',operation:'유효 입력 → 정규화 요구 → 토크 변환·제한 → 힘 → 속도',source:['LF-PROP-INTERP','LF-PROP-GEN','LF-PROP-EDRV','SWR-PROP-003','SWR-VMC-001','SWR-EDR-001'],status:'실행·수치 로직 제작'},
 {id:'braking',name:'제동',icon:'brake',point:[655,355],color:'#d77d97',question:'페달을 밟으면 무엇이 줄어들까?',operation:'제동 입력 → 유효성 → 선택 요구 → 마찰 제동력 → 속도 변화',source:['LF-BRK-ACQ','LF-BRK-CMD','DriverInputRuntime.brake'],status:'기존 TS 실행기'},
 {id:'steering',name:'조향',icon:'wheel',point:[350,380],color:'#6cadd2',question:'핸들 입력과 바퀴 각도는 같은 값일까?',operation:'정규화 입력 → 속도에 따른 각도 제한 → 앞바퀴 조향',source:['LF-ACT-STEER','DriverInputRuntime.steering'],status:'기존 TS 실행기'},
 {id:'energy',name:'에너지',icon:'battery',point:[110,320],color:'#92b5ad',question:'배터리가 공급할 수 있는 힘은?',operation:'현재는 참고 설계. 실제 SOC·회생 배분·배터리 동특성은 실행하지 않아요.',source:['EnergyDriveTorqueLimit'],status:'참고만 · 모델 미구현'},
] as const
export const READY_REGIONS=[
 [{name:'버튼·브레이크 조건',nodes:['power','brake','both']},{name:'시스템 준비 결합',nodes:['both','system','allow']},{name:'진입 요청 출력',nodes:['allow','request']}],
 [{name:'전원 깨우기',nodes:['power','off','standby','wake']},{name:'READY 진입',nodes:['allow','standby','ready','start']},{name:'정차 후 종료',nodes:['power','stopped','shutdown','stop','off']},{name:'표시·구동 허용',nodes:['ready','lamp','drive']}],
 [{name:'전체 READY 기능 대조',nodes:['power','brake','system','allow','ready','lamp','drive']}],
]
export function normalScenarioTrace(graph:Graph,mission:Mission){
 const scenario=mission.scenarios.find(s=>s.id===(mission.mode==='logic'?'logic-7':'boot'))!
 const engine=new LogicSimulation(scenario.initial,mission.mode)
 return scenario.steps.map((expected,index)=>({index,expected,actual:engine.step(graph,expected.inputs)}))
}
export const CURATED_SOURCES=[
 {id:'DriverInputRuntime.accelerator',use:'운전자 가속 입력 0~1을 실제 C 입력 옆에 표시',decision:'REUSE_RUNTIME',note:'실제 페달 센서 %인 AcceleratorPedalPosition과 별칭 처리하지 않음'},
 {id:'LF-GEAR-INTERLOCK',use:'D/R 요청과 적용 상태의 차이를 주행 중 표시',decision:'REUSE_RUNTIME',note:'조건은 기존 게임 캘리브레이션. 양산 기어 사양 아님'},
 {id:'LF-PROP-INTERP',use:'유효성·방향·정규화 구동 요구를 연결해서 관찰',decision:'REUSE_RUNTIME',note:'실제 값은 C 스냅샷으로부터 읽음'},
 {id:'LF-PROP-GEN',use:'요구 ratio → 속도 기반 Nm 변환 설명',decision:'REUSE_RUNTIME',note:'기존 VMC 캘리브레이션을 사용'},
 {id:'LF-PROP-EDRV',use:'토크 요구와 제한 후 명령 비교',decision:'REUSE_RUNTIME',note:'명령은 실제 모터 토크 측정값이 아님'},
 {id:'DriveTorqueRequest',use:'VMC → eDrive 경계의 크기·방향·유효성',decision:'REUSE_RUNTIME',note:'입력 시험 범위와 전체 출력 범위를 구분'},
 {id:'EDriveCommand',use:'명령 → 어댑터 → 물리 반응을 구분',decision:'REUSE_RUNTIME',note:'물리 힘/속도와 동일량으로 표시하지 않음'},
 {id:'DriverInputRuntime.brake',use:'마찰 제동 요구와 힘·속도 반응 연결',decision:'REUSE_RUNTIME',note:'ABS·회생제동 미구현'},
 {id:'DriverInputRuntime.steering',use:'정규화 조향과 실제 앞바퀴 명령 각도 비교',decision:'REUSE_RUNTIME',note:'-1~1은 rad가 아님'},
 {id:'IFC-DESIGN-003',use:'경계 설계 참고',decision:'REFERENCE_ONLY',note:'PropulsionRequest 별칭 미승인. 실행 인터페이스로 승격하지 않음'},
 {id:'ActualDriveTorque',use:'명령/실제의 차이를 설명할 때만 사용',decision:'DEFER',note:'독립 측정·추정 소스 없음. C 명령을 복제해 actual로 표시 금지'},
 {id:'LF-BRK-BLEND',use:'향후 에너지 연계 학습 후보',decision:'DEFER',note:'회생·마찰 배분 모델과 에너지 제약 미구현'},
 {id:'EnergyDriveTorqueLimit',use:'향후 상한 생산자 설계 후보',decision:'DEFER',note:'생산자 실제값 없음. 교육용 수동 cap과 혼동 금지'},
] as const
