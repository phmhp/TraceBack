import type { InvestigationActionType, InvestigationSessionState } from './InvestigationSession'

export type MissionId = 'MISSION_01'|'MISSION_02'|'MISSION_03'|'MISSION_04'|'MISSION_05'|'MISSION_06'|'MISSION_07'

export interface InvestigationMissionDefinition {
  id: MissionId
  number: number
  title: string
  objective: string
  hint?: string
  completionEvents: InvestigationActionType[]
}

export interface InvestigationMission extends InvestigationMissionDefinition {
  completed: boolean
  current: boolean
}

export const propulsionEpisodeMissions: readonly InvestigationMissionDefinition[] = [
  { id:'MISSION_01',number:1,title:'사건 상황 확인',objective:'입력과 차량 반응을 확인하세요.',hint:'입력 → 운행 조건 → 차량 반응 순서로 살펴보세요.',completionEvents:['REVIEW_PHENOMENON'] },
  { id:'MISSION_02',number:2,title:'관련 기능 찾기',objective:'차량 반응과 연결된 기능을 찾으세요.',hint:'차량 반응에서 한 단계씩 상류로 거슬러 올라가세요.',completionEvents:['INSPECT_COMPONENT'] },
  { id:'MISSION_03',number:3,title:'값 비교하기',objective:'어디서부터 값이 달라지는지 확인하세요.',hint:'정상으로 확인된 값도 범위를 좁히는 단서입니다.',completionEvents:['MEANINGFUL_DISCOVERY'] },
  { id:'MISSION_04',number:4,title:'기준 확인하기',objective:'원래 동작 기준을 확인하세요.',hint:'Expected의 근거가 궁금할 때 정비 매뉴얼을 확인하세요.',completionEvents:['EXPECTED_BASIS_IDENTIFIED'] },
  { id:'MISSION_05',number:5,title:'가설 세우기',objective:'의심 위치와 예상을 정하세요.',completionEvents:['HYPOTHESIS_CREATED'] },
  { id:'MISSION_06',number:6,title:'가설 시험하기',objective:'조건을 바꿔 가설을 시험하세요.',hint:'PASS/FAIL은 시험한 동작의 판정이며 근본 원인 확정이 아닙니다.',completionEvents:['TEST_RESULT_INTERPRETED'] },
  { id:'MISSION_07',number:7,title:'결론 제출하기',objective:'근거를 골라 결론을 제출하세요.',completionEvents:['CONCLUSION_SUBMITTED'] },
]

export function deriveInvestigationMissions(state: InvestigationSessionState): InvestigationMission[] {
  const acted=(types:readonly InvestigationActionType[])=>types.some(type=>state.actions.some(action=>action.type===type))
  const completion=propulsionEpisodeMissions.map(mission=>mission.id==='MISSION_03'
    ? state.discoveredFindings.some(finding=>['SIGNAL','BOUNDARY'].includes(finding.kind)&&(finding.outcome==='MATCH'||finding.outcome==='MISMATCH'))
    : mission.id==='MISSION_06'
      ? state.discoveredFindings.filter(finding=>finding.kind==='TEST_RESULT').length>=2
      : acted(mission.completionEvents))
  const currentIndex=Math.max(0,completion.findIndex(done=>!done))
  const allComplete=completion.every(Boolean)
  return propulsionEpisodeMissions.map((mission,index)=>({
    ...mission,
    completed:Boolean(completion[index]),
    current:allComplete?index===propulsionEpisodeMissions.length-1:index===currentIndex,
  }))
}
