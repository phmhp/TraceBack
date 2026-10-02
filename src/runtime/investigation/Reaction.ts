import type { InvestigationActionType } from './InvestigationSession'

export type CatReactionState =
  | 'CAT_NORMAL'
  | 'CAT_FAULT'
  | 'CAT_THINKING'
  | 'CAT_INVESTIGATING'
  | 'CAT_CLUE_FOUND'
  | 'CAT_WRONG'
  | 'CAT_SOLVED'
  | 'CAT_REPAIRED'

export function reactionForInvestigationEvent(type:InvestigationActionType,outcome?:'OBSERVED'|'MATCH'|'MISMATCH'|'REFERENCE',conclusionCorrect?:boolean):CatReactionState {
  if(type==='CONCLUSION_CONFIRMED')return 'CAT_SOLVED'
  if(type==='CONCLUSION_SUBMITTED')return conclusionCorrect===false?'CAT_WRONG':'CAT_THINKING'
  if(type==='MEANINGFUL_DISCOVERY')return outcome==='MISMATCH'||outcome==='MATCH'?'CAT_CLUE_FOUND':'CAT_INVESTIGATING'
  if(type==='EVIDENCE_SAVED'||type==='TEST_EXECUTED'||type==='TEST_RESULT_INTERPRETED')return 'CAT_INVESTIGATING'
  if(type==='REVIEW_PHENOMENON'||type==='HYPOTHESIS_CREATED'||type==='EXPECTED_BASIS_IDENTIFIED')return 'CAT_THINKING'
  return 'CAT_NORMAL'
}
