import type { Graph, Wire } from '../engine/types.ts'
export interface Lesson { title: string; say: string; why: string; visible: string[]; connections: Omit<Wire, 'id'>[] }
const link = (from: string, to: string, input = 'value', out = 'value') => ({ from, to, in: input, out })
export const LESSONS: Lesson[][] = [
  [
    { title: '버튼과 브레이크를 함께', say: 'AND는 두 가지가 모두 참이어야 켜져. 먼저 버튼과 브레이크를 이 블록으로 모아 보자!', why: '두 입력을 동시에 확인하는 논리 조건', visible: ['power','brake','both'], connections: [link('power','both','a'),link('brake','both','b')] },
    { title: '차량의 준비도 확인해요', say: '운전자만 준비했다고 출발할 수는 없어. 방금 만든 결과와 시스템 준비를 한 번 더 묶자.', why: '앞에서 만든 조건을 다른 조건과 조합하기', visible: ['both','system','allow'], connections: [link('both','allow','a'),link('system','allow','b')] },
    { title: '이제 요청을 내보내요', say: '마지막 결과를 진입 요청으로 보내 줘. 아직 실제 READY가 켜지는 건 아니야. 그건 다음 장에서!', why: '조건 계산과 상태 변경은 다른 역할', visible: ['allow','request'], connections: [link('allow','request')] },
  ],
  [
    { title: '첫 누름은 전원을 깨워요', say: '전원 꺼짐에서 버튼을 누르면 시동 대기로. 보라색 상태 포트는 미리 연결했어. 파란 전이 조건에 버튼을 연결해 줘.', why: '현재 상태에 따라 입력을 다르게 해석하기', visible: ['power','wake'], connections: [link('power','wake','when')] },
    { title: '준비 조건이 맞으면 READY', say: '지난 장의 조건을 기억하지? 그 결과를 주행 준비 전이에 연결하면 돼.', why: '이미 만든 기능을 상태 전이에 재사용하기', visible: ['allow','start'], connections: [link('allow','start','when')] },
    { title: '멈췄을 때만 전원을 꺼요', say: '이번 가상 차량에서는 버튼을 누르고 차가 멈춰 있어야 종료해. AND로 두 조건을 묶어 보자.', why: '종료 조건도 검증해야 해요', visible: ['power','stopped','shutdown','stop'], connections: [link('power','shutdown','a'),link('stopped','shutdown','b'),link('shutdown','stop','when')] },
    { title: '차량의 상태를 계기판으로', say: '주행 준비 상태의 「현재 활성」 신호를 표시등과 구동 허용으로 보내자. 상태 값 포트와 헷갈리지 않기!', why: '상태에서 실제 표시와 허용 출력을 만들기', visible: ['ready','lamp','drive'], connections: [link('ready','lamp','value','active'),link('ready','drive','value','active')] },
  ],
  [{ title: '내 설계를 다시 살펴봐요', say: '이제 나는 테스트 담당이야. 정상 시동뿐 아니라 시동이 걸리면 안 되는 상황도 예상해 볼 거야.', why: '제작자와 검증자의 역할 바꾸기', visible: ['power','brake','system','allow','ready','lamp','drive'], connections: [] }],
]
export function lessonComplete(graph: Graph, lesson: Lesson) {
  return lesson.connections.every(target => graph.edges.some(edge => edge.from === target.from && edge.to === target.to && edge.in === target.in && edge.out === target.out))
}
export const TRIALS = [ ['logic-7','logic-5','logic-6'], ['boot','off','moving','held'], ['boot','no-brake','not-ready','held'] ]
export const CHAPTER_NAMES = ['첫 번째 불빛', '차량의 작은 기억', '꼼꼼한 테스트 친구']
