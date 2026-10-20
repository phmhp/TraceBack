import type { Mission } from '../engine/types'
export function RequirementBrief({ mission }: { mission: Mission }) {
  return <section className="requirement-brief"><span>📋 이번 의뢰의 요구사항</span><p>{mission.goal}</p><details><summary>정상 흐름 · 검사 기준 보기</summary><ol>{(mission.mode === 'logic' ? ['버튼 + 브레이크 + 시스템 준비를 함께 확인', '모두 참일 때만 READY 진입 요청 = 참', '이 장에서는 실제 상태 변경·차량 구동 없음'] : ['OFF → 버튼의 새 누름 → STANDBY', '브레이크·시스템 준비 + 새 누름 → READY', 'READY 표시·구동 허용 출력 → 주행 가능', '정차 + 새 누름 → OFF / 버튼 유지로 연속 전이 금지']).map(text => <li key={text}>{text}</li>)}</ol><small>게임용 가상 차량 사양 · 요구사항과 기대값은 내 연결과 독립적입니다.</small></details></section>
}
