import type { FaultCase } from '../domain/episode'

export const episodeOne: FaultCase = {
  id: 'CASE-LV-001',
  order: 1,
  title: '다시 출발할 수 없어!',
  symptom: '검증 지점에서 전원을 다시 켰지만 DRIVE READY가 켜지지 않는다.',
  frequencyBasis: 'ADAC 2025 고장출동 기준 12V 배터리 관련 45.4% — 단일 부품군 중 가장 빈번',
  mission: '세 검증 지점에 주행 로그를 전달하고, 두 번째 지점에서 정차·재시동 절차를 수행하세요.',
  incident: {
    request: '브레이크 ON · 전원 버튼 · 기어 P',
    condition: '검증 지점 정차 · 외기 8°C · 12V 부하 인가',
    response: '12V 전압 9.4V로 강하 · DRIVE READY 진입 실패',
  },
  flow: [
    {
      id: 'driver-request',
      label: 'Driver Request',
      role: '운전자의 시동 요청과 브레이크 입력을 수집합니다.',
      actual: 'Start ON · Brake ON',
      expected: 'Start ON · Brake ON',
      state: 'normal',
      source: 'TRACKBACK RUNTIME FACT',
    },
    {
      id: 'start-precondition',
      label: 'Start Preconditions',
      role: '기어와 브레이크 등 READY 진입 전제조건을 확인합니다.',
      actual: 'P · Brake ON',
      expected: 'P · Brake ON',
      state: 'normal',
      source: 'SIMULATION ASSUMPTION',
    },
    {
      id: 'lv-supply',
      label: '12V Supply',
      role: '저전압 전장 시스템에 공급되는 전압을 나타냅니다.',
      actual: '9.4 V under load',
      expected: '≥ 11.5 V under load',
      state: 'abnormal',
      source: 'SIMULATION ASSUMPTION',
    },
    {
      id: 'power-control',
      label: 'Power Control',
      role: '전원 상태를 판단하고 고전압 시스템 활성화를 요청합니다.',
      actual: 'Activation blocked',
      expected: 'Activation allowed',
      state: 'blocked',
      source: 'SIMULATION ASSUMPTION',
    },
    {
      id: 'drive-ready',
      label: 'DRIVE READY',
      role: '차량이 주행 가능한 상태인지 운전자에게 표시합니다.',
      actual: 'OFF',
      expected: 'ON',
      state: 'blocked',
      source: 'OWNER MANUAL FACT',
    },
  ],
}

export const caseRoadmap = [
  { order: 1, title: '12V 배터리 저전압/열화', prevalence: '45.4%', status: 'MVP 구현' },
  { order: 2, title: '구동·엔진관리/HV 출력 제한', prevalence: '21.8%', status: '기존 scaling case 재작성' },
  { order: 3, title: '발전·저전압 전장·조명 이상', prevalence: '10.4%', status: '설계 예정' },
  { order: 4, title: '타이어 저압 vs TPMS 시스템 이상', prevalence: '8.9% tire category', status: '매뉴얼 근거 확보' },
  { order: 5, title: '키·도어 잠금/인증 이상', prevalence: '6.8%', status: '설계 예정' },
  { order: 6, title: '센서 오염 vs ADAS 고장', prevalence: '공개 순위 밖', status: '교육 가치 우선 보너스' },
] as const

