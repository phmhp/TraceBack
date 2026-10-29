import type { ReactNode } from 'react'

export interface InvestigationTerm {
  easy:string
  technical:string
  description:string
}

const terms:Record<string,InvestigationTerm> = {
  AcceleratorPedalPosition:{easy:'가속 페달 입력',technical:'AcceleratorPedalPosition',description:'운전자가 가속 페달을 밟은 정도'},
  BrakePedalPosition:{easy:'제동 페달 입력',technical:'BrakePedalPosition',description:'운전자가 브레이크 페달을 밟은 정도'},
  SteeringInput:{easy:'조향 입력',technical:'SteeringInput',description:'운전자가 요청한 조향 방향과 크기'},
  GearState:{easy:'현재 기어 상태',technical:'GearState',description:'현재 선택되어 차량에 적용된 기어 상태'},
  PropulsionRequest:{easy:'추진 요청',technical:'PropulsionRequest',description:'운전자 입력을 바탕으로 만든 추진 요구'},
  DriveTorqueRequest:{easy:'구동 토크 요청',technical:'DriveTorqueRequest',description:'구동계에 전달하는 토크 요구값'},
  EDriveCommand:{easy:'구동 실행 명령',technical:'EDriveCommand',description:'eDrive가 실제 하류 구동 경로에 전달하는 명령'},
  VehicleSpeed:{easy:'차량 속도',technical:'VehicleSpeed',description:'차량이 실제로 움직이는 속도'},
  LongitudinalVelocity:{easy:'전후 방향 속도',technical:'LongitudinalVelocity',description:'차량 진행축 기준의 실제 속도'},
  DriveForce:{easy:'구동력',technical:'DriveForce',description:'차량을 앞뒤로 움직이도록 물리에 전달되는 힘'},
  BrakeForce:{easy:'제동력',technical:'BrakeForce',description:'차량 속도를 줄이도록 물리에 전달되는 힘'},
  SteeringAngle:{easy:'앞바퀴 조향각',technical:'SteeringAngle',description:'차량 방향을 바꾸기 위해 적용된 바퀴 각도'},
  VehicleMode:{easy:'차량 운행 상태',technical:'VehicleMode',description:'차량이 주행 가능한지 나타내는 현재 모드'},
  PropulsionPermission:{easy:'추진 허용 상태',technical:'PropulsionPermission',description:'현재 조건에서 구동 출력을 허용하는지 나타내는 상태'},
  EnergyStatus:{easy:'에너지 사용 가능 상태',technical:'EnergyStatus',description:'구동에 필요한 에너지를 사용할 수 있는지 나타내는 상태'},
  Validity:{easy:'신호 유효 여부',technical:'Validity',description:'현재 값을 계산에 사용해도 되는지 나타내는 상태'},
  REQUEST:{easy:'요청값',technical:'REQUEST',description:'상류 기능이 다음 기능에 요구하는 값'},
  COMMAND:{easy:'실행 명령값',technical:'COMMAND',description:'하류 실행 경로로 전달되는 명령'},
  ACTUAL:{easy:'실제 관찰값',technical:'ACTUAL',description:'사건 또는 시험에서 실제로 기록된 값'},
  EXPECTED:{easy:'기대값',technical:'EXPECTED',description:'요구사항과 오라클에 따라 나와야 하는 값'},
  VMC:{easy:'추진 토크 계산',technical:'VMC',description:'추진 요청과 차량 상태로 구동 토크 요구를 계산하는 현재 실행 기능'},
  eDrive:{easy:'구동 명령 생성',technical:'eDrive',description:'토크 요구에 방향과 제한을 적용해 구동 명령을 만드는 기능'},
  GearLogic:{easy:'변속 허용 판단',technical:'GearLogic',description:'현재 상태에서 요청한 기어 전환을 허용할지 판단하는 기능'},
  PropulsionFunction:{easy:'운전자 추진 의도 해석',technical:'PropulsionFunction',description:'페달과 기어 상태를 추진 요청으로 바꾸는 기능'},
  DriveAdapter:{easy:'구동력 변환',technical:'DriveAdapter',description:'구동 명령을 차량 물리에 적용할 힘으로 변환하는 경계'},
  DriveAdapterExecution:{easy:'구동력 변환',technical:'DriveAdapterExecution',description:'구동 명령을 차량 물리에 적용할 힘으로 변환하는 실행 기능'},
  BrakeAdapter:{easy:'제동력 변환',technical:'BrakeAdapter',description:'제동 요청을 차량 물리에 적용할 힘으로 변환하는 경계'},
  BrakingExecution:{easy:'제동력 계산',technical:'BrakingExecution',description:'제동 입력을 실제 물리 제동력으로 변환하는 실행 기능'},
  SteeringAdapter:{easy:'조향각 변환',technical:'SteeringAdapter',description:'조향 요청을 차량 물리에 적용할 각도로 변환하는 경계'},
  SteeringExecution:{easy:'조향각 계산',technical:'SteeringExecution',description:'조향 입력을 실제 앞바퀴 조향각으로 변환하는 실행 기능'},
  VehiclePhysics:{easy:'실제 차량 반응',technical:'VehiclePhysics',description:'구동·제동·조향 명령을 받아 물리적으로 움직이는 차량'},
  DriverInput:{easy:'운전자·환경 입력',technical:'DriverInput',description:'운전자 조작과 주행 환경에서 들어오는 입력'},
}

const splitIdentifier=(id:string)=>id
  .replace(/([a-z0-9])([A-Z])/g,'$1 $2')
  .replace(/[_./-]+/g,' ')
  .trim()

export function investigationTerm(id:string|undefined,fallback?:string,description?:string):InvestigationTerm{
  const technical=id||fallback||'—'
  const registered=id?terms[id]:undefined
  return registered??{
    easy:fallback&&fallback!==id?fallback:splitIdentifier(technical),
    technical,
    description:description??fallback??'등록된 쉬운 설명이 없습니다.',
  }
}

export function formatInvestigationTerm(id:string,fallback?:string){
  const term=investigationTerm(id,fallback)
  return term.easy===term.technical?term.easy:`${term.easy} · ${term.technical}`
}

interface TechnicalTermProps{
  id:string
  fallback?:string
  description?:string
  compact?:boolean
  as?:'span'|'div'
  trailing?:ReactNode
}

export function TechnicalTerm({id,fallback,description,compact=false,as='span',trailing}:TechnicalTermProps){
  const term=investigationTerm(id,fallback,description)
  const Tag=as
  return <Tag className={`investigation-term ${compact?'compact':''}`} title={term.description}>
    <strong>{term.easy}</strong>
    {term.technical!==term.easy&&<code>{term.technical}</code>}
    {trailing}
  </Tag>
}

export const investigationTerms=terms
