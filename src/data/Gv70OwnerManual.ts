export type SourceAuthority =
  | 'OWNER_MANUAL_FACT'
  | 'TRACKBACK_MODEL'
  | 'SIMULATION_ASSUMPTION'
  | 'UNVERIFIED_INTERNAL'

export interface SourceClaim {
  id:string
  authority:SourceAuthority
  title:string
  plainLanguage:string
  sourcePath?:string
  manualPage?:number
  pdfPage?:number
  appliesTo:string[]
  limitation:string
}

export const gv70OwnerManualDocument = {
  id:'GV70-OWNER-MANUAL-JKEV-2027-KO',
  title:'제네시스 GV70 취급설명서 (JKEV_2027_ko_KR)',
  sourcePath:'docs/reference/JKEV_2027_ko_KR.pdf',
  sha256:'423397DE234E387B36B8C8AA027C1C1D34317C93BD9A78CF7DF219ED10E35D65',
  applicability:'파일명 기준 2027 판본입니다. 2026년형 적용 여부는 별도 확인이 필요합니다.',
} as const

export const gv70SourceClaims:readonly SourceClaim[] = [
  {
    id:'GV70-OM-READY',authority:'OWNER_MANUAL_FACT',title:'주행 가능(READY) 표시',
    plainLanguage:'READY 표시가 켜져 있을 때 차량을 주행할 수 있으며, 꺼지거나 깜빡이면 이상 가능성을 확인해야 합니다.',
    sourcePath:gv70OwnerManualDocument.sourcePath,manualPage:143,pdfPage:151,
    appliesTo:['VehicleReady','Page1Phenomenon','RaceHUD'],
    limitation:'표시 동작에 대한 운전자 관점 사실이며 내부 ECU, 통신 신호 또는 고장 판정 알고리즘을 설명하지 않습니다.',
  },
  {
    id:'GV70-OM-SHIFT-DIRECTION',authority:'OWNER_MANUAL_FACT',title:'주행 방향 변경 전 완전 정차',
    plainLanguage:'전진과 후진 방향을 바꾸기 전에는 차량을 완전히 정차해야 합니다.',
    sourcePath:gv70OwnerManualDocument.sourcePath,manualPage:327,pdfPage:335,
    appliesTo:['GearLogic','SWR-GEAR-001','TC-PROP-NORMAL-013','TC-PROP-NORMAL-014'],
    limitation:'매뉴얼은 TRACKBACK의 0.5 m/s 판정값이나 내부 GearLogic 구현을 규정하지 않습니다.',
  },
  {
    id:'TRACKBACK-GEAR-INTERLOCK',authority:'TRACKBACK_MODEL',title:'기어 방향 전환 인터록 실행 모델',
    plainLanguage:'TRACKBACK C/WASM은 설정된 속도 기준 이하에서만 D/R 방향 전환 요청을 반영합니다.',
    appliesTo:['GearLogic','SWR-GEAR-001','TC-PROP-NORMAL-013','TC-PROP-NORMAL-014'],
    limitation:'교육용 실행 모델이며 GV70 내부 소프트웨어 사양이 아닙니다.',
  },
  {
    id:'TRACKBACK-GEAR-THRESHOLD',authority:'SIMULATION_ASSUMPTION',title:'기어 방향 전환 속도 기준',
    plainLanguage:'현재 시험의 방향 전환 기준은 TRACKBACK calibration의 0.5 m/s입니다.',
    appliesTo:['CAL-GEAR-DIR-CHANGE-MAX-SPEED','GearLogic'],
    limitation:'플레이테스트 가능한 시뮬레이션 가정이며 OEM 임계값으로 해석하면 안 됩니다.',
  },
  {
    id:'GV70-INTERNAL-UNVERIFIED',authority:'UNVERIFIED_INTERNAL',title:'GV70 내부 구현 정보',
    plainLanguage:'ECU 배치, CAN ID, 내부 신호명, DTC, 제어 주기와 판정 임계값은 이 매뉴얼로 확인할 수 없습니다.',
    appliesTo:['ReferenceVehicleRegistry','Architecture','Signal','Interface'],
    limitation:'TRACKBACK Reference Vehicle은 논리적 교육 아키텍처이며 GV70 실제 내부 구조를 의미하지 않습니다.',
  },
] as const

export const getSourceClaim = (id:string) => gv70SourceClaims.find(claim=>claim.id===id)

