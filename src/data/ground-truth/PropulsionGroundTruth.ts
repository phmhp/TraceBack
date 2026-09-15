export type XRayNodeId = 'DriverInput' | 'GearLogic' | 'PropulsionFunction' | 'VMC' | 'eDrive' | 'VehiclePhysics'

export interface GroundTruthRequirement {
  id: string; level: 'SYSTEM' | 'SOFTWARE'; allocatedComponent: XRayNodeId
  statement: string; linkedRequirements: string[]; linkedTestCases: string[]
  status: 'APPROVED'; provenance: 'TRACKBACK_MODEL'
}
export interface GroundTruthTestCase {
  id: string; verificationLevel: string; testObject: string; precondition: string
  stimulus: string; observation: string; expectedResult: string
}

export const propulsionRequirements: GroundTruthRequirement[] = [
  { id:'SYSR-PROP-001',level:'SYSTEM',allocatedComponent:'PropulsionFunction',statement:'VehicleReady와 PropulsionEnable에 따라 propulsion availability를 결정하고 disabled 상태에서 non-zero request를 금지한다.',linkedRequirements:['SWR-PROP-001'],linkedTestCases:['TC-PROP-NORMAL-001','TC-PROP-NORMAL-002'],status:'APPROVED',provenance:'TRACKBACK_MODEL' },
  { id:'SYSR-PROP-002',level:'SYSTEM',allocatedComponent:'PropulsionFunction',statement:'Accelerator input 또는 actual GearState가 INVALID이면 magnitude 0, direction NONE, validity INVALID인 propulsion request를 출력한다.',linkedRequirements:['SWR-PROP-002'],linkedTestCases:['TC-PROP-NORMAL-003'],status:'APPROVED',provenance:'TRACKBACK_MODEL' },
  { id:'SYSR-PROP-003',level:'SYSTEM',allocatedComponent:'PropulsionFunction',statement:'Propulsion이 enabled이고 actual gear가 추진을 허용하면 valid accelerator input을 승인 pedal map에 따라 0부터 1 사이의 request magnitude로 변환한다.',linkedRequirements:['SWR-PROP-003'],linkedTestCases:['TC-PROP-NORMAL-005'],status:'APPROVED',provenance:'TRACKBACK_MODEL' },
  { id:'SYSR-PROP-004',level:'SYSTEM',allocatedComponent:'PropulsionFunction',statement:'Valid accelerator input이 0이면 magnitude 0과 direction NONE을 요청하며 brake, coast drag 또는 regeneration을 의미하지 않는다.',linkedRequirements:['SWR-PROP-003','SWR-PROP-004'],linkedTestCases:['TC-PROP-NORMAL-004'],status:'APPROVED',provenance:'TRACKBACK_MODEL' },
  { id:'SYSR-PROP-005',level:'SYSTEM',allocatedComponent:'PropulsionFunction',statement:'Actual GearState P는 VALID, magnitude 0, direction NONE인 정상 propulsion-inhibited 상태다.',linkedRequirements:['SWR-PROP-004'],linkedTestCases:['TC-PROP-NORMAL-006A'],status:'APPROVED',provenance:'TRACKBACK_MODEL' },
  { id:'SYSR-PROP-006',level:'SYSTEM',allocatedComponent:'PropulsionFunction',statement:'Actual GearState N은 VALID, magnitude 0, direction NONE인 정상 propulsion-inhibited 상태다.',linkedRequirements:['SWR-PROP-004'],linkedTestCases:['TC-PROP-NORMAL-006B'],status:'APPROVED',provenance:'TRACKBACK_MODEL' },
  { id:'SYSR-PROP-007',level:'SYSTEM',allocatedComponent:'PropulsionFunction',statement:'D에서 valid non-zero accelerator input은 FORWARD propulsion request를 생성한다.',linkedRequirements:['SWR-PROP-004'],linkedTestCases:['TC-PROP-NORMAL-007','TC-PROP-NORMAL-011'],status:'APPROVED',provenance:'TRACKBACK_MODEL' },
  { id:'SYSR-PROP-008',level:'SYSTEM',allocatedComponent:'PropulsionFunction',statement:'R에서 valid non-zero accelerator input은 REVERSE propulsion request를 생성한다.',linkedRequirements:['SWR-PROP-004'],linkedTestCases:['TC-PROP-NORMAL-008','TC-PROP-NORMAL-012'],status:'APPROVED',provenance:'TRACKBACK_MODEL' },
  { id:'SYSR-GEAR-001',level:'SYSTEM',allocatedComponent:'GearLogic',statement:'D와 R 사이의 요청은 configured maximum speed 이하에서만 GearState에 반영하며 그 외에는 이전 state를 유지한다.',linkedRequirements:['SWR-GEAR-001'],linkedTestCases:['TC-PROP-NORMAL-013','TC-PROP-NORMAL-014'],status:'APPROVED',provenance:'TRACKBACK_MODEL' },
  { id:'SYSR-PROP-009',level:'SYSTEM',allocatedComponent:'VMC',statement:'Valid propulsion request는 방향과 일치하고 승인된 방향별 한계를 넘지 않는 non-negative eDrive command를 생성한다.',linkedRequirements:['SWR-VMC-001','SWR-EDR-001'],linkedTestCases:['TC-PROP-NORMAL-009','TC-PROP-NORMAL-010A','TC-PROP-NORMAL-010B'],status:'APPROVED',provenance:'TRACKBACK_MODEL' },
  { id:'SYSR-PROP-010',level:'SYSTEM',allocatedComponent:'VehiclePhysics',statement:'승인된 응답 시험 구간에서 valid non-zero command는 configured response window 안에 명령 방향과 일치하는 finite longitudinal response를 생성한다.',linkedRequirements:['SWR-PHY-001'],linkedTestCases:['TC-PROP-NORMAL-011','TC-PROP-NORMAL-012'],status:'APPROVED',provenance:'TRACKBACK_MODEL' },
  { id:'SYSR-PROP-011',level:'SYSTEM',allocatedComponent:'VehiclePhysics',statement:'VehicleSpeed는 linear velocity vector magnitude이고 LongitudinalVelocity는 vehicle forward-axis component이다.',linkedRequirements:['SWR-PHY-001','SWR-PHY-002'],linkedTestCases:['TC-PROP-NORMAL-011','TC-PROP-NORMAL-012'],status:'APPROVED',provenance:'TRACKBACK_MODEL' },
  { id:'SWR-PROP-001',level:'SOFTWARE',allocatedComponent:'PropulsionFunction',statement:'VehicleReady와 PropulsionEnable로 PropulsionState를 계산하고 disabled 상태의 non-zero request를 차단한다.',linkedRequirements:['SYSR-PROP-001'],linkedTestCases:['TC-PROP-NORMAL-001','TC-PROP-NORMAL-002'],status:'APPROVED',provenance:'TRACKBACK_MODEL' },
  { id:'SWR-PROP-002',level:'SOFTWARE',allocatedComponent:'PropulsionFunction',statement:'Accelerator 또는 GearState가 INVALID이면 magnitude 0, direction NONE, validity INVALID를 출력한다.',linkedRequirements:['SYSR-PROP-002'],linkedTestCases:['TC-PROP-NORMAL-003'],status:'APPROVED',provenance:'TRACKBACK_MODEL' },
  { id:'SWR-PROP-003',level:'SOFTWARE',allocatedComponent:'PropulsionFunction',statement:'유효한 입력에 승인된 pedal map을 적용하고 magnitude를 0부터 1 사이로 제한한다.',linkedRequirements:['SYSR-PROP-003','SYSR-PROP-004'],linkedTestCases:['TC-PROP-NORMAL-004','TC-PROP-NORMAL-005'],status:'APPROVED',provenance:'TRACKBACK_MODEL' },
  { id:'SWR-PROP-004',level:'SOFTWARE',allocatedComponent:'PropulsionFunction',statement:'Actual GearState에 따라 P와 N은 추진을 억제하고 D는 FORWARD, R은 REVERSE 방향을 선택한다.',linkedRequirements:['SYSR-PROP-005','SYSR-PROP-006','SYSR-PROP-007','SYSR-PROP-008'],linkedTestCases:['TC-PROP-NORMAL-006A','TC-PROP-NORMAL-006B','TC-PROP-NORMAL-007','TC-PROP-NORMAL-008'],status:'APPROVED',provenance:'TRACKBACK_MODEL' },
  { id:'SWR-GEAR-001',level:'SOFTWARE',allocatedComponent:'GearLogic',statement:'D와 R 사이의 GearRequest에 방향 전환 interlock을 적용하고 조건 미충족 시 이전 GearState를 유지한다.',linkedRequirements:['SYSR-GEAR-001'],linkedTestCases:['TC-PROP-NORMAL-013','TC-PROP-NORMAL-014'],status:'APPROVED',provenance:'TRACKBACK_MODEL' },
  { id:'SWR-VMC-001',level:'SOFTWARE',allocatedComponent:'VMC',statement:'유효한 normalized propulsion request를 방향별 calibration으로 non-negative torque magnitude로 변환하고 direction과 validity를 보존한다.',linkedRequirements:['SYSR-PROP-009'],linkedTestCases:['TC-PROP-NORMAL-009'],status:'APPROVED',provenance:'TRACKBACK_MODEL' },
  { id:'SWR-EDR-001',level:'SOFTWARE',allocatedComponent:'eDrive',statement:'Torque magnitude를 승인된 방향별 한계로 제한하고 direction과 validity를 보존한다.',linkedRequirements:['SYSR-PROP-009'],linkedTestCases:['TC-PROP-NORMAL-010A','TC-PROP-NORMAL-010B'],status:'APPROVED',provenance:'TRACKBACK_MODEL' },
  { id:'SWR-PHY-001',level:'SOFTWARE',allocatedComponent:'VehiclePhysics',statement:'최종 physics adapter 경계에서만 logical direction을 signed physical actuation으로 변환하고 longitudinal feedback을 발행한다.',linkedRequirements:['SYSR-PROP-010','SYSR-PROP-011'],linkedTestCases:['TC-PROP-NORMAL-011','TC-PROP-NORMAL-012'],status:'APPROVED',provenance:'TRACKBACK_MODEL' },
  { id:'SWR-PHY-002',level:'SOFTWARE',allocatedComponent:'VehiclePhysics',statement:'VehicleSpeed를 velocity vector magnitude로, LongitudinalVelocity를 vehicle forward-axis component로 서로 독립 계산한다.',linkedRequirements:['SYSR-PROP-011'],linkedTestCases:['TC-PROP-NORMAL-011','TC-PROP-NORMAL-012'],status:'APPROVED',provenance:'TRACKBACK_MODEL' },
]

