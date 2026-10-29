import type { BlockKind, Port } from './types.ts'
const bool = (id: string, label: string): Port => ({ id, label, type: 'boolean' })
const state = (id: string, label: string): Port => ({ id, label, type: 'state' })
export const BLOCKS: Record<BlockKind, { name: string; help: string; inputs: Port[]; outputs: Port[] }> = {
  input: { name: '입력', help: '외부 조건을 읽어요', inputs: [], outputs: [bool('value', '신호')] },
  and: { name: 'AND', help: '두 조건을 모두 만족', inputs: [bool('a', '조건 A'), bool('b', '조건 B')], outputs: [bool('value', '결과')] },
  or: { name: 'OR', help: '하나라도 만족', inputs: [bool('a', '조건 A'), bool('b', '조건 B')], outputs: [bool('value', '결과')] },
  not: { name: 'NOT', help: '조건을 반대로', inputs: [bool('a', '조건')], outputs: [bool('value', '결과')] },
  state: { name: '상태', help: '현재 상태와 비교해요', inputs: [], outputs: [state('value', '상태 값'), bool('active', '현재 활성')] },
  transition: { name: '상태 전이', help: '조건에 따라 상태 변경', inputs: [state('from', '출발 상태'), state('to', '도착 상태'), bool('when', '전이 조건')], outputs: [bool('value', '조건 충족')] },
  output: { name: '출력', help: '계산 결과를 내보내요', inputs: [bool('value', '입력')], outputs: [] },
}
export const valueKey = (id: string, port = 'value') => `${id}:${port}`
