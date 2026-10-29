export interface VerificationMissionBrief {
  id: string
  caseId: string
  requestFrom: string
  title: string
  symptom: string
  playerGoal: string
  routeContract: readonly string[]
  observationContract: readonly string[]
  successCondition: string
}

/**
 * Player-visible mission contract.
 *
 * This deliberately describes the reported symptom and the test duty, not the
 * hidden root cause. The answer remains in the case definition and must be
 * supported by evidence in the investigation workspace.
 */
export const PROPULSION_RESPONSE_MISSION: VerificationMissionBrief = {
  id: 'MISSION-PROP-RESPONSE-001',
  caseId: 'CASE-PT-001',
  requestFrom: 'TRACKBACK 차량 검증팀',
  title: '도심 구간 가속 응답 검증',
  symptom: '운전자는 D 주행 중 가속 페달을 밟아도 차량이 기대만큼 나가지 않는다고 제보했습니다.',
  playerGoal: '교통 흐름을 지키며 이상을 재현하고, 원인을 단정하지 않은 상태로 조사에 필요한 사건 기록을 확보하세요.',
  routeContract: [
    '체크포인트를 따라 시험 구간에 진입',
    '직선 구간에서 조향을 안정시키고 가속 입력',
    '이상 반응 발생 시 차량을 안전하게 정지',
  ],
  observationContract: [
    '운전자 입력과 실제 차량 반응의 차이',
    '기어·READY 상태와 이상 발생 시점',
    '주변 교통 및 도로 조건',
  ],
  successCondition: '주행 사건 기록을 확보하면 원인 조사실에서 신호·요구사항·시험 결과를 대조할 수 있습니다.',
}