export const propulsionTests: GroundTruthTestCase[] = [
  {id:'TC-PROP-NORMAL-006A',verificationLevel:'SW_COMPONENT',testObject:'PropulsionFunction',precondition:'활성화, 유효 입력, GearState P',stimulus:'가속 페달 입력 > 0',observation:'PropulsionRequest',expectedResult:'VALID / 0 / NONE'},
  {id:'TC-PROP-NORMAL-006B',verificationLevel:'SW_COMPONENT',testObject:'PropulsionFunction',precondition:'활성화, 유효 입력, GearState N',stimulus:'가속 페달 입력 > 0',observation:'PropulsionRequest',expectedResult:'VALID / 0 / NONE'},
  {id:'TC-PROP-NORMAL-007',verificationLevel:'SW_COMPONENT',testObject:'PropulsionFunction',precondition:'활성화, 유효 입력, GearState D',stimulus:'가속 페달 입력 > 0',observation:'PropulsionRequest',expectedResult:'VALID / magnitude > 0 / FORWARD'},
  {id:'TC-PROP-NORMAL-008',verificationLevel:'SW_COMPONENT',testObject:'PropulsionFunction',precondition:'활성화, 유효 입력, GearState R',stimulus:'가속 페달 입력 > 0',observation:'PropulsionRequest',expectedResult:'VALID / magnitude > 0 / REVERSE'},
  {id:'TC-PROP-NORMAL-009',verificationLevel:'SW_INTEGRATION',testObject:'PropulsionFunction → VMC',precondition:'승인된 시뮬레이션 맵 로드',stimulus:'유효한 요구값 표본 입력',observation:'DriveTorqueRequest',expectedResult:'보정된 음이 아닌 크기, 방향과 유효성 보존'},
  {id:'TC-PROP-NORMAL-010A',verificationLevel:'SW_COMPONENT',testObject:'eDrive',precondition:'전진 한계값 로드',stimulus:'전진 한계 전후 요구값',observation:'EDriveCommand',expectedResult:'크기가 전진 한계 이내로 제한됨'},
  {id:'TC-PROP-NORMAL-010B',verificationLevel:'SW_COMPONENT',testObject:'eDrive',precondition:'후진 한계값 로드',stimulus:'후진 한계 전후 요구값',observation:'EDriveCommand',expectedResult:'크기가 후진 한계 이내로 제한됨'},
  {id:'TC-PROP-NORMAL-011',verificationLevel:'SYSTEM_SIMULATION',testObject:'Complete chain',precondition:'정지 근접 상태, GearState D, 평탄 도로',stimulus:'0이 아닌 유효한 전진 요구',observation:'가속도, 종방향 속도, 차량 속력',expectedResult:'전진 가속 발생, 응답 시간 내 종방향 속도 > 0, 차량 속력 >= 0'},
  {id:'TC-PROP-NORMAL-012',verificationLevel:'SYSTEM_SIMULATION',testObject:'Complete chain',precondition:'정지 근접 상태, GearState R, 후진 공간 확보',stimulus:'0이 아닌 유효한 후진 요구',observation:'가속도, 종방향 속도, 차량 속력',expectedResult:'후진 가속 발생, 응답 시간 내 종방향 속도 < 0, 차량 속력 >= 0'},
  {id:'TC-PROP-NORMAL-013',verificationLevel:'SW_COMPONENT',testObject:'GearLogic',precondition:'D 또는 R, 속도가 기준 이하',stimulus:'반대 방향 기어 요청',observation:'GearState',expectedResult:'요청 상태 반영'},
  {id:'TC-PROP-NORMAL-014',verificationLevel:'SW_COMPONENT',testObject:'GearLogic',precondition:'D 또는 R, 속도가 기준 초과',stimulus:'반대 방향 기어 요청',observation:'GearRequest and GearState',expectedResult:'이전 GearState 유지'},
]

export const requirementIdsByNode: Record<XRayNodeId, string[]> = {
  DriverInput: ['SYSR-PROP-002','SYSR-PROP-003','SWR-PROP-002'], GearLogic: ['SYSR-GEAR-001','SWR-GEAR-001'],
  PropulsionFunction: ['SYSR-PROP-001','SYSR-PROP-002','SYSR-PROP-003','SYSR-PROP-004','SYSR-PROP-005','SYSR-PROP-006','SYSR-PROP-007','SYSR-PROP-008','SWR-PROP-001','SWR-PROP-002','SWR-PROP-003','SWR-PROP-004'],
  VMC: ['SYSR-PROP-009','SWR-VMC-001'], eDrive: ['SYSR-PROP-009','SWR-EDR-001'], VehiclePhysics: ['SYSR-PROP-010','SYSR-PROP-011','SWR-PHY-001','SWR-PHY-002'],
}

